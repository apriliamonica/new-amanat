const prisma = require('../config/database');
const { cloudinary } = require('../config/cloudinary');
const { generateNomorSurat } = require('../utils/helpers');

// Get all surat keluar (filtered by role)
const getAllSuratKeluar = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let whereCondition = {};

    // Admin sees all, others see only disposed to them or created by them
    if (role !== 'SEKRETARIS_KANTOR') {
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
          orderBy: { tanggalDisposisi: 'desc' },
        },
        suratMasuk: {
          select: { id: true, nomorSurat: true, perihal: true },
        },
        _count: {
          select: { lampiran: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ suratKeluar });
  } catch (error) {
    console.error('Get surat keluar error:', error);
    res.status(500).json({ message: 'Server error' });
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
          orderBy: { tanggalDisposisi: 'asc' },
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
          orderBy: { timestamp: 'asc' },
        },
        suratMasuk: true,
      },
    });

    if (!suratKeluar) {
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    res.json({ suratKeluar });
  } catch (error) {
    console.error('Get surat keluar by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create surat keluar (Admin only)
const createSuratKeluar = async (req, res) => {
  try {
    const {
      tujuan,
      perihal,
      jenisSurat,
      kategori,
      isiSurat,
      keterangan,
      suratMasukId,
    } = req.body;

    let fileUrl = null;
    let filePublicId = null;

    if (req.file) {
      fileUrl = req.file.path;
      filePublicId = req.file.filename;
    }

    const suratKeluar = await prisma.suratKeluar.create({
      data: {
        tujuan,
        perihal,
        jenisSurat,
        kategori,
        isiSurat,
        keterangan,
        fileUrl,
        filePublicId,
        createdById: req.user.id,
        suratMasukId: suratMasukId || null,
        status: 'DIPROSES',
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
        aksi: 'Draft surat keluar dibuat',
        keterangan: `Draft surat untuk ${tujuan} dibuat oleh ${req.user.nama}`,
        userId: req.user.id,
        suratKeluarId: suratKeluar.id,
      },
    });

    res.status(201).json({
      message: 'Surat keluar berhasil dibuat',
      suratKeluar,
    });
  } catch (error) {
    console.error('Create surat keluar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update surat keluar
const updateSuratKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tujuan,
      perihal,
      jenisSurat,
      kategori,
      isiSurat,
      keterangan,
    } = req.body;

    const existingSurat = await prisma.suratKeluar.findUnique({
      where: { id },
    });

    if (!existingSurat) {
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
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

    const suratKeluar = await prisma.suratKeluar.update({
      where: { id },
      data: {
        tujuan,
        perihal,
        jenisSurat,
        kategori,
        isiSurat,
        keterangan,
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
      message: 'Surat keluar berhasil diupdate',
      suratKeluar,
    });
  } catch (error) {
    console.error('Update surat keluar error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    let newStatus;
    let aksi;

    if (isApproved) {
      newStatus = 'MENUNGGU_TTD';
      aksi = 'Surat divalidasi dan diteruskan ke Ketua';
    } else {
      newStatus = 'DIKEMBALIKAN';
      aksi = 'Surat dikembalikan untuk revisi';
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
      message: isApproved ? 'Surat divalidasi' : 'Surat dikembalikan',
      suratKeluar,
    });
  } catch (error) {
    console.error('Validate surat error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    let updateData;
    let aksi;

    if (isApproved) {
      const nomorSurat = await generateNomorSurat();
      updateData = {
        status: 'DITANDATANGANI',
        isSigned: true,
        signedAt: new Date(),
        nomorSurat,
        tanggalSurat: new Date(),
      };
      aksi = `Surat ditandatangani dengan nomor ${nomorSurat}`;
    } else {
      updateData = { status: 'DIKEMBALIKAN' };
      aksi = 'Surat ditolak oleh Ketua';
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
      message: isApproved ? 'Surat ditandatangani' : 'Surat ditolak',
      suratKeluar,
    });
  } catch (error) {
    console.error('Sign surat error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    if (!existingSurat.isSigned) {
      return res.status(400).json({ message: 'Surat belum ditandatangani' });
    }

    const suratKeluar = await prisma.suratKeluar.update({
      where: { id },
      data: {
        status: 'SELESAI',
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
      message: 'Surat berhasil dikirim',
      suratKeluar,
    });
  } catch (error) {
    console.error('Send surat error:', error);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
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

    res.json({ message: 'Surat keluar berhasil dihapus' });
  } catch (error) {
    console.error('Delete surat keluar error:', error);
    res.status(500).json({ message: 'Server error' });
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
};
