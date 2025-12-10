const express = require("express");
const router = express.Router();
const jenisSuratController = require("../controllers/jenisSuratController");

const auth = require("../middleware/auth");
const { isAdmin } = require("../middleware/rbac");

// All routes require authentication
router.use(auth);

// Public read (authenticated users)
router.get("/", jenisSuratController.getJenisSurat);

// Admin only write
router.post("/", isAdmin, jenisSuratController.createJenisSurat);
router.put("/:id", isAdmin, jenisSuratController.updateJenisSurat);
router.delete("/:id", isAdmin, jenisSuratController.deleteJenisSurat);

module.exports = router;
