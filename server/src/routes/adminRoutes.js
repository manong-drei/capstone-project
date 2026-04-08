const express = require("express");
const router = express.Router();

router.get("/overview", (req, res) => {
  res.json({
    success: true,
    data: { totalPatients: 0, todayAppointments: 0, activeQueues: 0 },
  });
});

router.get("/staff", (req, res) => {
  res.json({ success: true, data: [] });
});

router.get("/reports", (req, res) => {
  res.json({ success: true, data: [] });
});

module.exports = router;
