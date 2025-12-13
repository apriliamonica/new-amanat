const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up Surat and Disposisi data...");

  try {
    // Delete in order to respect foreign key constraints
    // 1. Delete dependent tables first
    await prisma.trackingSurat.deleteMany({});
    console.log("Deleting TrackingSurat...");

    await prisma.lampiran.deleteMany({});
    console.log("Deleting Lampiran...");

    await prisma.disposisi.deleteMany({});
    console.log("Deleting Disposisi...");

    // 2. Delete main tables
    // Note: Due to potential circular / self relations (like SuratBalasan),
    // we might need to be careful, but deleteMany usually handles basic cases if constraints allow or if we delete children first.

    // SuratKeluar has a relation to SuratMasuk (suratBalasan), so delete SuratKeluar first?
    // Actually SuratKeluar has `suratMasukId` (FK), so removing SuratKeluar first is safer.
    await prisma.suratKeluar.deleteMany({});
    console.log("Deleting SuratKeluar...");

    await prisma.suratMasuk.deleteMany({});
    console.log("Deleting SuratMasuk...");

    console.log("Cleanup finished successfully.");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
