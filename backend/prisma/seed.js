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
      email: "sekretaris@amanat.com",
      password: hashedPassword,
      nama: "Admin Sekretaris Kantor",
      role: "SEKRETARIS_KANTOR",
    },
    {
      email: "ketua@amanat.com",
      password: hashedPassword,
      nama: "Ketua Pengurus Yayasan",
      role: "KETUA_PENGURUS",
    },
    {
      email: "sekpeng@amanat.com",
      password: hashedPassword,
      nama: "Sekretaris Pengurus Yayasan",
      role: "SEKRETARIS_PENGURUS",
    },
    {
      email: "bendahara@amanat.com",
      password: hashedPassword,
      nama: "Bendahara Pengurus Yayasan",
      role: "BENDAHARA",
    },
    {
      email: "kabag.psdm@amanat.com",
      password: hashedPassword,
      nama: "Kepala Bagian PSDM",
      role: "KEPALA_BAGIAN_PSDM",
    },
    {
      email: "kabag.keuangan@amanat.com",
      password: hashedPassword,
      nama: "Kepala Bagian Keuangan",
      role: "KEPALA_BAGIAN_KEUANGAN",
    },
    {
      email: "kabag.umum@amanat.com",
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
  // Initialize nomor surat counter for current year (Admin/SEK)
  const currentYear = new Date().getFullYear();
  await prisma.nomorSuratCounter.upsert({
    where: {
      tahun_kodeBagian: {
        tahun: currentYear,
        kodeBagian: "SEK",
      },
    },
    update: {},
    create: {
      tahun: currentYear,
      kodeBagian: "SEK",
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

  // Seed Kode Bagian for existing roles
  const kodeBagianList = [
    {
      role: "KETUA_PENGURUS",
      kodeInternal: "KY",
      kodeEksternal: "HoF",
      namaBagian: "Ketua Pengurus Yayasan",
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
      kodeEksternal: "SEC",
      namaBagian: "Sekretaris Kantor",
    },
    {
      role: "KETUA_PENGURUS",
      kodeInternal: "KY",
      kodeEksternal: "KY",
      namaBagian: "Ketua Pengurus",
    },
    {
      role: "SEKRETARIS_PENGURUS",
      kodeInternal: "SP",
      kodeEksternal: "SP",
      namaBagian: "Sekretaris Pengurus",
    },
    {
      role: "BENDAHARA",
      kodeInternal: "BEN",
      kodeEksternal: "BEN",
      namaBagian: "Bendahara Pengurus",
    },
  ];

  for (const kb of kodeBagianList) {
    await prisma.kodeBagian.upsert({
      where: { role: kb.role },
      update: {},
      create: kb,
    });
    console.log(`Created kode bagian for role: ${kb.role}`);
  }

  // Get created users
  const kabagPsdm = await prisma.user.findUnique({
    where: { email: "kabag.psdm@amanat.com" },
  });
  const kabagKeuangan = await prisma.user.findUnique({
    where: { email: "kabag.keuangan@amanat.com" },
  });
  const kabagUmum = await prisma.user.findUnique({
    where: { email: "kabag.umum@amanat.com" },
  });
  const sekpeng = await prisma.user.findUnique({
    where: { email: "sekpeng@amanat.com" },
  });

  const sk = await prisma.jenisSurat.findUnique({ where: { kode: "SK" } });
  const sm = await prisma.jenisSurat.findUnique({ where: { kode: "SM" } });

  // Seed Surat Keluar drafts for testing
  // 1. PENGAJUAN (Created by Kabag PSDM, ready for Validation)
  await prisma.suratKeluar.create({
    data: {
      perihal: "Permohonan Rekrutmen Staff Baru",
      tujuan: "Ketua Yayasan",
      isiSurat: "Mohon izin melakukan rekrutmen...", // Legacy field
      status: "PENGAJUAN",
      jenisSuratId: sk.id,
      createdById: kabagPsdm.id,
      kodeArea: "A",
      tanggalSurat: new Date(),
      fileUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Dummy PDF
      tracking: {
        create: {
          aksi: "Surat Dibuat",
          keterangan: "Draft surat diajukan oleh Kabag PSDM",
          userId: kabagPsdm.id,
        },
      },
    },
  });

  // 2. DIPROSES (Ready for Tanda Tangan Ketua)
  await prisma.suratKeluar.create({
    data: {
      perihal: "Laporan Keuangan Bulanan",
      tujuan: "Ketua Yayasan",
      status: "DIPROSES",
      jenisSuratId: sm.id,
      createdById: kabagKeuangan.id,
      kodeArea: "A",
      tanggalSurat: new Date(),
      fileUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      tracking: {
        createMany: {
          data: [
            {
              aksi: "Surat Dibuat",
              keterangan: "Diajukan oleh Kabag Keuangan",
              userId: kabagKeuangan.id,
            },
            {
              aksi: "Validasi Sekretaris",
              keterangan: "Disetujui. Lanjut ke Ketua.",
              userId: sekpeng.id,
            },
          ],
        },
      },
    },
  });

  console.log("Seeding Surat Keluar completed.");

  // Seed Kode Area

  const kodeAreaList = [
    { kode: "A", nama: "Intern Kantor Yayasan" },
    { kode: "B", nama: "Univ De La Salle Luar Negeri" },
    { kode: "C", nama: "Univ Katolik De La Salle Manado" },
    { kode: "D1", nama: "Instansi Pemerintah" },
    { kode: "D2", nama: "Instansi Swasta" },
    { kode: "D3", nama: "Lingkup Keuskupan/Gereja/Paroki" },
    { kode: "D4", nama: "Lembaga Pendidikan Formal/Informal" },
    { kode: "D5", nama: "Perorangan/Karyawan Langsung" },
    { kode: "D6", nama: "Pemerintah Filipina" },
    { kode: "E", nama: "Lainnya" },
  ];

  for (const ka of kodeAreaList) {
    await prisma.kodeArea.upsert({
      where: { kode: ka.kode },
      update: {},
      create: ka,
    });
    console.log(`Created kode area: ${ka.kode}`);
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
