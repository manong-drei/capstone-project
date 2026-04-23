const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const {
  getOverview,
  getStaff, createStaff, deactivateStaff, reactivateStaff, updateStaff,
  getPatients, deactivatePatient, reactivatePatient,
  getSpecializations,
} = require("../controllers/adminController");

const adminOnly = [authenticate, authorize("admin")];

router.get("/overview",                          ...adminOnly, getOverview);
router.get("/staff",                             ...adminOnly, getStaff);
router.post("/staff",                            ...adminOnly, createStaff);
router.patch("/staff/:user_id/deactivate",       ...adminOnly, deactivateStaff);
router.patch("/staff/:user_id/reactivate",       ...adminOnly, reactivateStaff);
router.put("/staff/:user_id",                    ...adminOnly, updateStaff);
router.get("/patients",                          ...adminOnly, getPatients);
router.patch("/patients/:user_id/deactivate",    ...adminOnly, deactivatePatient);
router.patch("/patients/:user_id/reactivate",    ...adminOnly, reactivatePatient);
router.get("/specializations",                   ...adminOnly, getSpecializations);

module.exports = router;
