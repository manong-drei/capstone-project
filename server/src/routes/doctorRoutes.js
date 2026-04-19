const express = require('express');
const router = express.Router();
const { getAllDoctors, getDoctorById, createConsultation } = require('../controllers/doctorController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/',                  authenticate,                       getAllDoctors);
router.get('/:id',               authenticate,                       getDoctorById);
router.post('/consultations',    authenticate, authorize('doctor'),  createConsultation);

module.exports = router;