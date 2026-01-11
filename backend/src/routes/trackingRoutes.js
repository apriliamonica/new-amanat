const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/trackingController");
const auth = require("../middleware/auth");

router.post("/", auth, trackingController.createLog);

module.exports = router;
