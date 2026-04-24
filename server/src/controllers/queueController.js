const Queue = require('../models/Queue');
const Patient = require('../models/Patient');

const ALLOWED_SERVICE_IDS = new Set([
  'CONSULTATION',
  'ORAL_PROPHYLAXIS',
  'PERMANENT_FILLING',
  'TEMPORARY_FILLING',
  'FLUORIDE',
  'SILVER_DIAMINE',
  'RPD_UPPER',
  'RPD_LOWER',
  'CLOSED_EXTRACTION',
  'OPEN_EXTRACTION',
  'ODONTECTOMY',
  'SPECIAL_SURGERY',
  'OTHERS',
]);

const GENERAL_SERVICE_ID = 'GENERAL_CONSULTATION';

/** GET /api/queue/status — now-serving and next-queuing numbers (all roles) */
const getQueueStatus = async (req, res) => {
  try {
    const { category } = req.query;
    const status = await Queue.getPublicStatus({ category });
    res.json(status);
  } catch (err) {
    console.error('getQueueStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** GET /api/queue — all today's active queues (doctor/staff) */
const getAllQueues = async (req, res) => {
  try {
    const { category } = req.query;
    const queues = await Queue.findTodayActive({ category });
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

/** POST /api/queue — patient gets a queue number (dental only) */
const createQueue = async (req, res) => {
  try {
    const { services, type } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one service.' });
    }

    const selectedServices = [...new Set(services)];
    if (selectedServices.length > 2) {
      return res.status(400).json({ success: false, message: 'You can select up to 2 services only.' });
    }

    // Patients may only book dental services — reject anything outside the dental whitelist.
    const invalid = selectedServices.find((id) => !ALLOWED_SERVICE_IDS.has(id));
    if (invalid) {
      return res.status(400).json({ success: false, message: 'Invalid service selected.' });
    }

    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const db = require('../config/db');

    // Check for existing active queue today
    const existing = await Queue.findByPatientId(patient.patient_id);
    if (existing) {
      return res.status(409).json({ success: false, message: 'you already have an active queue today' });
    }

    // Limit each patient to two queue registrations per day, regardless of final status.
    const [[{ todayQueueCount }]] = await db.query(
      `SELECT COUNT(*) AS todayQueueCount FROM queues
       WHERE patient_id = ? AND DATE(created_at) = CURDATE()`,
      [patient.patient_id]
    );
    if (todayQueueCount >= 2) {
      return res.status(409).json({
        success: false,
        message: 'You have reached your daily queue limit (2). Please try again tomorrow.',
      });
    }

    // Resolve the active dentist (single-doctor facility — use the first)
    const [[activeDoc]] = await db.query(
      `SELECT doctor_id FROM doctors ORDER BY doctor_id ASC LIMIT 1`
    );

    // A registered-patient queue must consume an appointment slot. If the
    // patient has no pending/confirmed appointment for today, create one.
    if (activeDoc) {
      const [[existingAppt]] = await db.query(
        `SELECT appointment_id FROM appointments
         WHERE patient_id = ? AND appointment_date = CURDATE()
           AND status IN ('pending','confirmed')
         LIMIT 1`,
        [patient.patient_id]
      );

      if (!existingAppt) {
        const [[settings]] = await db.query(
          `SELECT appointment_limit FROM daily_doctor_settings
           WHERE doctor_id = ? AND date = CURDATE()`,
          [activeDoc.doctor_id]
        );
        const limit = settings?.appointment_limit ?? 10;

        const [[{ booked }]] = await db.query(
          `SELECT COUNT(*) AS booked FROM appointments
           WHERE doctor_id = ? AND appointment_date = CURDATE()
             AND status != 'cancelled'`,
          [activeDoc.doctor_id]
        );

        if (booked >= limit) {
          return res.status(409).json({
            success: false,
            message: 'No appointment slots available for today.',
          });
        }

        await db.query(
          `INSERT INTO appointments
             (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
           VALUES (?, ?, CURDATE(), CURTIME(), ?, 'confirmed')`,
          [patient.patient_id, activeDoc.doctor_id, 'Same-day queue registration']
        );
      }
    }

    // Generate queue number (dental-scoped): P-001 for priority, Q-001 for regular
    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS count FROM queues WHERE category = 'dental' AND DATE(created_at) = CURDATE()`
    );
    const prefix = type === 'priority' ? 'P' : 'Q';
    const queueNumber = `${prefix}-${String(countRow.count + 1).padStart(3, '0')}`;

    const queue = await Queue.create({
      patient_id: patient.patient_id,
      queue_number: queueNumber,
      type: type || 'regular',
      category: 'dental',
      services: selectedServices,
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
    const { full_name, age, gender, contact, type, services, category } = req.body;
    const queueCategory = category === 'general' ? 'general' : 'dental';

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!age || isNaN(age) || age < 1 || age > 120) {
      return res.status(400).json({ success: false, message: 'A valid age is required.' });
    }
    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Gender must be male or female.' });
    }

    let selectedServices;
    if (queueCategory === 'general') {
      // General consultation has exactly one service — staff does not pick it.
      selectedServices = [GENERAL_SERVICE_ID];
    } else {
      if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({ success: false, message: 'Please select at least one service.' });
      }
      selectedServices = [...new Set(services)].filter((serviceId) =>
        ALLOWED_SERVICE_IDS.has(serviceId)
      );
      if (selectedServices.length !== services.length) {
        return res.status(400).json({ success: false, message: 'Invalid service selected.' });
      }
    }

    const db = require('../config/db');

    // Walk-in daily limit applies only to dental (it is tied to the dentist's daily_doctor_settings).
    if (queueCategory === 'dental') {
      const [[settings]] = await db.query(
        `SELECT walk_in_limit FROM daily_doctor_settings
         WHERE date = CURDATE()
         ORDER BY doctor_id ASC
         LIMIT 1`
      );
      const walkInLimit = settings?.walk_in_limit ?? 0;
      const [[{ walkinToday }]] = await db.query(
        `SELECT COUNT(*) AS walkinToday FROM queues
         WHERE patient_id IS NULL AND category = 'dental' AND DATE(created_at) = CURDATE()`
      );
      if (walkInLimit > 0 && walkinToday >= walkInLimit) {
        return res.status(409).json({
          success: false,
          message: 'Walk-in slots are full for today.',
        });
      }
    }

    // Queue number is scoped per-category and uses a category-specific prefix.
    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS count FROM queues
       WHERE category = ? AND DATE(created_at) = CURDATE()`,
      [queueCategory]
    );
    const prefix =
      queueCategory === 'general' ? 'G' : type === 'priority' ? 'P' : 'Q';
    const queueNumber = `${prefix}-${String(countRow.count + 1).padStart(3, '0')}`;

    const queue = await Queue.create({
      patient_id: null,
      queue_number: queueNumber,
      type: type || 'regular',
      category: queueCategory,
      services: selectedServices,
      walk_in_name: full_name.trim(),
      walk_in_age: parseInt(age),
      walk_in_gender: gender,
      walk_in_contact: contact || null,
    });

    res.status(201).json({ success: true, queue });
  } catch (err) {
    console.error('createWalkIn error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** POST /api/queue/call-next — doctor/staff calls next patient (optionally scoped by category) */
const callNext = async (req, res) => {
  try {
    const { category } = req.body || {};
    const next = await Queue.callNext({ category });
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

    const allowed = ['waiting', 'serving', 'done', 'cancelled', 'no_show'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await Queue.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Queue entry not found.' });
    }

    // When a registered patient's queue is done, mark their appointment as completed
    if (status === 'done' && updated.patient_id) {
      const db = require('../config/db');
      await db.query(
        `UPDATE appointments
         SET status = 'completed', updated_at = NOW()
         WHERE patient_id = ? AND appointment_date = CURDATE() AND status IN ('pending', 'confirmed')`,
        [updated.patient_id]
      );
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

module.exports = { getQueueStatus, getAllQueues, getMyQueue, createQueue, createWalkIn, callNext, updateStatus, cancelQueue };
