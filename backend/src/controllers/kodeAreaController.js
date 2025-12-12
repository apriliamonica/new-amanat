const prisma = require("../config/database");

// Get all
const getAllKodeArea = async (req, res) => {
  try {
    const data = await prisma.kodeArea.findMany({
      orderBy: { kode: "asc" },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get all kode area error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create
const createKodeArea = async (req, res) => {
  try {
    const { kode, nama } = req.body;

    // Check existing
    const existing = await prisma.kodeArea.findUnique({ where: { kode } });
    if (existing) {
      return res.status(400).json({ message: "Kode area sudah ada" });
    }

    const newData = await prisma.kodeArea.create({
      data: { kode, nama },
    });
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    console.error("Create kode area error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update
const updateKodeArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode, nama } = req.body;

    const updated = await prisma.kodeArea.update({
      where: { id },
      data: { kode, nama },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update kode area error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete
const deleteKodeArea = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.kodeArea.delete({ where: { id } });
    res.json({ success: true, message: "Berhasil dihapus" });
  } catch (error) {
    console.error("Delete kode area error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllKodeArea,
  createKodeArea,
  updateKodeArea,
  deleteKodeArea,
};
