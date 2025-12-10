// Role-based access control middleware

// Check if user has one of the allowed roles
const hasRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Tidak terautentikasi" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    next();
  };
};

// Only Sekretaris Kantor (Admin)
const isAdmin = hasRole("SEKRETARIS_KANTOR");

// Ketua Pengurus
const isKetua = hasRole("KETUA_PENGURUS");

// Sekretaris Pengurus
const isSekpeng = hasRole("SEKRETARIS_PENGURUS");

// Bendahara
const isBendahara = hasRole("BENDAHARA");

// Any Kepala Bagian
const isKabag = hasRole(
  "KEPALA_BAGIAN_PSDM",
  "KEPALA_BAGIAN_KEUANGAN",
  "KEPALA_BAGIAN_UMUM"
);

// Can validate surat keluar (Sekpeng or Bendahara)
const canValidate = hasRole("SEKRETARIS_PENGURUS", "BENDAHARA");

// Can create disposisi (Admin, Ketua, Sekpeng, Bendahara)
const canDisposisi = hasRole(
  "SEKRETARIS_KANTOR",
  "KETUA_PENGURUS",
  "SEKRETARIS_PENGURUS",
  "BENDAHARA"
);

// Can create surat keluar (Admin and all Kabag)
const canCreateSurat = hasRole(
  "SEKRETARIS_KANTOR",
  "KEPALA_BAGIAN_PSDM",
  "KEPALA_BAGIAN_KEUANGAN",
  "KEPALA_BAGIAN_UMUM"
);

// All roles except Kabag
const isPetinggi = hasRole(
  "SEKRETARIS_KANTOR",
  "KETUA_PENGURUS",
  "SEKRETARIS_PENGURUS",
  "BENDAHARA"
);

module.exports = {
  hasRole,
  isAdmin,
  isKetua,
  isSekpeng,
  isBendahara,
  isKabag,
  canValidate,
  canDisposisi,
  canCreateSurat,
  isPetinggi,
};
