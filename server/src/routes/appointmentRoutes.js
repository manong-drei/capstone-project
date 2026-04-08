const express = require("express");
const router = express.Router();

router.get("/me", (req, res) => {
  res.json({ success: true, data: [] });
});

module.exports = router;
