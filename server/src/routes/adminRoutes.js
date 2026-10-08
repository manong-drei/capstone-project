const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { getBohcForecast } = require("../controllers/adminAnalyticsController");
const {
  getOverview,
  getStaff,
  createStaff,
  deactivateStaff,
  reactivateStaff,
  updateStaff,
  getPatients,
  createPatient,
  deactivatePatient,
  reactivatePatient,
  getSpecializations,
} = require("../controllers/adminController");

const adminOnly = [authenticate, authorize("admin")];
const smsController = require('../controllers/smsController');
router.get('/sms-settings', ...adminOnly, smsController.getSettings);
router.put('/sms-settings', ...adminOnly, smsController.updateSettings);
router.get('/sms-jobs', ...adminOnly, smsController.listJobs);
router.post('/patients/:user_id/temporary-password', ...adminOnly, smsController.replacePassword);

router.get("/overview", ...adminOnly, getOverview);
router.get("/bohc-forecast", ...adminOnly, getBohcForecast);
router.get("/staff", ...adminOnly, getStaff);
router.post("/staff", ...adminOnly, createStaff);
router.patch("/staff/:user_id/deactivate", ...adminOnly, deactivateStaff);
router.patch("/staff/:user_id/reactivate", ...adminOnly, reactivateStaff);
router.put("/staff/:user_id", ...adminOnly, updateStaff);
router.get("/patients", ...adminOnly, getPatients);
router.post("/patients", ...adminOnly, createPatient);
router.patch("/patients/:user_id/deactivate", ...adminOnly, deactivatePatient);
router.patch("/patients/:user_id/reactivate", ...adminOnly, reactivatePatient);
router.get("/specializations", ...adminOnly, getSpecializations);

module.exports = router;
