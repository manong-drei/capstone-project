const { isValid, parseISO } = require("date-fns");
const Queue = require("../models/Queue");
const Patient = require("../models/Patient");
const pool = require("../config/db");
const { normalizePhilippineMobilePhone } = require("../utils/phone");
const { wakeWorker } = require('../services/smsNotifications');

const ALLOWED_SERVICE_IDS = new Set([
  "CONSULTATION",
  "ORAL_PROPHYLAXIS",
  "PERMANENT_FILLING",
  "TEMPORARY_FILLING",
  "FLUORIDE",
  "SILVER_DIAMINE",
  "RPD_UPPER",
  "RPD_LOWER",
  "CLOSED_EXTRACTION",
  "OPEN_EXTRACTION",
  "ODONTECTOMY",
  "SPECIAL_SURGERY",
  "OTHERS",
]);

const GENERAL_SERVICE_ID = "GENERAL_CONSULTATION";
const httpError = (status, message) => Object.assign(new Error(message), { status });
const splitName = (name) => {
  const [first_name, ...rest] = name.trim().replace(/\s+/g, " ").split(" ");
  return { first_name, last_name: rest.join(" ") };
};

/** GET /api/queue/status — now-serving and next-queuing numbers (all roles) */
const getQueueStatus = async (req, res) => {
  try {
    const { category } = req.query;
    const status = await Queue.getPublicStatus({ category });
    res.json(status);
  } catch (err) {
    console.error("getQueueStatus error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/queue — all today's active queues (doctor/staff) */
const getAllQueues = async (req, res) => {
  try {
    const { category } = req.query;
    const queues = await Queue.findTodayActive({ category });
    res.json(queues);
  } catch (err) {
    console.error("getAllQueues error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/queue/me — patient's own active queue today */
const getMyQueue = async (req, res) => {
  try {
    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    const queue = await Queue.findByPatientId(patient.patient_id);
    res.json(queue);
  } catch (err) {
    console.error("getMyQueue error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/queue — patient gets a queue number (dental only) */
const createQueue = async (req, res) => {
  const { services, type } = req.body;
  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ success: false, message: "Please select at least one service." });
  }

  const selectedServices = [...new Set(services)];
  if (selectedServices.length > 2 || selectedServices.some((id) => !ALLOWED_SERVICE_IDS.has(id))) {
    return res.status(400).json({ success: false, message: "Select up to two valid services." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await Queue.lockCategory('dental', connection);
    const [[patient]] = await connection.query(
      "SELECT * FROM patients WHERE user_id = ? FOR UPDATE",
      [req.user.user_id],
    );
    if (!patient) throw httpError(404, "Patient profile not found.");
    if (type === "priority" && (!patient.priority_category || (patient.priority_expires_at && new Date(patient.priority_expires_at) <= new Date()))) {
      throw httpError(403, "You are not eligible for priority queuing.");
    }
    if (await Queue.findByPatientId(patient.patient_id, connection)) {
      throw httpError(409, "You already have an active queue today.");
    }

    const [[{ todayQueueCount }]] = await connection.query(
      "SELECT COUNT(*) AS todayQueueCount FROM queues WHERE patient_id = ? AND DATE(created_at) = CURDATE()",
      [patient.patient_id],
    );
    if (todayQueueCount >= 2) throw httpError(409, "You have reached your daily queue limit (2). Please try again tomorrow.");

    const [[doctor]] = await connection.query(
      "SELECT doctor_id FROM doctors ORDER BY doctor_id ASC LIMIT 1 FOR UPDATE",
    );
    if (!doctor) throw httpError(409, "No dentist is available today.");

    const [[settings]] = await connection.query(
      `SELECT appointment_limit, is_available FROM daily_doctor_settings
       WHERE doctor_id = ? AND date = CURDATE()`,
      [doctor.doctor_id],
    );
    if (settings?.is_available === 0) throw httpError(409, "The dentist is unavailable today.");

    const [[existingAppointment]] = await connection.query(
      `SELECT appointment_id FROM appointments
       WHERE patient_id = ? AND appointment_date = CURDATE()
         AND status IN ('pending', 'confirmed') LIMIT 1 FOR UPDATE`,
      [patient.patient_id],
    );
    if (!existingAppointment) {
      const [[{ booked }]] = await connection.query(
        `SELECT COUNT(*) AS booked FROM appointments
         WHERE doctor_id = ? AND appointment_date = CURDATE() AND status != 'cancelled'`,
        [doctor.doctor_id],
      );
      if (booked >= (settings?.appointment_limit ?? 10)) throw httpError(409, "No appointment slots available for today.");
      await connection.query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
         VALUES (?, ?, CURDATE(), CURTIME(), ?, 'confirmed')`,
        [patient.patient_id, doctor.doctor_id, "Same-day queue registration"],
      );
    }

    const queueType = type === "priority" ? "priority" : "regular";
    const queue = await Queue.create({
      patient_id: patient.patient_id,
      queue_number: await Queue.nextQueueNumber({ category: "dental", type: queueType }, connection),
      type: queueType,
      category: "dental",
      services: selectedServices,
    }, connection);
    await connection.commit();
    wakeWorker();
    res.status(201).json(queue);
  } catch (err) {
    await connection.rollback();
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Server error." });
  } finally {
    connection.release();
  }
};

const createWalkIn = async (req, res) => {
  const { full_name, date_of_birth, gender, contact, address, type, services, category, patient_id, create_new_confirmed, priority_category } = req.body;
  const queueCategory = category === "general" ? "general" : "dental";
  const name = typeof full_name === "string" ? full_name.trim().replace(/\s+/g, " ") : "";
  const names = name ? splitName(name) : { first_name: "", last_name: "" };
  const phone = normalizePhilippineMobilePhone(contact);
  if (!names.first_name || !names.last_name || names.first_name.length > 100 || names.last_name.length > 100) return res.status(400).json({ success: false, message: "A first and last name of up to 100 characters each are required." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth || "") || !isValid(parseISO(date_of_birth)) || new Date(date_of_birth) > new Date()) {
    return res.status(400).json({ success: false, message: "A valid date of birth is required." });
  }
  if (!["male", "female", "other"].includes(gender)) return res.status(400).json({ success: false, message: "Select a valid gender." });
  if (!phone) return res.status(400).json({ success: false, message: "A valid Philippine mobile number is required." });
  if (typeof address !== "string" || !address.trim() || address.length > 80) return res.status(400).json({ success: false, message: "A valid address is required." });
  const barangay = address.trim().replace(/^Barangay\s+/i, "").replace(/,\s*Bago City$/i, "");
  if (!barangay) return res.status(400).json({ success: false, message: "A valid address is required." });
  if (priority_category && !["senior", "pwd", "pregnant"].includes(priority_category)) return res.status(400).json({ success: false, message: "Invalid priority category." });
  if (type === "priority" && !priority_category) return res.status(400).json({ success: false, message: "A priority category is required." });
  if (patient_id != null && (!Number.isSafeInteger(Number(patient_id)) || Number(patient_id) <= 0)) return res.status(400).json({ success: false, message: "Invalid patient." });

  const selectedServices = queueCategory === "general" ? [GENERAL_SERVICE_ID] : Array.isArray(services) ? [...new Set(services)] : [];
  if (!selectedServices.length || selectedServices.length > 2 || (queueCategory === "dental" && selectedServices.some((service) => !ALLOWED_SERVICE_IDS.has(service)))) {
    return res.status(400).json({ success: false, message: "Please select valid services." });
  }

  let connection;
  let lockAcquired = false;
  try {
    connection = await pool.getConnection();
    // ponytail: one registration lock keeps duplicate checks atomic; use keyed locks if staff throughput grows.
    const [[{ acquired }]] = await connection.query("SELECT GET_LOCK('walkin_patient_registration', 10) AS acquired");
    lockAcquired = acquired === 1;
    if (!lockAcquired) throw httpError(503, "Registration is busy. Please try again.");
    await connection.beginTransaction();
    await Queue.lockCategory(queueCategory, connection);
    if (queueCategory === "dental") {
      const [[doctor]] = await connection.query(
        "SELECT doctor_id FROM doctors ORDER BY doctor_id ASC LIMIT 1 FOR UPDATE",
      );
      if (!doctor) throw httpError(409, "No dentist is available today.");

      const [[settings]] = await connection.query(
        `SELECT walk_in_limit, is_available FROM daily_doctor_settings
         WHERE doctor_id = ? AND date = CURDATE()`,
        [doctor.doctor_id],
      );
      if (settings?.is_available === 0) throw httpError(409, "The dentist is unavailable today.");

      const [[{ walkinToday }]] = await connection.query(
        `SELECT COUNT(*) AS walkinToday FROM queues
         WHERE is_walk_in = 1 AND category = 'dental' AND DATE(created_at) = CURDATE()`,
      );
      if ((settings?.walk_in_limit ?? 0) > 0 && walkinToday >= settings.walk_in_limit) {
        throw httpError(409, "Walk-in slots are full for today.");
      }
    }

    let patientId = patient_id ? Number(patient_id) : null;
    if (patientId) {
      const [[existing]] = await connection.query("SELECT * FROM patients WHERE patient_id = ? FOR UPDATE", [patientId]);
      if (!existing || existing.archived_into_patient_id) throw httpError(404, "Patient record not found or archived.");
      const { first_name, last_name } = names;
      const changes = {};
      for (const [key, value] of Object.entries({ first_name, last_name, date_of_birth, gender: gender[0].toUpperCase() + gender.slice(1), contact_number: phone, barangay, priority_category: priority_category || existing.priority_category })) {
        const old = existing[key] instanceof Date ? existing[key].toISOString().slice(0, 10) : existing[key];
        if (String(old ?? "") !== String(value ?? "")) changes[key] = { from: old, to: value };
      }
      if (Object.keys(changes).length) {
        await connection.query(
          "UPDATE patients SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, contact_number = ?, barangay = ?, priority_category = ? WHERE patient_id = ?",
          [first_name, last_name, date_of_birth, gender, phone, barangay, priority_category || existing.priority_category, patientId],
        );
        await Patient.audit(patientId, req.user.user_id, "update", changes, connection);
      }
    } else {
      const [likely] = await connection.query(
        `SELECT p.patient_id FROM patients p LEFT JOIN users u ON p.user_id = u.user_id
         WHERE p.archived_into_patient_id IS NULL
         AND (COALESCE(p.contact_number, u.phone) = ? OR (LOWER(CONCAT(p.first_name, ' ', p.last_name)) = LOWER(?) AND p.date_of_birth = ?))
         LIMIT 1 FOR UPDATE`,
        [phone, name, date_of_birth],
      );
      if (likely.length && create_new_confirmed !== true) throw httpError(409, "Possible existing patient found. Select their record or explicitly confirm a new record.");
      patientId = await Patient.createWalkIn({ ...names, date_of_birth, gender, contact_number: phone, barangay }, connection);
      if (priority_category) await connection.query("UPDATE patients SET priority_category = ? WHERE patient_id = ?", [priority_category, patientId]);
      await Patient.audit(patientId, req.user.user_id, "create", likely.length ? { duplicate_override: true, possible_patient_ids: likely.map((p) => p.patient_id) } : null, connection);
    }
    const [[active]] = await connection.query(
      "SELECT id FROM queues WHERE patient_id = ? AND DATE(created_at) = CURDATE() AND status IN ('waiting', 'serving') LIMIT 1",
      [patientId],
    );
    if (active) throw httpError(409, "This patient already has an active queue today.");

    const queueType = type === "priority" ? "priority" : "regular";
    const queue = await Queue.create({
      patient_id: patientId,
      is_walk_in: true,
      queue_number: await Queue.nextQueueNumber({ category: queueCategory, type: queueType }, connection),
      type: queueType,
      category: queueCategory,
      services: selectedServices,
      walk_in_name: name,
      walk_in_dob: date_of_birth,
      walk_in_gender: gender === "other" ? null : gender,
      walk_in_contact: phone,
    }, connection);
    await Patient.audit(patientId, req.user.user_id, "queue", { queue_id: queue.id }, connection);
    await connection.commit();
    wakeWorker();
    res.status(201).json({ success: true, queue });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Server error." });
  } finally {
    if (connection) {
      if (lockAcquired) await connection.query("SELECT RELEASE_LOCK('walkin_patient_registration')");
      connection.release();
    }
  }
};

const callNext = async (req, res) => {
  try {
    const { category } = req.body || {};
    if (category !== undefined && !['dental', 'general'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid queue category.' });
    }
    const next = await Queue.callNext({ category });
    if (next?.conflict) {
      return res.status(409).json({
        success: false,
        message: "A patient is already being served in this queue.",
      });
    }
    if (!next) {
      return res
        .status(404)
        .json({ success: false, message: "No patients waiting." });
    }
    res.json(next);
    wakeWorker();
  } catch (err) {
    console.error("callNext error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/queue/:id/status — update queue status */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const allowed = ["waiting", "serving", "done", "cancelled", "no_show"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
    }

    if (["cancelled", "no_show"].includes(status) && !String(reason ?? "").trim()) {
      return res.status(400).json({ success: false, message: "A reason is required for cancellation or no-show." });
    }

    const updated = await Queue.updateStatus(id, status, ["cancelled", "no_show"].includes(status) ? String(reason).trim() : null);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Queue entry not found." });
    }

    if (status === "cancelled" && updated.patient_id && !updated.is_walk_in) {
      const db = require("../config/db");
      await db.query(
        `UPDATE appointments
         SET status = 'cancelled', updated_at = NOW()
         WHERE patient_id = ? AND appointment_date = DATE(?) AND status IN ('pending', 'confirmed')`,
        [updated.patient_id, updated.created_at],
      );
    }

    // When a registered patient's queue is done, mark their appointment as completed
    if (status === "done" && updated.patient_id && !updated.is_walk_in) {
      const db = require("../config/db");
      await db.query(
        `UPDATE appointments
         SET status = 'completed', updated_at = NOW()
         WHERE patient_id = ? AND appointment_date = CURDATE() AND status IN ('pending', 'confirmed')`,
        [updated.patient_id],
      );
    }

    res.json(updated);
    wakeWorker();
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/queue/:id/cancel — patient cancels their own queue */
const cancelQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }

    const db = require("../config/db");
    const [[queueRow]] = await db.query("SELECT * FROM queues WHERE id = ?", [
      id,
    ]);
    if (!queueRow) {
      return res
        .status(404)
        .json({ success: false, message: "Queue entry not found." });
    }
    if (queueRow.patient_id !== patient.patient_id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this queue entry.",
      });
    }

    const { reason } = req.body;
    if (!String(reason ?? "").trim()) {
      return res.status(400).json({ success: false, message: "Please select a cancellation reason." });
    }

    const updated = await Queue.updateStatus(id, "cancelled", String(reason).trim());
    if (updated.patient_id && !updated.is_walk_in) {
      await db.query(
        `UPDATE appointments
         SET status = 'cancelled', updated_at = NOW()
         WHERE patient_id = ? AND appointment_date = DATE(?) AND status IN ('pending', 'confirmed')`,
        [updated.patient_id, updated.created_at],
      );
    }
    res.json(updated);
    wakeWorker();
  } catch (err) {
    console.error("cancelQueue error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getQueueStatus,
  getAllQueues,
  getMyQueue,
  createQueue,
  createWalkIn,
  callNext,
  updateStatus,
  cancelQueue,
};
