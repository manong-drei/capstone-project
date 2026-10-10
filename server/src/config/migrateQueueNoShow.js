const pool = require("./db");

async function migrate() {
  try {
    await pool.query(`ALTER TABLE queues
      MODIFY COLUMN status ENUM('waiting', 'called', 'serving', 'missed', 'done', 'cancelled', 'no_show') NULL DEFAULT 'waiting'`);
    const [result] = await pool.query(
      `UPDATE queues SET status = 'no_show'
       WHERE status = '' AND status_reason = ?`,
      ["No-show — patient not present when called"],
    );
    console.log(`Queue no-show status enabled; repaired ${result.affectedRows} ticket(s).`);
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Queue no-show migration failed:", err.message);
  process.exitCode = 1;
});
