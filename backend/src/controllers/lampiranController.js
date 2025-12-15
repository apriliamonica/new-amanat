const prisma = require("../config/database");
const { cloudinary } = require("../config/cloudinary");

// Get lampiran for a surat
const getLampiranBySurat = async (req, res) => {
  try {
    const { suratId, type } = req.params;

    const whereCondition =
      type === "masuk" ? { suratMasukId: suratId } : { suratKeluarId: suratId };

    const lampiran = await prisma.lampiran.findMany({
      where: whereCondition,
      include: {
        uploadedBy: { select: { id: true, nama: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ lampiran });
  } catch (error) {
    console.error("Get lampiran error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Upload lampiran
const uploadLampiran = async (req, res) => {
  try {
    const { suratMasukId, suratKeluarId, keterangan } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File wajib diupload" });
    }

    if (!suratMasukId && !suratKeluarId) {
      return res.status(400).json({ message: "Surat tidak valid" });
    }

    const lampiran = await prisma.lampiran.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: req.file.path,
        filePublicId: req.file.filename,
        fileType: req.file.mimetype,
        uploadedById: req.user.id,
        suratMasukId,
        suratKeluarId,
      },
      include: {
        uploadedBy: { select: { id: true, nama: true, role: true } },
      },
    });

    // Create tracking entry
    await prisma.trackingSurat.create({
      data: {
        aksi: `Lampiran "${req.file.originalname}" diupload`,
        keterangan: `Diupload oleh ${req.user.nama}`,
        userId: req.user.id,
        suratMasukId,
        suratKeluarId,
      },
    });

    res.status(201).json({
      message: "Lampiran berhasil diupload",
      lampiran,
    });
  } catch (error) {
    console.error("Upload lampiran error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete lampiran
const deleteLampiran = async (req, res) => {
  try {
    const { id } = req.params;

    const lampiran = await prisma.lampiran.findUnique({
      where: { id },
    });

    if (!lampiran) {
      return res.status(404).json({ message: "Lampiran tidak ditemukan" });
    }

    // Only uploader or admin can delete
    if (
      lampiran.uploadedById !== req.user.id &&
      req.user.role !== "SEKRETARIS_KANTOR"
    ) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(lampiran.filePublicId);

    await prisma.lampiran.delete({ where: { id } });

    res.json({ message: "Lampiran berhasil dihapus" });
  } catch (error) {
    console.error("Delete lampiran error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getLampiranBySurat,
  uploadLampiran,
  deleteLampiran,
};
