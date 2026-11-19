const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const requireProfileSession = require("../middleware/requireProfileSession");
const rateLimit = require("express-rate-limit");
const { getBohcForecast } = require("../controllers/adminAnalyticsController");
const {
  getOverview,
  getStaff,
  createStaff,
  deactivateStaff,
  reactivateStaff,
  deactivationImpact,
  recoverWorkforce,
  updateStaff,
  getPatients,
  createPatient,
  deactivatePatient,
  reactivatePatient,
  getSpecializations,
} = require("../controllers/adminController");

const adminOnly = [authenticate, authorize("admin")];
const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => String(req.user.user_id),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many recovery requests. Please try again in 15 minutes." },
});
const leave = require('../controllers/doctorLeaveController');
router.get('/doctor-leaves', ...adminOnly, leave.listAll);
router.get('/doctor-leaves/:id', ...adminOnly, leave.reviewDetails);
router.patch('/doctor-leaves/:id', ...adminOnly, leave.decide);
router.get("/audit-logs", ...adminOnly, require("../controllers/auditLogController").getAuditLogs);
const smsController = require('../controllers/smsController');
router.get('/sms-settings', ...adminOnly, smsController.getSettings);
router.put('/sms-settings', ...adminOnly, smsController.updateSettings);
router.get('/sms-jobs', ...adminOnly, smsController.listJobs);
router.patch('/sms-jobs/:id/review', ...adminOnly, smsController.reviewFailure);
router.post('/patients/:user_id/temporary-password', ...adminOnly, smsController.replacePassword);

router.get("/overview", ...adminOnly, getOverview);
router.get("/bohc-forecast", ...adminOnly, getBohcForecast);
router.get("/staff", ...adminOnly, getStaff);
router.post("/staff", ...adminOnly, createStaff);
router.get("/accounts/:user_id/deactivation-impact", ...adminOnly, deactivationImpact);
router.post("/staff/:user_id/account-recovery", ...adminOnly, requireProfileSession, recoveryLimiter, recoverWorkforce);
router.patch("/staff/:user_id/deactivate", ...adminOnly, deactivateStaff);
router.patch("/staff/:user_id/reactivate", ...adminOnly, reactivateStaff);
router.put("/staff/:user_id", ...adminOnly, updateStaff);
router.get("/patients", authenticate, authorize("admin", "staff"), getPatients);
router.post("/patients", authenticate, authorize("admin", "staff"), createPatient);
router.patch("/patients/:user_id/deactivate", ...adminOnly, deactivatePatient);
router.patch("/patients/:user_id/reactivate", ...adminOnly, reactivatePatient);
router.get("/specializations", ...adminOnly, getSpecializations);

module.exports = router;
