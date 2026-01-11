const prisma = require("../config/database");
const { cloudinary } = require("../config/cloudinary");
const { generateNomorSurat } = require("../utils/helpers");
const ExcelJS = require("exceljs");

// Get all surat keluar (filtered by role)
const getAllSuratKeluar = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let whereCondition = {};

    // Admin sees all, others see only disposed to them or created by them
    // Admin sees all, others see only disposed to them or created by them
    if (role !== "SEKRETARIS_KANTOR") {
      const orConditions = [
        { disposisi: { some: { toUserId: userId } } },
        { disposisi: { some: { fromUserId: userId } } },
        { createdById: userId },
      ];

      // Ketua only sees letters that have been disposed to them
      // No additional status-based visibility for Ketua Surat Keluar
      // (They must receive disposisi from Sekpeng/Bendahara first)

      // Sekpeng/Bendahara sees letters waiting for validation (PENGAJUAN/MENUNGGU_VALIDASI)
      if (["SEKRETARIS_PENGURUS", "BENDAHARA"].includes(role)) {
        orConditions.push({ status: "PENGAJUAN" });
        orConditions.push({ status: "MENUNGGU_VALIDASI" });
      }

      whereCondition = {
        OR: orConditions,
      };
    }

    const suratKeluar = await prisma.suratKeluar.findMany({
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
        suratMasuk: {
          select: { id: true, nomorSurat: true, perihal: true },
        },
        _count: {
          select: { lampiran: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ suratKeluar });
  } catch (error) {
    console.error("Get surat keluar error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get surat keluar by ID
const getSuratKeluarById = async (req, res) => {
  try {
    const { id } = req.params;

    const suratKeluar = await prisma.suratKeluar.findUnique({
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
        suratMasuk: true,
      },
    });

    if (!suratKeluar) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    // Mark as read if viewed by someone other than creator (e.g. Admin viewing a request)
    if (req.user.id !== suratKeluar.createdById && !suratKeluar.isRead) {
      await prisma.suratKeluar.update({
        where: { id },
        data: { isRead: true },
      });
      suratKeluar.isRead = true; // Update local object
    }

    res.json({ suratKeluar });
  } catch (error) {
    console.error("Get surat keluar by id error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create surat keluar (Admin only)
const createSuratKeluar = async (req, res) => {
  try {
    const { tujuan, perihal, keterangan, suratMasukId, jenisSuratId } =
      req.body;

    let fileUrl = null;
    let filePublicId = null;

    if (req.file) {
      fileUrl = req.file.path;
      filePublicId = req.file.filename;
    }

    console.log("Create Surat Keluar Request:", {
      userRole: req.user.role,
      body: req.body,
      file: req.file ? "Present" : "None",
    });

    // ALL roles get immediate numbering with their own counter
    // Non-Admin (Kabag/Ketua/etc) → status PENGAJUAN (needs admin approval)
    // Admin → status DIPROSES (direct)

    const isAdmin = req.user.role === "SEKRETARIS_KANTOR";

    // Determine kode jenis
    let kodeJenis = "SK";
    if (jenisSuratId) {
      const jenis = await prisma.jenisSurat.findUnique({
        where: { id: jenisSuratId },
      });
      if (jenis) kodeJenis = jenis.kode;
    }

    // Determine kode bagian based on creator's role from DB
    const kodeBagianData = await prisma.kodeBagian.findUnique({
      where: { role: req.user.role },
    });

    // Default to SEK/Internal if not found or no mapping
    const kodeBagian = kodeBagianData ? kodeBagianData.kodeInternal : "SEK";
    const kodeArea = req.body.kodeArea || "A"; // Default to A if missing

    // Generate number immediately for ALL roles (each uses their own counter)
    let nomorSurat = await generateNomorSurat(kodeJenis, kodeArea, kodeBagian);
    let tanggalSurat = new Date();
    // Non-Admin still goes to PENGAJUAN (needs approval), Admin goes to DIPROSES
    let status = isAdmin ? "DIPROSES" : "PENGAJUAN";

    const suratKeluar = await prisma.suratKeluar.create({
      data: {
        nomorSurat,
        tanggalSurat,
        tujuan,
        perihal,
        jenisSuratId: jenisSuratId || null, // Ensure empty string becomes null
        kodeArea: req.body.kodeArea || null, // Store requested area code
        keterangan,
        fileUrl,
        filePublicId,
        createdById: req.user.id,
        suratMasukId: suratMasukId || null,
        status,
      },
      include: {
        createdBy: {
          select: { id: true, nama: true, role: true },
        },
      },
    });

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: "Pengajuan surat keluar",
        keterangan: `Surat nomor ${nomorSurat} untuk ${tujuan} dibuat oleh ${req.user.nama}`,
        userId: req.user.id,
        suratKeluarId: suratKeluar.id,
      },
    });

    res.status(201).json({
      message: "Surat keluar berhasil dibuat",
      suratKeluar,
    });
  } catch (error) {
    console.error("Create surat keluar error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// Update surat keluar
const updateSuratKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tujuan,
      perihal,
      keterangan,
      status,
      jenisSuratId,
      variant, // "INTERNAL" or "EKSTERNAL"
      kodeArea, // "A", "B", etc.
      kodeBagianId, // Optional override for "Atas Nama"
    } = req.body;

    const existingSurat = await prisma.suratKeluar.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    let fileUrl = existingSurat.fileUrl;
    let filePublicId = existingSurat.filePublicId;
    let finalFileUrl = existingSurat.finalFileUrl;
    let finalFilePublicId = existingSurat.finalFilePublicId;
    let nomorSuratAdmin = existingSurat.nomorSuratAdmin;
    let tanggalSurat = existingSurat.tanggalSurat;

    // Handle conversions
    if (existingSurat.status === "PENGAJUAN" && status === "DIPROSES") {
      // Just update status, do NOT generate number yet.
    }

    // Handle Final File Upload (This is when we generate the number)
    if (req.file) {
      if (req.body.isFinalFile === "true") {
        // Upload "Surat Resmi" (Final)
        // Ensure status is DISETUJUI or already MENUNGGU_VERIFIKASI/SELESAI before allowing upload?
        // Actually, user flow: DISETUJUI -> Admin Uploads.
        // Also allow re-upload if DIKEMBALIKAN (Option A: Keep same number)

        if (existingSurat.finalFilePublicId) {
          await cloudinary.uploader.destroy(existingSurat.finalFilePublicId);
        }
        finalFileUrl = req.file.path;
        finalFilePublicId = req.file.filename;

        // GENERATE NUMBER IF NOT EXISTS
        if (!nomorSuratAdmin) {
          const targetJenisId = jenisSuratId || existingSurat.jenisSuratId;
          let kodeJenis = "SK";
          if (targetJenisId) {
            const jenis = await prisma.jenisSurat.findUnique({
              where: { id: targetJenisId },
            });
            if (jenis) kodeJenis = jenis.kode;
          }

          // Determine Display Code (Creator's Unit)
          // Determine Display Code (Creator's Unit OR Override)
          let displayKodeBagian = "SEK";
          const targetVariant = variant || "INTERNAL";

          if (kodeBagianId) {
            const overrideBagian = await prisma.kodeBagian.findUnique({
              where: { id: kodeBagianId },
            });
            if (overrideBagian) {
              displayKodeBagian =
                targetVariant === "EKSTERNAL"
                  ? overrideBagian.kodeEksternal
                  : overrideBagian.kodeInternal;
            }
          } else {
            // Default: Based on Creator
            const creator = await prisma.user.findUnique({
              where: { id: existingSurat.createdById },
            });
            const creatorKodeData = await prisma.kodeBagian.findUnique({
              where: { role: creator.role },
            });
            if (creatorKodeData) {
              displayKodeBagian =
                targetVariant === "EKSTERNAL"
                  ? creatorKodeData.kodeEksternal
                  : creatorKodeData.kodeInternal;
            }
          }

          // Determine Counter Scope (Admin/Central)
          const processorRole = req.user.role;
          const processorKodeData = await prisma.kodeBagian.findUnique({
            where: { role: processorRole },
          });
          const counterScope = processorKodeData
            ? processorKodeData.kodeInternal
            : "SEK";

          const targetKodeArea = kodeArea || existingSurat.kodeArea || "A";

          nomorSuratAdmin = await generateNomorSurat(
            kodeJenis,
            targetKodeArea,
            displayKodeBagian,
            counterScope
          );
        }
      } else {
        // Update "Surat Pengajuan" (Draft)
        if (existingSurat.filePublicId) {
          await cloudinary.uploader.destroy(existingSurat.filePublicId);
        }
        fileUrl = req.file.path;
        filePublicId = req.file.filename;
      }
    }

    const suratKeluar = await prisma.suratKeluar.update({
      where: { id },
      data: {
        tujuan,
        perihal,
        keterangan,
        fileUrl,
        filePublicId,
        finalFileUrl,
        finalFilePublicId,
        status: status || existingSurat.status,
        jenisSuratId: jenisSuratId || undefined,
        nomorSuratAdmin, // Save generated number (or existing)
        tanggalSurat,
      },
      include: {
        createdBy: {
          select: { id: true, nama: true, role: true },
        },
      },
    });

    // Add tracking if status changed
    if (status && status !== existingSurat.status) {
      await prisma.trackingSurat.create({
        data: {
          aksi: `Surat diupdate ke ${status}`,
          keterangan: `Status diubah oleh ${req.user.nama}`,
          userId: req.user.id,
          suratKeluarId: suratKeluar.id,
        },
      });
    }

    // Add tracking if file was uploaded
    if (req.file) {
      const fileType =
        req.body.isFinalFile === "true"
          ? "Surat Resmi (Final)"
          : "Surat Pengajuan (Draft)";
      await prisma.trackingSurat.create({
        data: {
          aksi: `Upload File: ${fileType}`,
          keterangan: `File diupload oleh ${req.user.nama}`,
          userId: req.user.id,
          suratKeluarId: suratKeluar.id,
        },
      });
    }

    res.json({
      message: "Surat keluar berhasil diupdate",
      suratKeluar,
    });
  } catch (error) {
    console.error("Update surat keluar error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Validate surat keluar (Sekpeng/Bendahara/Ketua for Verification)
const validateSuratKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, catatan } = req.body;

    const existingSurat = await prisma.suratKeluar.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    let newStatus;
    let aksi;

    if (isApproved) {
      // Verification OK -> SELESAI
      newStatus = "SELESAI";
      aksi = "Surat diverifikasi & Selesai";
    } else {
      newStatus = "DIKEMBALIKAN";
      aksi = "Surat dikembalikan (Gagal Verifikasi)";
    }

    const suratKeluar = await prisma.suratKeluar.update({
      where: { id },
      data: { status: newStatus },
    });

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi,
        keterangan: catatan,
        userId: req.user.id,
        suratKeluarId: id,
      },
    });

    res.json({
      message: isApproved ? "Surat diverifikasi" : "Surat dikembalikan",
      suratKeluar,
    });
  } catch (error) {
    console.error("Validate surat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve surat keluar (Ketua Only - Final Approval)
const approveSuratKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, catatan } = req.body;
    const userRole = req.user.role;

    const existingSurat = await prisma.suratKeluar.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    let updateData = {};
    let aksi;
    const isKetua = userRole === "KETUA_PENGURUS";

    // Only Ketua can "Approve" (Change status to DISETUJUI)
    // Other roles should use Disposisi
    if (!isKetua) {
      // Technically this endpoint shouldn't be called by others in new flow
      // But if they reject, we should allow "DIKEMBALIKAN" maybe?
      // User said: "Kalau sek tolak, selesai (dikembalikan)".
      if (!isApproved) {
        updateData = { status: "DIKEMBALIKAN" };
        aksi = `Surat ditolak oleh ${req.user.nama}`;
      } else {
        return res.status(403).json({
          message:
            "Hanya Ketua yang dapat menyetujui surat. Gunakan Disposisi.",
        });
      }
    } else {
      // Ketua Logic
      if (isApproved) {
        updateData = {
          status: "DISETUJUI",
          isSigned: true,
          signedAt: new Date(),
        };
        aksi = `Surat disetujui oleh Ketua Yayasan (ACC Tanda Tangan)`;
      } else {
        updateData = { status: "DIKEMBALIKAN" };
        aksi = `Surat ditolak oleh Ketua Yayasan`;
      }
    }

    // Only update if there's data to update
    let suratKeluar = existingSurat;
    if (Object.keys(updateData).length > 0) {
      suratKeluar = await prisma.suratKeluar.update({
        where: { id },
        data: updateData,
      });
    }

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi,
        keterangan: catatan,
        userId: req.user.id,
        suratKeluarId: id,
      },
    });

    res.json({
      message: isApproved ? "Surat disetujui" : "Surat dikembalikan",
      suratKeluar,
    });
  } catch (error) {
    console.error("Approve surat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send surat keluar (Admin only)
const sendSuratKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const { ekspedisi, catatan } = req.body;

    const existingSurat = await prisma.suratKeluar.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    // Check if letter has been approved by Ketua (status DISETUJUI)
    if (existingSurat.status !== "DISETUJUI") {
      return res
        .status(400)
        .json({ message: "Surat belum disetujui oleh Ketua Yayasan" });
    }

    const suratKeluar = await prisma.suratKeluar.update({
      where: { id },
      data: {
        status: "SELESAI",
        ekspedisi,
        tanggalKirim: new Date(),
      },
    });

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: `Surat dikirim via ${ekspedisi}`,
        keterangan: catatan,
        userId: req.user.id,
        suratKeluarId: id,
      },
    });

    res.json({
      message: "Surat berhasil dikirim",
      suratKeluar,
    });
  } catch (error) {
    console.error("Send surat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export surat keluar to Excel
const exportSuratKeluar = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let whereCondition = {};

    // Apply same filters as getAllSuratKeluar
    if (role !== "SEKRETARIS_KANTOR") {
      whereCondition = {
        OR: [
          { disposisi: { some: { toUserId: userId } } },
          { disposisi: { some: { fromUserId: userId } } },
          { createdById: userId },
        ],
      };
    }

    const suratKeluar = await prisma.suratKeluar.findMany({
      where: whereCondition,
      include: {
        createdBy: {
          select: { nama: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Surat Keluar");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nomor Surat", key: "nomorSurat", width: 20 },
      { header: "Tujuan", key: "tujuan", width: 25 },
      { header: "Perihal", key: "perihal", width: 30 },
      { header: "Tanggal Surat", key: "tanggalSurat", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    const isAdmin = role === "SEKRETARIS_KANTOR";

    suratKeluar.forEach((surat, index) => {
      // Determine which number to show based on role
      const displayNomor =
        isAdmin && surat.nomorSuratAdmin
          ? surat.nomorSuratAdmin
          : surat.nomorSurat || "-";

      worksheet.addRow({
        no: index + 1,
        nomorSurat: displayNomor,
        tujuan: surat.tujuan,
        perihal: surat.perihal,
        tanggalSurat: surat.tanggalSurat,
        status: surat.status,
      });
    });

    // Style the header
    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Data_Surat_Keluar_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export surat keluar error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete surat keluar
const deleteSuratKeluar = async (req, res) => {
  try {
    const { id } = req.params;

    const existingSurat = await prisma.suratKeluar.findUnique({
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
    await prisma.trackingSurat.deleteMany({ where: { suratKeluarId: id } });
    await prisma.lampiran.deleteMany({ where: { suratKeluarId: id } });
    await prisma.disposisi.deleteMany({ where: { suratKeluarId: id } });

    // Delete the Surat Keluar
    await prisma.suratKeluar.delete({ where: { id } });

    res.json({ message: "Surat keluar berhasil dihapus" });
  } catch (error) {
    console.error("Delete surat keluar error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllSuratKeluar,
  getSuratKeluarById,
  createSuratKeluar,
  updateSuratKeluar,
  validateSuratKeluar,
  approveSuratKeluar,
  sendSuratKeluar,
  deleteSuratKeluar,
  exportSuratKeluar,
};
