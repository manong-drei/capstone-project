require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function migrate() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "../../migrations/001_queue_sequences.sql"),
      "utf8",
    );
    await pool.query(sql);
    console.log("queue_sequences migration applied.");
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
});
