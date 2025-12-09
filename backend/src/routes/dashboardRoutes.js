const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// All routes require auth
router.use(auth);

router.get('/stats', dashboardController.getStats);
router.get('/recent', dashboardController.getRecentActivities);
router.get('/monthly', dashboardController.getMonthlyStats);

module.exports = router;
