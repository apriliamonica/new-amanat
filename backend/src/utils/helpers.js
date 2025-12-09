const prisma = require('../config/database');

// Generate nomor surat format: XXX/SK/YPD/BULAN/TAHUN
const generateNomorSurat = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = getRomanMonth(now.getMonth() + 1);

  // Get or create counter for current year
  let counter = await prisma.nomorSuratCounter.findUnique({
    where: { tahun: year },
  });

  if (!counter) {
    counter = await prisma.nomorSuratCounter.create({
      data: { tahun: year, counter: 1 },
    });
  } else {
    counter = await prisma.nomorSuratCounter.update({
      where: { tahun: year },
      data: { counter: counter.counter + 1 },
    });
  }

  const nomorUrut = String(counter.counter).padStart(3, '0');
  return `${nomorUrut}/SK/YPD/${month}/${year}`;
};

// Convert month number to Roman numeral
const getRomanMonth = (month) => {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[month - 1];
};

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Get role display name
const getRoleDisplayName = (role) => {
  const roleNames = {
    SEKRETARIS_KANTOR: 'Sekretaris Kantor',
    KETUA_PENGURUS: 'Ketua Pengurus Yayasan',
    SEKRETARIS_PENGURUS: 'Sekretaris Pengurus Yayasan',
    BENDAHARA: 'Bendahara Pengurus Yayasan',
    KEPALA_BAGIAN_PSDM: 'Kepala Bagian PSDM',
    KEPALA_BAGIAN_KEUANGAN: 'Kepala Bagian Keuangan',
    KEPALA_BAGIAN_UMUM: 'Kepala Bagian Umum',
  };
  return roleNames[role] || role;
};

// Check if role is any Kepala Bagian
const isKabagRole = (role) => {
  return ['KEPALA_BAGIAN_PSDM', 'KEPALA_BAGIAN_KEUANGAN', 'KEPALA_BAGIAN_UMUM'].includes(role);
};

module.exports = {
  generateNomorSurat,
  getRomanMonth,
  formatDate,
  getRoleDisplayName,
  isKabagRole,
};
