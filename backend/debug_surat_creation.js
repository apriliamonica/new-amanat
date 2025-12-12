const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function debugCreate() {
  try {
    console.log("Starting Debug...");

    // 1. Get Ketua User
    const ketua = await prisma.user.findUnique({
      where: { email: "ketua@amanat.id" },
    });
    console.log("Ketua User:", ketua ? "Found" : "Not Found");
    if (!ketua) return;

    // 2. Get Jenis Surat
    const jenis = await prisma.jenisSurat.findFirst();
    console.log("Jenis Surat:", jenis ? "Found" : "Not Found", jenis?.id);

    // 3. Prepare Data (Mocking Controller logic for Requester)
    const data = {
      nomorSurat: null,
      tanggalSurat: new Date(),
      tujuan: "Test Destination",
      perihal: "Test Debugging",
      jenisSuratId: jenis?.id, // Use valid ID
      isiSurat: "Test Content",
      keterangan: "Debug Note",
      fileUrl: "http://example.com",
      filePublicId: "xyz",
      createdById: ketua.id, // KETUA ID
      suratMasukId: null,
      status: "PENGAJUAN",
    };

    console.log("Attempting to create SuratKeluar with data:", data);

    // 4. Create
    const result = await prisma.suratKeluar.create({
      data: data,
    });

    console.log("Success! Created ID:", result.id);
  } catch (error) {
    console.error("FAILED to create SuratKeluar:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCreate();
