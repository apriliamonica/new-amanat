const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hash password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create users for each role
  const users = [
    {
      email: "sekretaris@amanat.id",
      password: hashedPassword,
      nama: "Admin Sekretaris Kantor",
      role: "SEKRETARIS_KANTOR",
    },
    {
      email: "ketua@amanat.id",
      password: hashedPassword,
      nama: "Ketua Pengurus Yayasan",
      role: "KETUA_PENGURUS",
    },
    {
      email: "sekpeng@amanat.id",
      password: hashedPassword,
      nama: "Sekretaris Pengurus Yayasan",
      role: "SEKRETARIS_PENGURUS",
    },
    {
      email: "bendahara@amanat.id",
      password: hashedPassword,
      nama: "Bendahara Pengurus Yayasan",
      role: "BENDAHARA",
    },
    {
      email: "kabag.psdm@amanat.id",
      password: hashedPassword,
      nama: "Kepala Bagian PSDM",
      role: "KEPALA_BAGIAN_PSDM",
    },
    {
      email: "kabag.keuangan@amanat.id",
      password: hashedPassword,
      nama: "Kepala Bagian Keuangan",
      role: "KEPALA_BAGIAN_KEUANGAN",
    },
    {
      email: "kabag.umum@amanat.id",
      password: hashedPassword,
      nama: "Kepala Bagian Umum",
      role: "KEPALA_BAGIAN_UMUM",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Created user: ${user.email}`);
  }

  // Initialize nomor surat counter for current year
  const currentYear = new Date().getFullYear();
  await prisma.nomorSuratCounter.upsert({
    where: { tahun: currentYear },
    update: {},
    create: {
      tahun: currentYear,
      counter: 0,
    },
  });
  console.log(`Initialized nomor surat counter for year ${currentYear}`);

  // Seed default Jenis Surat
  const jenisSuratData = [
    { kode: "SK", nama: "Surat Keputusan" },
    { kode: "UND", nama: "Surat Undangan" },
    { kode: "ST", nama: "Surat Tugas" },
    { kode: "SM", nama: "Surat Masuk" }, // Optional
    { kode: "SP", nama: "Surat Peringatan" },
  ];

  for (const jenis of jenisSuratData) {
    await prisma.jenisSurat.upsert({
      where: { kode: jenis.kode },
      update: {},
      create: jenis,
    });
    console.log(`Created jenis surat: ${jenis.kode}`);
  }

  // Seed Kode Bagian (Master Data)
  const kodeBagianData = [
    {
      role: "KETUA_PENGURUS",
      kodeInternal: "KY",
      kodeEksternal: "HoF",
      namaBagian: "Ketua Yayasan",
    },
    {
      role: "KEPALA_BAGIAN_PSDM",
      kodeInternal: "PERS",
      kodeEksternal: "HRD",
      namaBagian: "Bagian Personalia",
    },
    {
      role: "KEPALA_BAGIAN_KEUANGAN",
      kodeInternal: "KEU",
      kodeEksternal: "FINC",
      namaBagian: "Bagian Keuangan",
    },
    {
      role: "KEPALA_BAGIAN_UMUM",
      kodeInternal: "UMUM",
      kodeEksternal: "GA",
      namaBagian: "Bagian Umum",
    },
    {
      role: "SEKRETARIS_KANTOR",
      kodeInternal: "SEK",
      kodeEksternal: "SEK",
      namaBagian: "Sekretaris Kantor",
    },
  ];

  for (const bagian of kodeBagianData) {
    await prisma.kodeBagian.upsert({
      where: { role: bagian.role },
      update: {},
      create: bagian,
    });
    console.log(`Created kode bagian for role: ${bagian.role}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
