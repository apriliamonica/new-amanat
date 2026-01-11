const prisma = require("../config/database");

const createLog = async (req, res) => {
  try {
    const { aksi, keterangan, suratMasukId, suratKeluarId } = req.body;

    // Validate: at least one ID
    if (!suratMasukId && !suratKeluarId) {
      return res.status(400).json({ message: "Surat ID required" });
    }

    await prisma.trackingSurat.create({
      data: {
        aksi,
        keterangan,
        suratMasukId,
        suratKeluarId,
        userId: req.user.id,
      },
    });

    res.status(201).json({ message: "Activity logged" });
  } catch (error) {
    console.error("Tracking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createLog };
