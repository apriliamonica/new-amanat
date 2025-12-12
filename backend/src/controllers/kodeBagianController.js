const prisma = require("../config/database");

// Get all kode bagian
const getAllKodeBagian = async (req, res) => {
  try {
    const data = await prisma.kodeBagian.findMany({
      orderBy: { namaBagian: "asc" },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get all kode bagian error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update kode bagian
const updateKodeBagian = async (req, res) => {
  try {
    const { id } = req.params;
    const { kodeInternal, kodeEksternal, namaBagian } = req.body;

    const updated = await prisma.kodeBagian.update({
      where: { id },
      data: {
        kodeInternal,
        kodeEksternal,
        namaBagian,
      },
    });

    res.json({
      success: true,
      message: "Kode bagian berhasil diupdate",
      data: updated,
    });
  } catch (error) {
    console.error("Update kode bagian error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllKodeBagian,
  updateKodeBagian,
};
