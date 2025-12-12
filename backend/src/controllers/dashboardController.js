const prisma = require("../config/database");

// Get dashboard stats based on role
const getStats = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let stats = {};

    if (role === "SEKRETARIS_KANTOR") {
      // Admin sees all stats
      const [
        totalSuratMasuk,
        totalSuratKeluar,
        suratMasukBaru,
        suratKeluarDraft,
        disposisiPending,
        totalUsers,
      ] = await Promise.all([
        prisma.suratMasuk.count(),
        prisma.suratKeluar.count(),
        prisma.suratMasuk.count({ where: { status: "DITERIMA" } }),
        prisma.suratKeluar.count({ where: { status: "DIPROSES" } }),
        prisma.disposisi.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { isActive: true } }),
      ]);

      stats = {
        totalSuratMasuk,
        totalSuratKeluar,
        suratMasukBaru,
        suratKeluarDraft,
        disposisiPending,
        totalUsers,
      };
    } else {
      // Other roles see their own stats
      const [disposisiDiterima, disposisiSelesai, suratTerkait] =
        await Promise.all([
          prisma.disposisi.count({
            where: { toUserId: userId, status: "PENDING" },
          }),
          prisma.disposisi.count({
            where: { toUserId: userId, status: "SELESAI" },
          }),
          prisma.disposisi.count({ where: { toUserId: userId } }),
        ]);

      stats = {
        disposisiDiterima,
        disposisiSelesai,
        suratTerkait,
      };

      // Add validation/signature stats for specific roles
      if (role === "KETUA_PENGURUS") {
        const menungguTTD = await prisma.suratKeluar.count({
          where: { status: "MENUNGGU_TTD" },
        });
        stats.menungguTTD = menungguTTD;
      }

      if (role === "SEKRETARIS_PENGURUS" || role === "BENDAHARA") {
        const menungguValidasi = await prisma.suratKeluar.count({
          where: { status: "MENUNGGU_VALIDASI" },
        });
        stats.menungguValidasi = menungguValidasi;
      }
    }

    res.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get recent activities
const getRecentActivities = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let whereCondition = {};

    // Non-admin only sees their own activities
    if (role !== "SEKRETARIS_KANTOR") {
      whereCondition = { userId };
    }

    const activities = await prisma.trackingSurat.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, nama: true, role: true } },
        suratMasuk: { select: { id: true, nomorSurat: true, perihal: true } },
        suratKeluar: { select: { id: true, nomorSurat: true, perihal: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    res.json({ activities });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get monthly chart data
const getMonthlyStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const suratMasuk = await prisma.suratMasuk.groupBy({
      by: ["tanggalDiterima"],
      where: {
        tanggalDiterima: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    const suratKeluar = await prisma.suratKeluar.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Aggregate by month
    const monthlyData = Array(12)
      .fill(null)
      .map((_, i) => ({
        month: i + 1,
        suratMasuk: 0,
        suratKeluar: 0,
      }));

    suratMasuk.forEach((item) => {
      const month = new Date(item.tanggalDiterima).getMonth();
      monthlyData[month].suratMasuk += item._count;
    });

    suratKeluar.forEach((item) => {
      const month = new Date(item.createdAt).getMonth();
      monthlyData[month].suratKeluar += item._count;
    });

    res.json({ monthlyData });
  } catch (error) {
    console.error("Get monthly stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getStats,
  getRecentActivities,
  getMonthlyStats,
};
