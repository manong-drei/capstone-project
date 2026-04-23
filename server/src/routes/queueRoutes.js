const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  getQueueStatus,
  getAllQueues,
  getMyQueue,
  createQueue,
  createWalkIn,
  callNext,
  updateStatus,
  cancelQueue,
} = require('../controllers/queueController');

// Public status (all authenticated roles)
router.get('/status',        authenticate,                                          getQueueStatus);

// Patient routes
router.get('/me',            authenticate, authorize('patient'),                    getMyQueue);
router.post('/',             authenticate, authorize('patient'),                    createQueue);
router.patch('/:id/cancel',  authenticate, authorize('patient'),                    cancelQueue);

// Doctor/staff routes
router.get('/',              authenticate, authorize('doctor', 'staff', 'admin'),   getAllQueues);
router.post('/walkin',       authenticate, authorize('staff', 'admin'),             createWalkIn);
router.post('/call-next',    authenticate, authorize('doctor', 'staff'),            callNext);
router.patch('/:id/status',  authenticate, authorize('doctor', 'staff', 'admin'),  updateStatus);

module.exports = router;