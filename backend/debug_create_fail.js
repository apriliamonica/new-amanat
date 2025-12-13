const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function debugFail() {
  try {
    console.log("Starting Debug Fail Scenarios...");

    // 1. Get Ketua User
    const ketua = await prisma.user.findUnique({
      where: { email: "ketua@amanat.id" },
    });
    if (!ketua) {
      console.log("Ketua user not found");
      return;
    }

    // Default data
    const baseData = {
      nomorSurat: null,
      tanggalSurat: new Date(),
      tujuan: "Test Fail Destination",
      perihal: "Test Fail Debugging",
      jenisSuratId: undefined, // Standard undefined
      isiSurat: "Test Content",
      keterangan: "Debug Note",
      fileUrl: null,
      filePublicId: null,
      createdById: ketua.id,
      suratMasukId: null,
      status: "PENGAJUAN",
    };

    // Scenario A: jenisSuratId is UNDEFINED (should succeed)
    console.log("\n--- Scenario A: jenisSuratId undefined ---");
    try {
      const resA = await prisma.suratKeluar.create({
        data: { ...baseData, jenisSuratId: undefined },
      });
      console.log("A: Success ID:", resA.id);
      // Clean up
      await prisma.suratKeluar.delete({ where: { id: resA.id } });
    } catch (e) {
      console.error("A: Failed:", e.message);
    }

    // Scenario B: jenisSuratId is NULL (should succeed)
    console.log("\n--- Scenario B: jenisSuratId null ---");
    try {
      const resB = await prisma.suratKeluar.create({
        data: { ...baseData, jenisSuratId: null },
      });
      console.log("B: Success ID:", resB.id);
      await prisma.suratKeluar.delete({ where: { id: resB.id } });
    } catch (e) {
      console.error("B: Failed:", e.message);
    }

    // Scenario C: jenisSuratId is EMPTY STRING "" (Should FAIL FK)
    console.log("\n--- Scenario C: jenisSuratId empty string ---");
    try {
      const resC = await prisma.suratKeluar.create({
        data: { ...baseData, jenisSuratId: "" },
      });
      console.log("C: Success ID:", resC.id);
      await prisma.suratKeluar.delete({ where: { id: resC.id } });
    } catch (e) {
      console.log(
        "C: Failed as expected (likely). Error:",
        e.message.split("\n").pop()
      ); // Just simple log
    }
  } catch (error) {
    console.error("General Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFail();
