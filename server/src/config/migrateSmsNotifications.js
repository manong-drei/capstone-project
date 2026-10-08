require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const pool = require("./db");
async function migrate() {
  try {
    const [[existing]] = await pool.query(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'credential_version'`,
    );
    if (existing.count)
      throw new Error(
        "SMS migration already started or applied; inspect the schema before continuing.",
      );
    const sql = fs.readFileSync(
      path.join(__dirname, "../../migrations/005_sms_notifications.sql"),
      "utf8",
    );
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean))
      await pool.query(statement);
    console.log(
      "SMS schema installed. Legacy temporary passwords expired; queue initialization runs when the worker starts.",
    );
  } finally {
    await pool.end();
  }
}
migrate().catch(() => {
  console.error(
    "SMS migration failed. Inspect schema before retrying (MySQL DDL is not transactional).",
  );
  process.exitCode = 1;
});
