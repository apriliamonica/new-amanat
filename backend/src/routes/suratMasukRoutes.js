const express = require('express');
const router = express.Router();
const suratMasukController = require('../controllers/suratMasukController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const { upload } = require('../config/cloudinary');

// All routes require auth
router.use(auth);

// Get all surat masuk (filtered by role)
router.get('/', suratMasukController.getAllSuratMasuk);

// Get surat masuk by ID
router.get('/:id', suratMasukController.getSuratMasukById);

// Admin only routes
router.post('/', isAdmin, upload.single('file'), suratMasukController.createSuratMasuk);
router.put('/:id', isAdmin, upload.single('file'), suratMasukController.updateSuratMasuk);
router.delete('/:id', isAdmin, suratMasukController.deleteSuratMasuk);

// Update status (authorized users)
router.put('/:id/status', suratMasukController.updateStatusSuratMasuk);

module.exports = router;
