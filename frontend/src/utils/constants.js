// Role definitions
export const ROLES = {
  SEKRETARIS_KANTOR: "SEKRETARIS_KANTOR",
  KETUA_PENGURUS: "KETUA_PENGURUS",
  SEKRETARIS_PENGURUS: "SEKRETARIS_PENGURUS",
  BENDAHARA: "BENDAHARA",
  KEPALA_BAGIAN_PSDM: "KEPALA_BAGIAN_PSDM",
  KEPALA_BAGIAN_KEUANGAN: "KEPALA_BAGIAN_KEUANGAN",
  KEPALA_BAGIAN_UMUM: "KEPALA_BAGIAN_UMUM",
};

// Role display names
export const ROLE_NAMES = {
  [ROLES.SEKRETARIS_KANTOR]: "Sekretaris Kantor",
  [ROLES.KETUA_PENGURUS]: "Ketua Pengurus Yayasan",
  [ROLES.SEKRETARIS_PENGURUS]: "Sekretaris Pengurus Yayasan",
  [ROLES.BENDAHARA]: "Bendahara Pengurus Yayasan",
  [ROLES.KEPALA_BAGIAN_PSDM]: "Kepala Bagian PSDM",
  [ROLES.KEPALA_BAGIAN_KEUANGAN]: "Kepala Bagian Keuangan",
  [ROLES.KEPALA_BAGIAN_UMUM]: "Kepala Bagian Umum",
};

// Short role names for badges
export const ROLE_SHORT_NAMES = {
  [ROLES.SEKRETARIS_KANTOR]: "Admin",
  [ROLES.KETUA_PENGURUS]: "Ketua",
  [ROLES.SEKRETARIS_PENGURUS]: "Sekpeng",
  [ROLES.BENDAHARA]: "Bendahara",
  [ROLES.KEPALA_BAGIAN_PSDM]: "Kabag PSDM",
  [ROLES.KEPALA_BAGIAN_KEUANGAN]: "Kabag Keuangan",
  [ROLES.KEPALA_BAGIAN_UMUM]: "Kabag Umum",
};

// Status surat
export const STATUS_SURAT = {
  PENGAJUAN: "PENGAJUAN",
  DITERIMA: "DITERIMA",
  DIPROSES: "DIPROSES",
  DISPOSISI: "DISPOSISI",
  DITINDAKLANJUTI: "DITINDAKLANJUTI",
  MENUNGGU_VALIDASI: "MENUNGGU_VALIDASI",
  MENUNGGU_TTD: "MENUNGGU_TTD",
  DITANDATANGANI: "DITANDATANGANI",
  SELESAI: "SELESAI",
  DITOLAK: "DITOLAK",
  DIKEMBALIKAN: "DIKEMBALIKAN",
};

// Status display names
export const STATUS_NAMES = {
  [STATUS_SURAT.PENGAJUAN]: "Pengajuan",
  [STATUS_SURAT.DITERIMA]: "Diterima",
  [STATUS_SURAT.DIPROSES]: "Diproses",
  [STATUS_SURAT.DISPOSISI]: "Disposisi",
  [STATUS_SURAT.DITINDAKLANJUTI]: "Ditindaklanjuti",
  [STATUS_SURAT.MENUNGGU_VALIDASI]: "Menunggu Validasi",
  [STATUS_SURAT.MENUNGGU_TTD]: "Menunggu TTD",
  [STATUS_SURAT.DITANDATANGANI]: "Ditandatangani",
  [STATUS_SURAT.SELESAI]: "Selesai",
  [STATUS_SURAT.DITOLAK]: "Ditolak",
  [STATUS_SURAT.DIKEMBALIKAN]: "Dikembalikan",
};

// Status CSS classes
export const STATUS_CLASSES = {
  [STATUS_SURAT.PENGAJUAN]: "bg-yellow-100 text-yellow-800",
  [STATUS_SURAT.DITERIMA]: "status-diterima",
  [STATUS_SURAT.DIPROSES]: "status-diproses",
  [STATUS_SURAT.DISPOSISI]: "status-disposisi",
  [STATUS_SURAT.DITINDAKLANJUTI]: "status-ditindaklanjuti",
  [STATUS_SURAT.MENUNGGU_VALIDASI]: "status-menunggu-validasi",
  [STATUS_SURAT.MENUNGGU_TTD]: "status-menunggu-ttd",
  [STATUS_SURAT.DITANDATANGANI]: "status-ditandatangani",
  [STATUS_SURAT.SELESAI]: "status-selesai",
  [STATUS_SURAT.DITOLAK]: "status-ditolak",
  [STATUS_SURAT.DIKEMBALIKAN]: "status-dikembalikan",
};

// Jenis surat
export const JENIS_SURAT = {
  INTERNAL: "INTERNAL",
  EKSTERNAL: "EKSTERNAL",
};

// Kategori surat
export const KATEGORI_SURAT = {
  ADMINISTRATIF: "ADMINISTRATIF",
  KEUANGAN: "KEUANGAN",
  FASILITAS: "FASILITAS",
  UMUM: "UMUM",
};

export const KATEGORI_NAMES = {
  [KATEGORI_SURAT.ADMINISTRATIF]: "Administratif",
  [KATEGORI_SURAT.KEUANGAN]: "Keuangan",
  [KATEGORI_SURAT.FASILITAS]: "Fasilitas",
  [KATEGORI_SURAT.UMUM]: "Umum",
};

// Status disposisi
export const STATUS_DISPOSISI = {
  PENDING: "PENDING",
  DITERUSKAN: "DITERUSKAN",
  DITINDAKLANJUTI: "DITINDAKLANJUTI",
  SELESAI: "SELESAI",
};

// Check if role is admin
export const isAdmin = (role) => role === ROLES.SEKRETARIS_KANTOR;

// Check if role is Ketua
export const isKetua = (role) => role === ROLES.KETUA_PENGURUS;

// Check if role can validate (Sekpeng or Bendahara)
export const canValidate = (role) =>
  [ROLES.SEKRETARIS_PENGURUS, ROLES.BENDAHARA].includes(role);

// Check if role is Kabag
export const isKabag = (role) =>
  [
    ROLES.KEPALA_BAGIAN_PSDM,
    ROLES.KEPALA_BAGIAN_KEUANGAN,
    ROLES.KEPALA_BAGIAN_UMUM,
  ].includes(role);

// Get all Kabag roles for disposisi target
export const getKabagRoles = () => [
  ROLES.KEPALA_BAGIAN_PSDM,
  ROLES.KEPALA_BAGIAN_KEUANGAN,
  ROLES.KEPALA_BAGIAN_UMUM,
];
