const pool = require("../config/db");

const Queue = {
  // All today's active queues — used by staff and doctor dashboards
  findTodayActive: async () => {
    const [rows] = await pool.query(`
      SELECT q.*, p.first_name, p.last_name
      FROM   queues q
      JOIN   patients p ON q.patient_id = p.patient_id
      WHERE  DATE(q.created_at) = CURDATE()
        AND  q.status IN ('waiting', 'serving')
      ORDER BY
        FIELD(q.type, 'priority', 'regular'),
        q.created_at ASC
    `);
    return rows;
  },

  // Patient's own active queue for today
  findByPatientId: async (patient_id) => {
    const [rows] = await pool.query(
      `
      SELECT * FROM queues
      WHERE  patient_id = ?
        AND  DATE(created_at) = CURDATE()
        AND  status NOT IN ('done', 'cancelled')
      ORDER  BY created_at DESC
      LIMIT  1
    `,
      [patient_id],
    );
    return rows[0] || null;
  },

  // Insert a new queue entry
  create: async ({ patient_id, queue_number, type, services }) => {
    const [result] = await pool.query(
      `INSERT INTO queues (patient_id, queue_number, type, services)
       VALUES (?, ?, ?, ?)`,
      [
        patient_id,
        queue_number,
        type || "regular",
        services ? JSON.stringify(services) : null,
      ],
    );
    const [rows] = await pool.query("SELECT * FROM queues WHERE id = ?", [
      result.insertId,
    ]);
    return rows[0];
  },

  // Pull the next waiting patient (priority first), set to serving atomically
  callNext: async () => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(`
        SELECT * FROM queues
        WHERE  status = 'waiting'
          AND  DATE(created_at) = CURDATE()
        ORDER BY
          FIELD(type, 'priority', 'regular'),
          created_at ASC
        LIMIT 1
        FOR UPDATE
      `);

      if (!rows[0]) {
        await conn.rollback();
        return null;
      }

      const next = rows[0];
      await conn.query(
        `UPDATE queues SET status = 'serving', updated_at = NOW() WHERE id = ?`,
        [next.id],
      );
      await conn.commit();

      const [updated] = await conn.query("SELECT * FROM queues WHERE id = ?", [
        next.id,
      ]);
      return updated[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Update status of any queue entry
  updateStatus: async (id, status) => {
    await pool.query(
      `UPDATE queues SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id],
    );
    const [rows] = await pool.query("SELECT * FROM queues WHERE id = ?", [id]);
    return rows[0] || null;
  },

  // Aggregate stats for today — used by admin overview
  getTodayStats: async () => {
    const [rows] = await pool.query(`
      SELECT
        SUM(status IN ('waiting', 'serving'))       AS activeQueues,
        SUM(status = 'done')                        AS doneToday,
        SUM(type = 'priority' AND status = 'done')  AS priorityServed
      FROM queues
      WHERE DATE(created_at) = CURDATE()
    `);
    return rows[0];
  },
};

module.exports = Queue;
