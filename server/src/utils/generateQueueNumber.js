const db = require("../config/db");

async function generateQueueNumber(type = "regular") {
  const prefix = type === "priority" ? "PRIO" : "GEN";
  const today = new Date().toISOString().slice(0, 10);

  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM queues
     WHERE type = ? AND DATE(created_at) = ?`,
    [type, today],
  );

  const seq = String(rows[0].count + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
}

module.exports = generateQueueNumber;
