const fs = require("node:fs");
const path = require("node:path");
const pool = require("./db");

pool.query(fs.readFileSync(path.join(__dirname, "../../migrations/004_doctor_daily_reports.sql"), "utf8"))
  .then(() => console.log("doctor_daily_reports migration applied."))
  .catch((err) => { console.error("Migration failed:", err.message); process.exitCode = 1; })
  .finally(() => pool.end());
