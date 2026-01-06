const prisma = require("../config/database");

// Define roles locally to match constants
const ROLES = {
  SEKRETARIS_KANTOR: "SEKRETARIS_KANTOR",
  KETUA_PENGURUS: "KETUA_PENGURUS",
  SEKRETARIS_PENGURUS: "SEKRETARIS_PENGURUS",
  BENDAHARA: "BENDAHARA",
  KEPALA_BAGIAN_PSDM: "KEPALA_BAGIAN_PSDM",
  KEPALA_BAGIAN_KEUANGAN: "KEPALA_BAGIAN_KEUANGAN",
  KEPALA_BAGIAN_UMUM: "KEPALA_BAGIAN_UMUM",
};

const STATUS_SURAT = {
  PENGAJUAN: "PENGAJUAN",
  MENUNGGU_VALIDASI: "MENUNGGU_VALIDASI",
  MENUNGGU_TTD: "MENUNGGU_TTD",
};

const getSummary = async (req, res) => {
  try {
    const user = req.user;
    const items = [];
    let actionCount = 0;

    // Time filter: 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. ALL ROLES: Pending Disposisi (Last 24h)
    const pendingDisposisi = await prisma.disposisi.findMany({
      where: {
        toUserId: user.id,
        status: "PENDING",
        createdAt: { gte: twentyFourHoursAgo },
      },
      include: {
        fromUser: { select: { nama: true } },
        suratMasuk: { select: { nomorSurat: true, perihal: true } },
        suratKeluar: { select: { nomorSurat: true, perihal: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    pendingDisposisi.forEach((d) => {
      items.push({
        id: d.id,
        type: "action",
        subtype: "disposisi",
        message: `Disposisi baru dari ${d.fromUser?.nama || "Unknown"}`,
        detail:
          d.suratMasuk?.perihal || d.suratKeluar?.perihal || "Tanpa Perihal",
        time: d.createdAt,
        link: "/disposisi",
      });
      actionCount++;
    });

    // 2. ROLE SPECIFIC CHECKS
    if (user.role === ROLES.SEKRETARIS_KANTOR) {
      // ADMIN: New Requests (Pengajuan - Last 24h)
      const newRequests = await prisma.suratKeluar.findMany({
        where: {
          status: STATUS_SURAT.PENGAJUAN,
          createdAt: { gte: twentyFourHoursAgo },
        },
        include: { createdBy: { select: { nama: true } } },
        orderBy: { createdAt: "desc" },
      });

      newRequests.forEach((req) => {
        items.push({
          id: req.id,
          type: "action",
          subtype: "request",
          message: `Permintaan Surat dari ${req.createdBy?.nama || "Unknown"}`,
          detail: req.perihal,
          time: req.createdAt,
          link: `/surat-keluar/detail/${req.id}`,
        });
        actionCount++;
      });

      // ADMIN: Recent History (Tracking - Last 24h)
      const recentActivity = await prisma.trackingSurat.findMany({
        where: {
          timestamp: { gte: twentyFourHoursAgo },
        },
        take: 10,
        orderBy: { timestamp: "desc" },
        include: {
          user: { select: { nama: true } },
          suratMasuk: { select: { nomorSurat: true } },
          suratKeluar: { select: { nomorSurat: true } },
        },
      });

      recentActivity.forEach((track) => {
        const suratRef =
          track.suratMasuk?.nomorSurat ||
          track.suratKeluar?.nomorSurat ||
          "Surat";
        items.push({
          id: track.id,
          type: "history",
          subtype: "tracking",
          message: `${track.aksi} oleh ${track.user?.nama || "Sistem"}`,
          detail: `${suratRef}: ${track.keterangan || ""}`,
          time: track.timestamp,
        });
      });
    } else if (user.role === ROLES.KETUA_PENGURUS) {
      // KETUA: Waiting for Signature (Last 24h)
      const needSign = await prisma.suratKeluar.findMany({
        where: {
          status: STATUS_SURAT.MENUNGGU_TTD,
          isSigned: false,
          createdAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { createdAt: "desc" },
      });

      needSign.forEach((s) => {
        items.push({
          id: s.id,
          type: "action",
          subtype: "sign",
          message: "Menunggu Tanda Tangan Anda",
          detail: s.perihal,
          time: s.createdAt,
          link: `/surat-keluar/detail/${s.id}`,
        });
        actionCount++;
      });
    } else if (
      user.role === ROLES.SEKRETARIS_PENGURUS ||
      user.role === ROLES.BENDAHARA
    ) {
      // VALIDATOR: Waiting for Validation (Last 24h)
      const needValidate = await prisma.suratKeluar.findMany({
        where: {
          status: STATUS_SURAT.MENUNGGU_VALIDASI,
          createdAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { createdAt: "desc" },
      });

      needValidate.forEach((s) => {
        items.push({
          id: s.id,
          type: "action",
          subtype: "validate",
          message: "Menunggu Validasi Anda",
          detail: s.perihal,
          time: s.createdAt,
          link: `/surat-keluar/detail/${s.id}`,
        });
        actionCount++;
      });
    }

    // Sort items by time desc
    items.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      total: actionCount, // Only count actionable items for the badge
      items: items,
    });
  } catch (error) {
    console.error("Notification Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getSummary };
