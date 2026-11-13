const Doctor = require('../models/Doctor');
const DoctorLeave = require('../models/DoctorLeave');
const { clinicToday, validDate } = require('../utils/clinicDate');

const validId = value => typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
const validNote = value => value === undefined || (typeof value === 'string' && value.trim().length <= 500);
const sendError = (res, err) => {
  if (!err.status) console.error('Doctor leave error:', err);
  res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Unable to update or load leave requests. Please try again.' });
};
const profile = async req => {
  const doctor = await Doctor.findByUserId(req.user.user_id);
  if (!doctor) throw Object.assign(new Error('Dentist profile not found.'), { status: 404 });
  return doctor;
};

exports.listOwn = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const doctor = await profile(req);
    res.json({ success: true, requests: await DoctorLeave.list(doctor.doctor_id) });
  } catch (err) { sendError(res, err); }
};

exports.requestLeave = async (req, res) => {
  const { start_date: start, end_date: end, reason } = req.body ?? {};
  if (!validDate(start) || !validDate(end) || start < clinicToday() || end < start || !validNote(reason) || typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Choose a valid start date of today or later, an end date on or after it, and a reason of at most 500 characters.' });
  }
  try {
    const doctor = await profile(req);
    const id = await DoctorLeave.request(doctor.doctor_id, start, end, reason?.trim());
    res.status(201).json({ success: true, id, message: 'Leave request submitted for admin approval. Availability is unchanged until approval.' });
  } catch (err) { sendError(res, err); }
};

exports.withdraw = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid leave request ID is required.' });
  try {
    const doctor = await profile(req);
    const result = await DoctorLeave.decide(Number(req.params.id), 'cancelled', '', req, { doctorId: doctor.doctor_id });
    res.json({ success: true, ...result });
  } catch (err) { sendError(res, err); }
};

exports.listAll = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try { res.json({ success: true, requests: await DoctorLeave.list() }); }
  catch (err) { sendError(res, err); }
};

exports.reviewDetails = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'A valid leave request ID is required.' });
  try { res.json({ success: true, ...await DoctorLeave.reviewDetails(Number(req.params.id)) }); }
  catch (err) { sendError(res, err); }
};

exports.decide = async (req, res) => {
  const { status, review_note: note, acknowledge_conflicts: acknowledge, impact_version: version } = req.body ?? {};
  if (!validId(req.params.id) || !['approved', 'rejected', 'cancelled'].includes(status) || !validNote(note) ||
    (acknowledge !== undefined && typeof acknowledge !== 'boolean')) {
    return res.status(400).json({ success: false, message: 'A valid request, decision and review note of at most 500 characters are required.' });
  }
  try {
    const result = await DoctorLeave.decide(Number(req.params.id), status, note?.trim(), req, { acknowledge, version });
    res.json({ success: true, ...result });
  } catch (err) { sendError(res, err); }
};
