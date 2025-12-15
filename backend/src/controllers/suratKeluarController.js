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
    let nomorSurat = existingSurat.nomorSurat;
    let tanggalSurat = existingSurat.tanggalSurat;

    if (req.file) {
      if (req.body.isFinalFile === "true") {
        // Upload "Surat Resmi" (Final)
        if (existingSurat.finalFilePublicId) {
          await cloudinary.uploader.destroy(existingSurat.finalFilePublicId);
        }
        finalFileUrl = req.file.path;
        finalFilePublicId = req.file.filename;
      } else {
        // Update "Surat Pengajuan" (Draft) - standard behavior
        if (existingSurat.filePublicId) {
          await cloudinary.uploader.destroy(existingSurat.filePublicId);
        }
        fileUrl = req.file.path;
        filePublicId = req.file.filename;
      }
    }

    // Handle converting PENGAJUAN to DIPROSES (Admin approves)
    let nomorSuratAdmin = existingSurat.nomorSuratAdmin;

    if (existingSurat.status === "PENGAJUAN" && status === "DIPROSES") {
      // Use provided jenisSuratId or existing one
      const targetJenisId = jenisSuratId || existingSurat.jenisSuratId;
      let kodeJenis = "SK";

      if (targetJenisId) {
        const jenis = await prisma.jenisSurat.findUnique({
          where: { id: targetJenisId },
        });
        if (jenis) kodeJenis = jenis.kode;
      }

      // IMPORTANT: Counter should be based on WHO PROCESSES the surat (Admin)
      // BUT Display (KodeBagian) should remain as the Creator's Unit
      // Example: Admin approves Kabag's letter -> Number increases on Admin's counter, but label is still "PSDM"

      // 1. Determine Display Code (Creator's Unit)
      const creator = await prisma.user.findUnique({
        where: { id: existingSurat.createdById },
      });
      const creatorKodeData = await prisma.kodeBagian.findUnique({
        where: { role: creator.role },
      });
      // Default to "SEK" if creator has no code (e.g. admin created it)
      let displayKodeBagian = creatorKodeData
        ? creatorKodeData.kodeInternal
        : "SEK";

      // If variant is EKSTERNAL, use eksternal code
      const targetVariant = variant || "INTERNAL";
      if (creatorKodeData && targetVariant === "EKSTERNAL") {
        displayKodeBagian = creatorKodeData.kodeEksternal;
      }

      // 2. Determine Counter Scope (Who is processing? Admin)
      const processorRole = req.user.role; // Admin role
      const processorKodeData = await prisma.kodeBagian.findUnique({
        where: { role: processorRole },
      });
      const counterScope = processorKodeData
        ? processorKodeData.kodeInternal
        : "SEK";

      // Use provided kodeArea or fallback to stored/default
      const targetKodeArea = kodeArea || existingSurat.kodeArea || "A";

      // Generate number for ADMIN using HYBRID logic
      // Display: displayKodeBagian (e.g. PSDM)
      // Counter: counterScope (e.g. SEK)
      nomorSuratAdmin = await generateNomorSurat(
        kodeJenis,
        targetKodeArea,
        displayKodeBagian,
        counterScope
      );
      // tanggalSurat = new Date(); // Optional: update date or keep original
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
        // nomorSurat: nomorSurat, // DO NOT UPDATE ORIGINAL NUMBER
        nomorSuratAdmin, // Save the new Admin number
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

    res.json({
      message: "Surat keluar berhasil diupdate",
      suratKeluar,
    });
  } catch (error) {
    console.error("Update surat keluar error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Validate surat keluar (Sekpeng/Bendahara)
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
      // If approved, stay as DIPROSES (or change to it if coming from PENGAJUAN)
      // The flow is: Pengajuan -> Diproses -> Ditandatangani
      // Validation essentially just confirms it's ready for TTD, but status remains DIPROSES
      // so Ketua can see it and sign it.
      newStatus = "DIPROSES";
      aksi = "Surat divalidasi (Siap Tanda Tangan)";
    } else {
      newStatus = "DIKEMBALIKAN";
      aksi = "Surat dikembalikan untuk revisi";
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
      message: isApproved ? "Surat divalidasi" : "Surat dikembalikan",
      suratKeluar,
    });
  } catch (error) {
    console.error("Validate surat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Sign surat keluar (Ketua only)
const signSuratKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, catatan } = req.body;

    const existingSurat = await prisma.suratKeluar.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: "Surat tidak ditemukan" });
    }

    let updateData;
    let aksi;

    if (isApproved) {
      const nomorSurat = await generateNomorSurat();
      updateData = {
        status: "DITANDATANGANI",
        isSigned: true,
        signedAt: new Date(),
        nomorSurat,
        tanggalSurat: new Date(),
      };
      aksi = `Surat ditandatangani dengan nomor ${nomorSurat}`;
    } else {
      updateData = { status: "DIKEMBALIKAN" };
      aksi = "Surat ditolak oleh Ketua";
    }

    const suratKeluar = await prisma.suratKeluar.update({
      where: { id },
      data: updateData,
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
      message: isApproved ? "Surat ditandatangani" : "Surat ditolak",
      suratKeluar,
    });
  } catch (error) {
    console.error("Sign surat error:", error);
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

    if (!existingSurat.isSigned) {
      return res.status(400).json({ message: "Surat belum ditandatangani" });
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
  signSuratKeluar,
  sendSuratKeluar,
  deleteSuratKeluar,
  exportSuratKeluar,
};
