const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users for each role
  const users = [
    {
      email: 'sekretaris@amanat.id',
      password: hashedPassword,
      nama: 'Admin Sekretaris Kantor',
      role: 'SEKRETARIS_KANTOR',
    },
    {
      email: 'ketua@amanat.id',
      password: hashedPassword,
      nama: 'Ketua Pengurus Yayasan',
      role: 'KETUA_PENGURUS',
    },
    {
      email: 'sekpeng@amanat.id',
      password: hashedPassword,
      nama: 'Sekretaris Pengurus Yayasan',
      role: 'SEKRETARIS_PENGURUS',
    },
    {
      email: 'bendahara@amanat.id',
      password: hashedPassword,
      nama: 'Bendahara Pengurus Yayasan',
      role: 'BENDAHARA',
    },
    {
      email: 'kabag.psdm@amanat.id',
      password: hashedPassword,
      nama: 'Kepala Bagian PSDM',
      role: 'KEPALA_BAGIAN_PSDM',
    },
    {
      email: 'kabag.keuangan@amanat.id',
      password: hashedPassword,
      nama: 'Kepala Bagian Keuangan',
      role: 'KEPALA_BAGIAN_KEUANGAN',
    },
    {
      email: 'kabag.umum@amanat.id',
      password: hashedPassword,
      nama: 'Kepala Bagian Umum',
      role: 'KEPALA_BAGIAN_UMUM',
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

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
