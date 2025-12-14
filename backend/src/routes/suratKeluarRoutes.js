const express = require("express");
const router = express.Router();
const suratKeluarController = require("../controllers/suratKeluarController");
const auth = require("../middleware/auth");
const {
  isAdmin,
  isKetua,
  canValidate,
  canCreateSurat,
} = require("../middleware/rbac");
const { upload } = require("../config/cloudinary");

// All routes require auth
router.use(auth);

// Get all surat keluar (filtered by role)
router.get("/", suratKeluarController.getAllSuratKeluar);

// Export surat keluar
router.get("/export", suratKeluarController.exportSuratKeluar);

// Get surat keluar by ID
router.get("/:id", suratKeluarController.getSuratKeluarById);

// Create route (Admin & Kabag)
router.post(
  "/",
  canCreateSurat,
  upload.single("file"),
  suratKeluarController.createSuratKeluar
);
router.put(
  "/:id",
  isAdmin,
  upload.single("file"),
  suratKeluarController.updateSuratKeluar
);
router.delete("/:id", isAdmin, suratKeluarController.deleteSuratKeluar);

// Validate (Sekpeng or Bendahara)
router.put(
  "/:id/validasi",
  canValidate,
  suratKeluarController.validateSuratKeluar
);

// Sign (Ketua only)
router.put("/:id/tanda-tangan", isKetua, suratKeluarController.signSuratKeluar);

// Send (Admin only)
router.put("/:id/kirim", isAdmin, suratKeluarController.sendSuratKeluar);

module.exports = router;
