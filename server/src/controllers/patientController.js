const Patient = require("../models/Patient");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const DoctorHistory = require("../models/DoctorHistory");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { normalizePhilippineMobilePhone } = require("../utils/phone");
const { normalizeProfileChanges } = require("../utils/profile");

/** GET /api/patients/me */
const getMyProfile = async (req, res) => {
  try {
    const profile = await Patient.findByUserId(req.user.user_id);
    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    await Patient.audit(profile.patient_id, req.user.user_id, "view", null, pool, req);
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error("getMyProfile error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PUT /api/patients/me */
const updateProfile = async (req, res) => {
  try {
    const payload = normalizeProfileChanges(req.body, true);
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
    if (err.status === 400) return res.status(400).json({ success: false, message: err.message });
    console.error("Patient profile update failed:", err.code || err.name);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/patients/:id  (admin/staff/doctor only) */
const getPatientById = async (req, res) => {
  const patientId = Number(req.params.id);
  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    return res.status(400).json({ success: false, message: "A valid patient ID is required." });
  }
  try {
    let visits;
    if (req.user.role === "doctor") {
      res.set("Cache-Control", "no-store");
      const doctor = await Doctor.findByUserId(req.user.user_id);
      if (!doctor) return res.status(404).json({ success: false, message: "Dentist profile not found." });
      visits = await DoctorHistory.findVisits(doctor.doctor_id, patientId);
      if (!visits.length) return res.status(404).json({ success: false, message: "Patient not found." });
    }
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }
    if (!visits) [visits] = await pool.query(
      `SELECT id, queue_number, category, type, status, status_reason, services, is_walk_in, created_at
       FROM queues WHERE patient_id = ? ORDER BY created_at DESC, id DESC`,
      [patient.patient_id],
    );
    const user = req.user.role !== "doctor" && patient.user_id ? await User.findById(patient.user_id) : null;
    const account = user?.role === "patient" ? {
      phone: user.phone,
      is_active: user.is_active,
      credential_version: user.credential_version,
    } : null;
    await Patient.audit(patient.patient_id, req.user.user_id, "view", null, pool, req);
    res.status(200).json({ success: true, data: { ...patient, visits, account } });
  } catch (err) {
    console.error("getPatientById error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const searchPatients = async (req, res) => {
  try {
    const name = String(req.query.name || "").trim().replace(/\s+/g, " ").slice(0, 323);
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
    await Patient.audit(sourceId, req.user.user_id, "merged_into", { target_patient_id: targetId }, connection, req);
    await Patient.audit(targetId, req.user.user_id, "merged_from", { source_patient_id: sourceId }, connection, req);
    await connection.commit();
    res.json({ success: true, data: { patient_id: targetId } });
  } catch (err) {
    await connection.rollback();
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Server error." });
  } finally {
    connection.release();
  }
};

const requireRecoveryPassword = async (req) => {
  const password = req.body?.staff_password;
  if (typeof password !== "string" || !password || password.length > 128) {
    throw Object.assign(new Error("Enter your sign-in password."), { status: 400 });
  }
  const actor = await User.findByIdWithHash(req.user.user_id);
  if (!actor || !actor.is_active || !["staff", "admin"].includes(actor.role) ||
      actor.must_change_password || actor.credential_version !== req.user.credential_version) {
    throw Object.assign(new Error("Sign in again before recovering a patient account."), { status: 403 });
  }
  if (!await User.verifyPassword(password, actor.password_hash)) {
    throw Object.assign(new Error("Your password is incorrect."), { status: 403 });
  }
};

/** POST /api/patients/:id/account-recovery/verify-password */
const verifyRecoveryPassword = async (req, res) => {
  res.set("Cache-Control", "no-store");
  const patientId = Number(req.params.id);
  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    return res.status(400).json({ success: false, message: "A valid patient ID is required." });
  }
  try {
    await requireRecoveryPassword(req);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Unable to verify your password. Please try again." });
  }
};

/** POST /api/patients/:id/account-recovery */
const recoverAccount = async (req, res) => {
  res.set("Cache-Control", "no-store");
  const patientId = Number(req.params.id);
  const { expected_credential_version: expectedVersion, confirmed_phone: confirmedPhone } = req.body || {};
  if (!Number.isSafeInteger(patientId) || patientId < 1 ||
      !Number.isSafeInteger(expectedVersion) || expectedVersion < 1 ||
      typeof confirmedPhone !== "string" || !normalizePhilippineMobilePhone(confirmedPhone)) {
    return res.status(400).json({ success: false, message: "Confirm the patient's registered phone number before recovery." });
  }

  let connection;
  try {
    await requireRecoveryPassword(req);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[patient]] = await connection.query(
      "SELECT patient_id, user_id, archived_into_patient_id, first_name, middle_name, last_name, suffix, date_of_birth, barangay, city FROM patients WHERE patient_id = ? FOR UPDATE",
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
      throw Object.assign(new Error("This account has changed. Refresh the patient profile and confirm the registered phone number again."), { status: 409 });
    }
    if (normalizePhilippineMobilePhone(user.phone) !== normalizePhilippineMobilePhone(confirmedPhone)) {
      throw Object.assign(new Error("The registered phone number has changed. Refresh the patient profile before recovery."), { status: 409 });
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
      verification: { phone: true, staff_password: true },
      credential_version: version,
      expires_at: expiresAt,
    }, connection, req);
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

module.exports = { getMyProfile, updateProfile, getPatientById, searchPatients, mergePatient, verifyRecoveryPassword, recoverAccount };
