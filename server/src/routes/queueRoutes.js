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
  recallQueue,
  skipQueue,
  returnQueue,
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
router.post('/:id/recall',   authenticate, authorize('doctor', 'staff'),            recallQueue);
router.post('/:id/skip',     authenticate, authorize('doctor', 'staff'),            skipQueue);
router.post('/:id/return',   authenticate, authorize('doctor', 'staff'),            returnQueue);
router.patch('/:id/status',  authenticate, authorize('doctor', 'staff', 'admin'),  updateStatus);

module.exports = router;
