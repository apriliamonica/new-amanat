const express = require("express");
const router = express.Router();
const kodeAreaController = require("../controllers/kodeAreaController");
const auth = require("../middleware/auth");
const { hasRole } = require("../middleware/rbac");
const { ROLES } = require("../utils/constants");

// Public/Auth read
router.get("/", auth, kodeAreaController.getAllKodeArea);

// Admin write
router.post(
  "/",
  auth,
  hasRole(ROLES.SEKRETARIS_KANTOR),
  kodeAreaController.createKodeArea
);
router.put(
  "/:id",
  auth,
  hasRole(ROLES.SEKRETARIS_KANTOR),
  kodeAreaController.updateKodeArea
);
router.delete(
  "/:id",
  auth,
  hasRole(ROLES.SEKRETARIS_KANTOR),
  kodeAreaController.deleteKodeArea
);

module.exports = router;
