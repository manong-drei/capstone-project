const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, data: [] });
});

router.get("/me", (req, res) => {
  res.json({ success: true, data: null });
});

module.exports = router;
