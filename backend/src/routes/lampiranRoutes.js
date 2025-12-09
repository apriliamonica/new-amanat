const express = require('express');
const router = express.Router();
const lampiranController = require('../controllers/lampiranController');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// All routes require auth
router.use(auth);

// Get lampiran by surat
router.get('/surat/:type/:suratId', lampiranController.getLampiranBySurat);

// Upload lampiran
router.post('/', upload.single('file'), lampiranController.uploadLampiran);

// Delete lampiran
router.delete('/:id', lampiranController.deleteLampiran);

module.exports = router;
