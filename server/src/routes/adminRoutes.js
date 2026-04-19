const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const {
  getOverview,
  getStaff,
  createStaff,
  deactivateStaff,
  getSpecializations,
} = require("../controllers/adminController");

const adminOnly = [authenticate, authorize("admin")];

router.get("/overview",                       ...adminOnly, getOverview);
router.get("/staff",                          ...adminOnly, getStaff);
router.post("/staff",                         ...adminOnly, createStaff);
router.patch("/staff/:user_id/deactivate",    ...adminOnly, deactivateStaff);
router.get("/specializations",                ...adminOnly, getSpecializations);

module.exports = router;