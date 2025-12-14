const prisma = require("../config/database");
const { cloudinary } = require("../config/cloudinary");
const { isKabagRole } = require("../utils/helpers");

// Get all surat masuk (filtered by role)
const getAllSuratMasuk = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let whereCondition = {};

    // Admin sees all, others see only disposed to them
    if (role !== "SEKRETARIS_KANTOR") {
      whereCondition = {
        OR: [
          { disposisi: { some: { toUserId: userId } } },
          { disposisi: { some: { fromUserId: userId } } },
        ],
      };
    }

    const suratMasuk = await prisma.suratMasuk.findMany({
      where: whereCondition,
      include: {
        createdBy: {
          select: { id: true, nama: true, role: true },
        },
        disposisi: {
          include: {
            fromUser: { select: { id: true, nama: true, role: true } },
            toUser: { select: { id: true, nama: true, role: true } },
          },
          orderBy: { tanggalDisposisi: "desc" },
        },
        _count: {
          select: { lampiran: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ suratMasuk });
  } catch (error) {
    console.error("Get surat masuk error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get surat masuk by ID
const getSuratMasukById = async (req, res) => {
  try {
    const { id } = req.params;

    const suratMasuk = await prisma.suratMasuk.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, nama: true, role: true },
        },
        disposisi: {
          include: {
            fromUser: { select: { id: true, nama: true, role: true } },
            toUser: { select: { id: true, nama: true, role: true } },
          },
          orderBy: { tanggalDisposisi: "desc" },
        },
        lampiran: {
          include: {
            uploadedBy: { select: { id: true, nama: true, role: true } },
          },
        },
        tracking: {
          include: {
            user: { select: { id: true, nama: true, role: true } },
          },
          orderBy: { timestamp: "desc" },
        },
        suratBalasan: true,
      },
    });

    if (!suratMasuk) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    res.json({ suratMasuk });
  } catch (error) {
    console.error("Get surat masuk by id error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create surat masuk (Admin only)
const createSuratMasuk = async (req, res) => {
  try {
    const {
      nomorSurat,
      tanggalSurat,
      tanggalDiterima,
      pengirim,
      perihal,
      kategori,
      keterangan,
      isLengkap,
      tujuanDisposisiId,
      isInternal,
    } = req.body;

    let fileUrl = null;
    let filePublicId = null;

    if (req.file) {
      fileUrl = req.file.path;
      filePublicId = req.file.filename;
    }

    let uploadResult = null;

    if (req.file) {
      uploadResult = {
        secure_url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // Get intended recipient (tujuan)
    const intendedUser = await prisma.user.findUnique({
      where: { id: tujuanDisposisiId },
      select: { nama: true },
    });

    // Determine actual disposisi target (Ketua Pengurus)
    // If Admin selects someone else, it still goes to Ketua first
    const ketua = await prisma.user.findFirst({
      where: { role: "KETUA_PENGURUS" },
    });

    // Safe fallback if no Ketua exists (should not happen in prod)
    const actualDisposisiTargetId = ketua ? ketua.id : tujuanDisposisiId;
    const actualDisposisiTargetName = ketua ? ketua.nama : intendedUser?.nama;

    const suratMasuk = await prisma.suratMasuk.create({
      data: {
        nomorSurat,
        tanggalSurat: new Date(tanggalSurat),
        tanggalDiterima: new Date(tanggalDiterima),
        pengirim,
        perihal,
        jenisSurat: isInternal ? "INTERNAL" : "EKSTERNAL",
        keterangan,
        tujuan: intendedUser?.nama, // Store intended recipient name
        fileUrl: uploadResult?.secure_url,
        filePublicId: uploadResult?.public_id,
        createdById: req.user.id,
        isLengkap: isLengkap === "true" || isLengkap === true, // Keep original logic for isLengkap
        status: tujuanDisposisiId ? "DISPOSISI" : "DITERIMA", // Set status based on disposisi
      },
      include: {
        createdBy: {
          select: { id: true, nama: true, role: true },
        },
      },
    });

    // Create tracking entry for creation
    await prisma.trackingSurat.create({
      data: {
        aksi: "Surat masuk diterima",
        keterangan: `Surat dari ${pengirim} diterima oleh ${req.user.nama}`,
        userId: req.user.id,
        suratMasukId: suratMasuk.id,
      },
    });

    if (tujuanDisposisiId) {
      // Create Disposisi
      await prisma.disposisi.create({
        data: {
          suratMasukId: suratMasuk.id,
          fromUserId: req.user.id,
          toUserId: actualDisposisiTargetId,
          status: "PENDING",
          catatan: keterangan || "Disposisi awal",
          instruksi: "Mohon ditindaklanjuti",
        },
      });

      // Tracking Disposisi
      await prisma.trackingSurat.create({
        data: {
          aksi: "Surat diteruskan kepada Ketua Yayasan",
          keterangan: `Surat didisposisikan kepada ${actualDisposisiTargetName}`,
          userId: req.user.id,
          suratMasukId: suratMasuk.id,
        },
      });
    }

    res.status(201).json({
      message: "Surat masuk berhasil dibuat",
      suratMasuk,
    });
  } catch (error) {
    console.error("Create surat masuk error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update surat masuk
const updateSuratMasuk = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nomorSurat,
      tanggalSurat,
      tanggalDiterima,
      pengirim,
      perihal,
      keterangan,
      isLengkap,
    } = req.body;

    const existingSurat = await prisma.suratMasuk.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    let fileUrl = existingSurat.fileUrl;
    let filePublicId = existingSurat.filePublicId;

    if (req.file) {
      // Delete old file from Cloudinary
      if (existingSurat.filePublicId) {
        await cloudinary.uploader.destroy(existingSurat.filePublicId);
      }
      fileUrl = req.file.path;
      filePublicId = req.file.filename;
    }

    const suratMasuk = await prisma.suratMasuk.update({
      where: { id },
      data: {
        nomorSurat,
        tanggalSurat: tanggalSurat ? new Date(tanggalSurat) : undefined,
        tanggalDiterima: tanggalDiterima
          ? new Date(tanggalDiterima)
          : undefined,
        pengirim,
        perihal,
        jenisSurat,
        keterangan,
        isLengkap: isLengkap === "true" || isLengkap === true,
        fileUrl,
        filePublicId,
      },
      include: {
        createdBy: {
          select: { id: true, nama: true, role: true },
        },
      },
    });

    res.json({
      message: "Surat masuk berhasil diupdate",
      suratMasuk,
    });
  } catch (error) {
    console.error("Update surat masuk error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update status surat masuk
const updateStatusSuratMasuk = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, keterangan } = req.body;

    const suratMasuk = await prisma.suratMasuk.update({
      where: { id },
      data: { status },
    });

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: `Status diubah menjadi ${status}`,
        keterangan,
        userId: req.user.id,
        suratMasukId: id,
      },
    });

    res.json({
      message: "Status surat berhasil diupdate",
      suratMasuk,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete surat masuk
const deleteSuratMasuk = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSurat = await prisma.suratMasuk.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    // Delete file from Cloudinary
    if (existingSurat.filePublicId) {
      await cloudinary.uploader.destroy(existingSurat.filePublicId);
    }

    // Delete related records first
    await prisma.trackingSurat.deleteMany({ where: { suratMasukId: id } });
    await prisma.lampiran.deleteMany({ where: { suratMasukId: id } });
    await prisma.disposisi.deleteMany({ where: { suratMasukId: id } });

    await prisma.suratMasuk.delete({ where: { id } });

    res.json({ message: "Surat masuk berhasil dihapus" });
  } catch (error) {
    console.error("Delete surat masuk error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark surat as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, nama } = req.user;

    // Check if already marked as read by this user
    const existingLog = await prisma.trackingSurat.findFirst({
      where: {
        suratMasukId: id,
        userId: userId,
        aksi: "DIBACA",
      },
    });

    if (existingLog) {
      return res.json({ message: "Already marked as read" });
    }

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: "DIBACA",
        keterangan: `Surat dibaca/diunduh oleh ${nama}`,
        userId: userId,
        suratMasukId: id,
      },
    });

    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllSuratMasuk,
  getSuratMasukById,
  createSuratMasuk,
  updateSuratMasuk,
  updateStatusSuratMasuk,
  deleteSuratMasuk,
  markAsRead,
};
