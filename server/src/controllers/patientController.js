const Patient = require("../models/Patient");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { normalizePhilippineMobilePhone } = require("../utils/phone");

/** GET /api/patients/me */
const getMyProfile = async (req, res) => {
  try {
    const profile = await Patient.findByUserId(req.user.user_id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    await Patient.audit(profile.patient_id, req.user.user_id, "view");
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("getMyProfile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PUT /api/patients/me */
const updateProfile = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.contact_number !== undefined) {
      const normalizedPhone = normalizePhilippineMobilePhone(payload.contact_number);
      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
        });
      }
      payload.contact_number = normalizedPhone;
    }

    if (payload.emg_contact_no !== undefined && String(payload.emg_contact_no).trim()) {
      const normalizedEmergency = normalizePhilippineMobilePhone(payload.emg_contact_no);
      if (!normalizedEmergency) {
        return res.status(400).json({
          success: false,
          message: "Emergency contact number must be a valid Philippine mobile number in the format 09xxxxxxxxx.",
        });
      }
      payload.emg_contact_no = normalizedEmergency;
    }

    const updated = await Patient.updateByUserId(req.user.user_id, payload);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Profile updated successfully.",
        data: updated,
      });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/patients/:id  (admin/staff/doctor only) */
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }
    const [visits] = await pool.query(
      `SELECT id, queue_number, category, type, status, status_reason, services, created_at
       FROM queues WHERE patient_id = ? ORDER BY created_at DESC, id DESC`,
      [patient.patient_id],
    );
    await Patient.audit(patient.patient_id, req.user.user_id, "view");
    const user = patient.user_id ? await User.findById(patient.user_id) : null;
    const account = user?.role === "patient" ? {
      phone: user.phone,
      is_active: user.is_active,
      credential_version: user.credential_version,
    } : null;
    res.status(200).json({ success: true, data: { ...patient, visits, account } });
  } catch (err) {
    console.error("getPatientById error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const searchPatients = async (req, res) => {
  try {
    const name = String(req.query.name || "").trim().replace(/\s+/g, " ").slice(0, 100);
    const phoneInput = req.query.phone;
    const phone = typeof phoneInput === "string" && /^\+?[\d\s-]+$/.test(phoneInput.trim())
      ? normalizePhilippineMobilePhone(phoneInput) || phoneInput.replace(/\D/g, "") : null;
    const date_of_birth = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date_of_birth || "") ? req.query.date_of_birth : null;
    if ((phoneInput && (!phone || !/^\d{4,12}$/.test(phone))) || (!phone && name.length < 2 && !date_of_birth)) {
      return res.status(400).json({ success: false, message: "Enter a name, date of birth, or at least 4 mobile number digits." });
    }
    const matches = await Patient.search({ name, phone, date_of_birth });
    for (const match of matches) await Patient.audit(match.patient_id, req.user.user_id, "search");
    res.json({ success: true, data: matches.map(({ contact_number, ...patient }) => ({
      ...patient,
      masked_contact: contact_number ? `•••••••${contact_number.slice(-4)}` : null,
    })) });
  } catch (err) {
    console.error("searchPatients error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const mergePatient = async (req, res) => {
  const sourceId = Number(req.params.id);
  const targetId = Number(req.body.target_patient_id);
  if (!Number.isSafeInteger(sourceId) || !Number.isSafeInteger(targetId) || sourceId <= 0 || targetId <= 0 || sourceId === targetId || req.body.confirm !== true) {
    return res.status(400).json({ success: false, message: "Choose a different target patient and confirm the merge." });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT patient_id, user_id, archived_into_patient_id FROM patients WHERE patient_id IN (?, ?) ORDER BY patient_id FOR UPDATE",
      [sourceId, targetId],
    );
    const source = rows.find((row) => row.patient_id === sourceId);
    const target = rows.find((row) => row.patient_id === targetId);
    if (!source || !target) throw Object.assign(new Error("Patient not found."), { status: 404 });
    if (source.user_id || source.archived_into_patient_id || target.archived_into_patient_id) {
      throw Object.assign(new Error("Only an active walk-in record can be merged into an active patient."), { status: 409 });
    }
    const [[{ active_count }]] = await connection.query(
      `SELECT COUNT(*) AS active_count FROM queues WHERE patient_id IN (?, ?)
       AND DATE(created_at) = CURDATE() AND status IN ('waiting', 'called', 'serving', 'missed')`,
      [sourceId, targetId],
    );
    if (active_count > 1) throw Object.assign(new Error("Resolve the patients' active queues before merging."), { status: 409 });
    await connection.query("UPDATE queues SET patient_id = ? WHERE patient_id = ?", [targetId, sourceId]);
    await connection.query("UPDATE patients SET archived_into_patient_id = ? WHERE patient_id = ?", [targetId, sourceId]);
    await Patient.audit(sourceId, req.user.user_id, "merged_into", { target_patient_id: targetId }, connection);
    await Patient.audit(targetId, req.user.user_id, "merged_from", { source_patient_id: sourceId }, connection);
    await connection.commit();
    res.json({ success: true, data: { patient_id: targetId } });
  } catch (err) {
    await connection.rollback();
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Server error." });
  } finally {
    connection.release();
  }
};

const RECOVERY_CHECKS = ["patient_present", "first_name", "last_name", "phone", "address", "date_of_birth"];

/** POST /api/patients/:id/account-recovery */
const recoverAccount = async (req, res) => {
  res.set("Cache-Control", "no-store");
  const patientId = Number(req.params.id);
  const { expected_credential_version: expectedVersion, verification } = req.body || {};
  if (!Number.isSafeInteger(patientId) || patientId < 1 ||
      !Number.isSafeInteger(expectedVersion) || expectedVersion < 1 ||
      !verification || RECOVERY_CHECKS.some((key) => verification[key] !== true)) {
    return res.status(400).json({ success: false, message: "Confirm the patient's presence and all five identity checks before recovery." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[patient]] = await connection.query(
      "SELECT patient_id, user_id, archived_into_patient_id, first_name, last_name, date_of_birth, barangay, city FROM patients WHERE patient_id = ? FOR UPDATE",
      [patientId],
    );
    if (!patient) throw Object.assign(new Error("Patient not found."), { status: 404 });
    if (!patient.user_id || patient.archived_into_patient_id) {
      throw Object.assign(new Error("Recovery requires a patient account linked to an unarchived record."), { status: 409 });
    }
    const [[user]] = await connection.query(
      "SELECT user_id, phone, role, is_active, credential_version, DATE_ADD(NOW(), INTERVAL 30 MINUTE) AS recovery_expires_at FROM users WHERE user_id = ? FOR UPDATE",
      [patient.user_id],
    );
    if (!user || user.role !== "patient" || !user.is_active) {
      throw Object.assign(new Error("Only active patient accounts can be recovered."), { status: 409 });
    }
    if (user.credential_version !== expectedVersion) {
      throw Object.assign(new Error("This account has changed. Refresh the patient profile and verify identity again."), { status: 409 });
    }
    if (!normalizePhilippineMobilePhone(user.phone) || !patient.date_of_birth ||
        Number.isNaN(new Date(patient.date_of_birth).getTime()) ||
        ["first_name", "last_name", "barangay", "city"].some((key) => typeof patient[key] !== "string" || !patient[key].trim())) {
      throw Object.assign(new Error("Complete the patient's identity record before account recovery."), { status: 409 });
    }

    const password = User.generateTempPassword();
    const version = user.credential_version + 1;
    const expiresAt = user.recovery_expires_at.toISOString();
    await connection.query(
      `UPDATE users SET password_hash = ?, must_change_password = 1, credential_version = ?,
       temp_password_expires_at = ?, temp_password_used_at = NULL,
       login_failures = 0, login_locked_until = NULL WHERE user_id = ?`,
      [await bcrypt.hash(password, 10), version, user.recovery_expires_at, user.user_id],
    );
    await connection.query(
      `UPDATE sms_jobs SET state = 'cancelled', payload = NULL, last_error = 'credential_replaced'
       WHERE user_id = ? AND purpose = 'temporary_password' AND state IN ('queued','submitting')`,
      [user.user_id],
    );
    await Patient.audit(patientId, req.user.user_id, "account_recovery", {
      user_id: user.user_id,
      verification: Object.fromEntries(RECOVERY_CHECKS.map((key) => [key, true])),
      credential_version: version,
      expires_at: expiresAt,
    }, connection);
    await connection.commit();
    res.status(201).json({ success: true, data: {
      temp_password: password,
      expires_at: expiresAt,
      registered_phone: user.phone,
    } });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Unable to recover this account. Refresh the profile before trying again." });
  } finally {
    connection?.release();
  }
};

module.exports = { getMyProfile, updateProfile, getPatientById, searchPatients, mergePatient, recoverAccount };
