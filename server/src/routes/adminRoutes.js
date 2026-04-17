const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { getOverview } = require("../controllers/adminController");

// GET /api/admin/overview
router.get("/overview", authenticate, authorize("admin"), getOverview);

module.exports = router;
