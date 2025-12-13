const prisma = require("../config/database");

// Generate nomor surat format: URL/KODE_JENIS/KODE_AREA/KODE_BAGIAN/BULAN/TAHUN
const generateNomorSurat = async (
  kodeJenis = "SK",
  kodeArea = "A",
  kodeBagian = "SEK"
) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = getRomanMonth(now.getMonth() + 1);

  // Get or create counter for current year AND kodeBagian
  let counter = await prisma.nomorSuratCounter.findUnique({
    where: {
      tahun_kodeBagian: {
        tahun: year,
        kodeBagian: kodeBagian,
      },
    },
  });

  if (!counter) {
    counter = await prisma.nomorSuratCounter.create({
      data: {
        tahun: year,
        kodeBagian: kodeBagian,
        counter: 1,
      },
    });
  } else {
    counter = await prisma.nomorSuratCounter.update({
      where: {
        tahun_kodeBagian: {
          tahun: year,
          kodeBagian: kodeBagian,
        },
      },
      data: { counter: counter.counter + 1 },
    });
  }

  const nomorUrut = String(counter.counter).padStart(3, "0");
  // Format: 001/SK/A/PERS/IV/2023
  return `${nomorUrut}/${kodeJenis}/${kodeArea}/${kodeBagian}/${month}/${year}`;
};

// Convert month number to Roman numeral
const getRomanMonth = (month) => {
  const romans = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return romans[month - 1];
};

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Get role display name
const getRoleDisplayName = (role) => {
  const roleNames = {
    SEKRETARIS_KANTOR: "Sekretaris Kantor",
    KETUA_PENGURUS: "Ketua Pengurus Yayasan",
    SEKRETARIS_PENGURUS: "Sekretaris Pengurus Yayasan",
    BENDAHARA: "Bendahara Pengurus Yayasan",
    KEPALA_BAGIAN_PSDM: "Kepala Bagian PSDM",
    KEPALA_BAGIAN_KEUANGAN: "Kepala Bagian Keuangan",
    KEPALA_BAGIAN_UMUM: "Kepala Bagian Umum",
  };
  return roleNames[role] || role;
};

// Check if role is any Kepala Bagian
const isKabagRole = (role) => {
  return [
    "KEPALA_BAGIAN_PSDM",
    "KEPALA_BAGIAN_KEUANGAN",
    "KEPALA_BAGIAN_UMUM",
  ].includes(role);
};

module.exports = {
  generateNomorSurat,
  getRomanMonth,
  formatDate,
  getRoleDisplayName,
  isKabagRole,
};
