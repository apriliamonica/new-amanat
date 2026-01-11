const prisma = require("../config/database");
// Trigger restart 2

// Get disposisi for current user
const getMyDisposisi = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const disposisi = await prisma.disposisi.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: { select: { id: true, nama: true, role: true } },
        toUser: { select: { id: true, nama: true, role: true } },
        suratMasuk: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
            pengirim: true,
            status: true,
            fileUrl: true,
          },
        },
        suratKeluar: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
            tujuan: true,
            status: true,
            fileUrl: true,
            finalFileUrl: true,
          },
        },
      },
      orderBy: { tanggalDisposisi: "desc" },
    });

    // Check which ones have been forwarded by this user
    const suratMasukIds = disposisi
      .filter((d) => d.suratMasukId)
      .map((d) => d.suratMasukId);
    const suratKeluarIds = disposisi
      .filter((d) => d.suratKeluarId)
      .map((d) => d.suratKeluarId);

    const forwarded = await prisma.disposisi.findMany({
      where: {
        fromUserId: userId,
        OR: [
          { suratMasukId: { in: suratMasukIds } },
          { suratKeluarId: { in: suratKeluarIds } },
        ],
      },
      select: { suratMasukId: true, suratKeluarId: true },
    });

    const forwardedSuratMasuk = new Set(
      forwarded.map((f) => f.suratMasukId).filter(Boolean)
    );
    const forwardedSuratKeluar = new Set(
      forwarded.map((f) => f.suratKeluarId).filter(Boolean)
    );

    const results = disposisi.map((d) => ({
      ...d,
      isForwarded: d.suratMasukId
        ? forwardedSuratMasuk.has(d.suratMasukId)
        : forwardedSuratKeluar.has(d.suratKeluarId),
    }));

    res.json({ disposisi: results });
  } catch (error) {
    console.error("Get my disposisi error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all disposisi for a surat
const getDisposisiBySurat = async (req, res) => {
  try {
    const { suratId, type } = req.params;

    const whereCondition =
      type === "masuk" ? { suratMasukId: suratId } : { suratKeluarId: suratId };

    const disposisi = await prisma.disposisi.findMany({
      where: whereCondition,
      include: {
        fromUser: { select: { id: true, nama: true, role: true } },
        toUser: { select: { id: true, nama: true, role: true } },
      },
      orderBy: { tanggalDisposisi: "asc" },
    });

    res.json({ disposisi });
  } catch (error) {
    console.error("Get disposisi by surat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create disposisi
const createDisposisi = async (req, res) => {
  try {
    const {
      instruksi,
      catatan,
      toUserId,
      suratMasukId,
      suratKeluarId,
      isRequestLampiran,
    } = req.body;

    if (!toUserId) {
      return res.status(400).json({ message: "Tujuan disposisi wajib diisi" });
    }

    if (!suratMasukId && !suratKeluarId) {
      return res.status(400).json({ message: "Surat tidak valid" });
    }

    // Update surat status
    if (suratMasukId) {
      await prisma.suratMasuk.update({
        where: { id: suratMasukId },
        data: { status: "DISPOSISI" },
      });
    }
    if (suratKeluarId) {
      if (suratKeluarId) {
        const surat = await prisma.suratKeluar.findUnique({
          where: { id: suratKeluarId },
        });

        const recipient = await prisma.user.findUnique({
          where: { id: toUserId },
          select: { role: true },
        });

        if (surat && recipient) {
          let newStatus = surat.status;

          // 1. If sending to KETUA -> Always change to MENUNGGU_TTD (Final Step)
          if (recipient.role === "KETUA_PENGURUS") {
            newStatus = "MENUNGGU_TTD";
          }
          // 2. If sending to ADMIN (Sekretaris Kantor) -> Back to DIPROSES (for Upload/Revision)
          else if (recipient.role === "SEKRETARIS_KANTOR") {
            newStatus = "DIPROSES";
          }
          // 3. Logic for other transitions
          else {
            if (surat.status === "DIPROSES") {
              newStatus = "MENUNGGU_PERSETUJUAN";
            } else if (surat.status === "DISETUJUI") {
              // Admin has uploaded final file (status was DISETUJUI/Upload), now dispositions for verification
              newStatus = "MENUNGGU_VERIFIKASI";
            } else if (surat.status === "DIKEMBALIKAN") {
              // Check based on whether number exists (implies post-upload vs pre-upload)
              if (surat.nomorSuratAdmin) {
                newStatus = "MENUNGGU_VERIFIKASI";
              } else {
                newStatus = "MENUNGGU_PERSETUJUAN";
              }
            } else if (surat.status === "MENUNGGU_VERIFIKASI") {
              // If chaining verification, status stays MENUNGGU_VERIFIKASI
              newStatus = "MENUNGGU_VERIFIKASI";
            } else if (surat.status === "DITERIMA") {
              newStatus = "MENUNGGU_VERIFIKASI";
            } else if (surat.status === "PENGAJUAN") {
              newStatus = "MENUNGGU_PERSETUJUAN";
            }
          }

          await prisma.suratKeluar.update({
            where: { id: suratKeluarId },
            data: { status: newStatus },
          });
        }
      }
    }

    // Update sender's previous pending disposisi to "DITERUSKAN"
    // This marks the task as handled by the sender since they are forwarding it
    await prisma.disposisi.updateMany({
      where: {
        toUserId: req.user.id,
        [suratMasukId ? "suratMasukId" : "suratKeluarId"]:
          suratMasukId || suratKeluarId,
        status: "PENDING",
      },
      data: { status: "DITERUSKAN" },
    });

    const disposisi = await prisma.disposisi.create({
      data: {
        instruksi,
        catatan,
        fromUserId: req.user.id,
        toUserId,
        suratMasukId,
        suratKeluarId,
        isRequestLampiran: isRequestLampiran || false,
      },
      include: {
        fromUser: { select: { id: true, nama: true, role: true } },
        toUser: { select: { id: true, nama: true, role: true } },
      },
    });

    // Get target user for tracking
    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { nama: true },
    });

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: isRequestLampiran
          ? `Permintaan lampiran dikirim ke ${targetUser.nama}`
          : `Disposisi dikirim ke ${targetUser.nama}`,
        keterangan: instruksi,
        userId: req.user.id,
        suratMasukId,
        suratKeluarId,
      },
    });

    res.status(201).json({
      message: "Disposisi berhasil dibuat",
      disposisi,
    });
  } catch (error) {
    console.error("Create disposisi error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Update disposisi status
const updateDisposisi = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, catatan } = req.body;

    const existingDisposisi = await prisma.disposisi.findUnique({
      where: { id },
    });

    if (!existingDisposisi) {
      return res.status(404).json({ message: "Disposisi tidak ditemukan" });
    }

    const disposisi = await prisma.disposisi.update({
      where: { id },
      data: { status },
      include: {
        fromUser: { select: { id: true, nama: true, role: true } },
        toUser: { select: { id: true, nama: true, role: true } },
      },
    });

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: `Disposisi diupdate: ${status}`,
        keterangan: catatan,
        userId: req.user.id,
        suratMasukId: existingDisposisi.suratMasukId,
        suratKeluarId: existingDisposisi.suratKeluarId,
      },
    });

    res.json({
      message: "Status disposisi berhasil diupdate",
      disposisi,
    });
  } catch (error) {
    console.error("Update disposisi error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Complete disposisi
const completeDisposisi = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;

    const existingDisposisi = await prisma.disposisi.findUnique({
      where: { id },
    });

    if (!existingDisposisi) {
      return res.status(404).json({ message: "Disposisi tidak ditemukan" });
    }

    const disposisi = await prisma.disposisi.update({
      where: { id },
      data: {
        status: "SELESAI",
        tanggalSelesai: new Date(),
      },
      include: {
        fromUser: { select: { id: true, nama: true, role: true } },
        toUser: { select: { id: true, nama: true, role: true } },
      },
    });

    // Update surat status if all disposisi are complete
    const suratId =
      existingDisposisi.suratMasukId || existingDisposisi.suratKeluarId;
    const suratType = existingDisposisi.suratMasukId ? "masuk" : "keluar";

    // Update surat status IMMEDIATELY as per requirement
    // "jika salah satu suda atau penerima disposisi sudah menekan selesai berarti prosesnya sudah selesai"
    if (suratType === "masuk") {
      await prisma.suratMasuk.update({
        where: { id: suratId },
        data: { status: "SELESAI" },
      });
    } else {
      await prisma.suratKeluar.update({
        where: { id: suratId },
        data: { status: "SELESAI" }, // Changed from DITINDAKLANJUTI to SELESAI based on user request implies process finished
      });
    }

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: "Disposisi selesai",
        keterangan: catatan,
        userId: req.user.id,
        suratMasukId: existingDisposisi.suratMasukId,
        suratKeluarId: existingDisposisi.suratKeluarId,
      },
    });

    res.json({
      message: "Disposisi selesai",
      disposisi,
    });
  } catch (error) {
    console.error("Complete disposisi error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMyDisposisi,
  getDisposisiBySurat,
  createDisposisi,
  updateDisposisi,
  completeDisposisi,
};
