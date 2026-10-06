require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const pool = require("./db");
const Patient = require("../models/Patient");
const { normalizePhilippineMobilePhone } = require("../utils/phone");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "../../migrations/003_walkin_patients.sql"), "utf8")
    .replace(/^--.*$/gm, "");
  for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) await pool.query(statement);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [legacy] = await connection.query(
      "SELECT id, walk_in_name, walk_in_dob, walk_in_gender, walk_in_contact FROM queues WHERE patient_id IS NULL ORDER BY id FOR UPDATE",
    );
    const created = new Map();
    for (const queue of legacy) {
      const name = String(queue.walk_in_name || "Unknown Patient").trim().replace(/\s+/g, " ");
      const [first_name, ...rest] = name.split(" ");
      const last_name = rest.join(" ") || "Patient";
      const date_of_birth = queue.walk_in_dob || null;
      const gender = queue.walk_in_gender || "Other";
      const contact_number = normalizePhilippineMobilePhone(queue.walk_in_contact);
      const key = queue.walk_in_name && date_of_birth && contact_number
        ? JSON.stringify([name.toLowerCase(), date_of_birth, contact_number])
        : `queue:${queue.id}`;
      let patientId = created.get(key);
      if (!patientId) {
        patientId = await Patient.createWalkIn({ first_name, last_name, date_of_birth, gender, contact_number, barangay: "Unknown" }, connection);
        await Patient.audit(patientId, null, "migration", { legacy_queue_id: queue.id }, connection);
        created.set(key, patientId);
      }
      await connection.query("UPDATE queues SET patient_id = ?, is_walk_in = 1 WHERE id = ?", [patientId, queue.id]);
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
  await pool.query("ALTER TABLE queues DROP FOREIGN KEY fk_queue_patient");
  await pool.query("ALTER TABLE queues MODIFY patient_id INT UNSIGNED NOT NULL");
  await pool.query("ALTER TABLE queues ADD CONSTRAINT fk_queue_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT");
  console.log("Walk-in patient migration complete.");
}

migrate().catch((err) => { console.error("Migration failed:", err); process.exitCode = 1; })
  .finally(() => pool.end());
