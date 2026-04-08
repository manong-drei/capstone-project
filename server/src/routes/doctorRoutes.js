const express = require("express");
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
} = require("../controllers/doctorController");
const protect = require("../middleware/authenticate"); // direct import

router.get("/", protect, getAllDoctors);
router.get("/:id", protect, getDoctorById);

module.exports = router;
