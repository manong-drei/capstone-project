const Queue = require('../models/Queue');
const Patient = require('../models/Patient');

/** GET /api/queue — all today's active queues (doctor/staff) */
const getAllQueues = async (req, res) => {
  try {
    const queues = await Queue.findTodayActive();
    res.json(queues);
  } catch (err) {
    console.error('getAllQueues error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/queue/me — patient's own active queue today */
const getMyQueue = async (req, res) => {
  try {
    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    const queue = await Queue.findByPatientId(patient.patient_id);
    res.json(queue);
  } catch (err) {
    console.error('getMyQueue error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** POST /api/queue — patient gets a queue number */
const createQueue = async (req, res) => {
  try {
    const { services, type } = req.body;

    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Check for existing active queue today
    const existing = await Queue.findByPatientId(patient.patient_id);
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have an active queue today.' });
    }

    // Generate queue number: Q-001 format based on today's count
    const [[countRow]] = await require('../config/db').query(
      `SELECT COUNT(*) AS count FROM queues WHERE DATE(created_at) = CURDATE()`
    );
    const queueNumber = `Q-${String(countRow.count + 1).padStart(3, '0')}`;

    const queue = await Queue.create({
      patient_id: patient.patient_id,
      queue_number: queueNumber,
      type: type || 'regular',
      services: services || [],
    });

    res.status(201).json(queue);
  } catch (err) {
    console.error('createQueue error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** POST /api/queue/walkin — staff registers a walk-in patient (no account) */
const createWalkIn = async (req, res) => {
  try {
    const { full_name, contact, type } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const db = require('../config/db');

    // Enforce walk-in daily limit (uses the first doctor's daily_doctor_settings as active dentist)
    const [[settings]] = await db.query(
      `SELECT walk_in_limit FROM daily_doctor_settings
       WHERE date = CURDATE()
       ORDER BY doctor_id ASC
       LIMIT 1`
    );
    const walkInLimit = settings?.walk_in_limit ?? 0;
    const [[{ walkinToday }]] = await db.query(
      `SELECT COUNT(*) AS walkinToday FROM queues
       WHERE patient_id IS NULL AND DATE(created_at) = CURDATE()`
    );
    if (walkInLimit > 0 && walkinToday >= walkInLimit) {
      return res.status(409).json({
        success: false,
        message: 'Walk-in slots are full for today.',
      });
    }

    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS count FROM queues WHERE DATE(created_at) = CURDATE()`
    );
    const queueNumber = `Q-${String(countRow.count + 1).padStart(3, '0')}`;

    const queue = await Queue.create({
      patient_id: null,
      queue_number: queueNumber,
      type: type || 'regular',
      services: [],
      walk_in_name: full_name.trim(),
      walk_in_contact: contact || null,
    });

    res.status(201).json({ success: true, queue });
  } catch (err) {
    console.error('createWalkIn error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** POST /api/queue/call-next — doctor calls next patient */
const callNext = async (req, res) => {
  try {
    const next = await Queue.callNext();
    if (!next) {
      return res.status(404).json({ success: false, message: 'No patients waiting.' });
    }
    res.json(next);
  } catch (err) {
    console.error('callNext error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PATCH /api/queue/:id/status — update queue status */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['waiting', 'serving', 'done', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await Queue.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Queue entry not found.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** PATCH /api/queue/:id/cancel — patient cancels their own queue */
const cancelQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const db = require('../config/db');
    const [[queueRow]] = await db.query('SELECT * FROM queues WHERE id = ?', [id]);
    if (!queueRow) {
      return res.status(404).json({ success: false, message: 'Queue entry not found.' });
    }
    if (queueRow.patient_id !== patient.patient_id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this queue entry.' });
    }

    const updated = await Queue.updateStatus(id, 'cancelled');
    res.json(updated);
  } catch (err) {
    console.error('cancelQueue error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllQueues, getMyQueue, createQueue, createWalkIn, callNext, updateStatus, cancelQueue };