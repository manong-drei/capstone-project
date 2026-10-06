const Patient = require("../models/Patient");
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
    res.status(200).json({ success: true, data: { ...patient, visits } });
  } catch (err) {
    console.error("getPatientById error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const searchPatients = async (req, res) => {
  try {
    const name = String(req.query.name || "").trim().replace(/\s+/g, " ").slice(0, 100);
    const phone = req.query.phone ? normalizePhilippineMobilePhone(req.query.phone) : null;
    const date_of_birth = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date_of_birth || "") ? req.query.date_of_birth : null;
    if ((req.query.phone && !phone) || (!phone && name.length < 2 && !date_of_birth)) {
      return res.status(400).json({ success: false, message: "Enter a name, date of birth, or valid mobile number." });
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
       AND DATE(created_at) = CURDATE() AND status IN ('waiting', 'serving')`,
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

module.exports = { getMyProfile, updateProfile, getPatientById, searchPatients, mergePatient };
