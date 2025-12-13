const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearSuratKeluar() {
  try {
    console.log("Starting cleanup of Surat Keluar data...");

    // 1. Delete dependent TrackingSurat
    const trackingDelete = await prisma.trackingSurat.deleteMany({
      where: {
        suratKeluarId: { not: null },
      },
    });
    console.log(`Deleted ${trackingDelete.count} TrackingSurat records.`);

    // 2. Delete dependent Lampiran
    const lampiranDelete = await prisma.lampiran.deleteMany({
      where: {
        suratKeluarId: { not: null },
      },
    });
    console.log(`Deleted ${lampiranDelete.count} Lampiran records.`);

    // 3. Delete dependent Disposisi
    const disposisiDelete = await prisma.disposisi.deleteMany({
      where: {
        suratKeluarId: { not: null },
      },
    });
    console.log(`Deleted ${disposisiDelete.count} Disposisi records.`);

    // 4. Delete SuratKeluar
    const suratKeluarDelete = await prisma.suratKeluar.deleteMany({});
    console.log(`Deleted ${suratKeluarDelete.count} SuratKeluar records.`);

    console.log("Cleanup completed successfully.");
  } catch (error) {
    console.error("Error clearing Surat Keluar:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSuratKeluar();
