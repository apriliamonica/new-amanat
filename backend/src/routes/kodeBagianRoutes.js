const express = require("express");
const router = express.Router();
const kodeBagianController = require("../controllers/kodeBagianController");
const auth = require("../middleware/auth");
const { hasRole } = require("../middleware/rbac");
const { ROLES } = require("../utils/constants");

// Get all - accessible by Admin and Kabag (for view)
router.get("/", auth, kodeBagianController.getAllKodeBagian);

// Update - accessible only by Admin
router.put(
  "/:id",
  auth,
  hasRole(ROLES.SEKRETARIS_KANTOR),
  kodeBagianController.updateKodeBagian
);

module.exports = router;
