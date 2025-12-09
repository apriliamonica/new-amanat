const express = require('express');
const router = express.Router();
const disposisiController = require('../controllers/disposisiController');
const auth = require('../middleware/auth');
const { canDisposisi } = require('../middleware/rbac');

// All routes require auth
router.use(auth);

// Get my disposisi
router.get('/', disposisiController.getMyDisposisi);

// Get disposisi by surat
router.get('/surat/:type/:suratId', disposisiController.getDisposisiBySurat);

// Create disposisi (only authorized roles)
router.post('/', canDisposisi, disposisiController.createDisposisi);

// Update disposisi
router.put('/:id', disposisiController.updateDisposisi);

// Complete disposisi
router.put('/:id/selesai', disposisiController.completeDisposisi);

module.exports = router;
