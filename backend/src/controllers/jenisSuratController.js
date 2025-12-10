const prisma = require("../config/database");

// Get all jenis surat
const getJenisSurat = async (req, res) => {
  try {
    const jenisSurat = await prisma.jenisSurat.findMany({
      orderBy: { kode: "asc" },
    });
    res.json({
      success: true,
      data: jenisSurat,
    });
  } catch (error) {
    console.error("Get jenis surat error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data jenis surat",
    });
  }
};

// Create new jenis surat
const createJenisSurat = async (req, res) => {
  try {
    const { kode, nama, format } = req.body;

    // Check if kode exists
    const existing = await prisma.jenisSurat.findUnique({
      where: { kode },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Kode jenis surat sudah ada",
      });
    }

    const jenisSurat = await prisma.jenisSurat.create({
      data: {
        kode: kode.toUpperCase(),
        nama,
        format,
      },
    });

    res.status(201).json({
      success: true,
      message: "Jenis surat berhasil dibuat",
      data: jenisSurat,
    });
  } catch (error) {
    console.error("Create jenis surat error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat jenis surat",
    });
  }
};

// Update jenis surat
const updateJenisSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode, nama, format } = req.body;

    // Check if duplicate kode (if changed)
    const existing = await prisma.jenisSurat.findFirst({
      where: {
        kode,
        NOT: { id },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Kode jenis surat sudah digunakan",
      });
    }

    const jenisSurat = await prisma.jenisSurat.update({
      where: { id },
      data: {
        kode: kode.toUpperCase(),
        nama,
        format,
      },
    });

    res.json({
      success: true,
      message: "Jenis surat berhasil diupdate",
      data: jenisSurat,
    });
  } catch (error) {
    console.error("Update jenis surat error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengupdate jenis surat",
    });
  }
};

// Delete jenis surat
const deleteJenisSurat = async (req, res) => {
  try {
    const { id } = req.params;

    // Check usage in SuratKeluar
    const used = await prisma.suratKeluar.findFirst({
      where: { jenisSuratId: id },
    });

    if (used) {
      return res.status(400).json({
        success: false,
        message: "Jenis surat sedang digunakan dan tidak bisa dihapus",
      });
    }

    await prisma.jenisSurat.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Jenis surat berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete jenis surat error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus jenis surat",
    });
  }
};

module.exports = {
  getJenisSurat,
  createJenisSurat,
  updateJenisSurat,
  deleteJenisSurat,
};
