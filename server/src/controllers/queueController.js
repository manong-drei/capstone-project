const Queue = require("../models/Queue");
const Patient = require("../models/Patient");
const generateQueueNumber = require("../utils/generateQueueNumber");

/** GET /api/queue — staff/doctor sees all today's active queues */
const getAll = async (req, res) => {
  try {
    const queues = await Queue.findTodayActive();
    res.json({ success: true, data: queues });
  } catch (err) {
    console.error("getAll queues error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/queue/me — patient sees their own active queue today */
const getMyQueue = async (req, res) => {
  try {
    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    const queue = await Queue.findByPatientId(patient.patient_id);
    res.json({ success: true, data: queue });
  } catch (err) {
    console.error("getMyQueue error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/queue — patient gets a queue number */
const createQueue = async (req, res) => {
  try {
    const patient = await Patient.findByUserId(req.user.user_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }

    const existing = await Queue.findByPatientId(patient.patient_id);
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: "You already have an active queue number.",
        });
    }

    const { type = "regular", services } = req.body;
    const queue_number = await generateQueueNumber(type);
    const queue = await Queue.create({
      patient_id: patient.patient_id,
      queue_number,
      type,
      services,
    });
    res.status(201).json({ success: true, data: queue });
  } catch (err) {
    console.error("createQueue error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/queue/call-next — staff or doctor calls the next patient */
const callNext = async (req, res) => {
  try {
    const next = await Queue.callNext();
    if (!next) {
      return res
        .status(404)
        .json({ success: false, message: "No patients waiting." });
    }
    res.json({ success: true, data: next });
  } catch (err) {
    console.error("callNext error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/queue/:id/status — update a queue entry's status */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["waiting", "serving", "done", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
    }
    const updated = await Queue.updateStatus(req.params.id, status);
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Queue entry not found." });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** PATCH /api/queue/:id/cancel — cancel a queue entry */
const cancelQueue = async (req, res) => {
  try {
    const updated = await Queue.updateStatus(req.params.id, "cancelled");
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Queue entry not found." });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("cancelQueue error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** POST /api/queue/walkin — staff creates a walk-in queue entry for a patient */
const createWalkIn = async (req, res) => {
  try {
    const { patient_id, type = "regular", services } = req.body;
    if (!patient_id) {
      return res
        .status(400)
        .json({ success: false, message: "patient_id is required." });
    }

    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });
    }

    const existing = await Queue.findByPatientId(patient_id);
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Patient already has an active queue number.",
        });
    }

    const queue_number = await generateQueueNumber(type);
    const queue = await Queue.create({
      patient_id,
      queue_number,
      type,
      services,
    });
    res.status(201).json({ success: true, data: queue });
  } catch (err) {
    console.error("createWalkIn error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getAll,
  getMyQueue,
  createQueue,
  callNext,
  updateStatus,
  cancelQueue,
  createWalkIn,
};
