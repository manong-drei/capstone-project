const pool = require("../config/db");
const Queue = require("../models/Queue");
const Appointment = require("../models/Appointment");

/** GET /api/admin/overview — live stats for the admin dashboard */
const getOverview = async (req, res) => {
  try {
    const [[patientRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM patients",
    );
    const [[doctorRow]] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM   doctors d
      JOIN   users u ON d.user_id = u.user_id
      WHERE  u.is_active = 1
    `);

    const queueStats = await Queue.getTodayStats();
    const appointmentCount = await Appointment.countToday();

    res.json({
      success: true,
      totalPatients: patientRow.count,
      activeQueues: queueStats.activeQueues ?? 0,
      doneToday: queueStats.doneToday ?? 0,
      priorityServed: queueStats.priorityServed ?? 0,
      doctorsOnDuty: doctorRow.count,
      appointments: appointmentCount,
    });
  } catch (err) {
    console.error("getOverview error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getOverview };
