const pool = require("../config/db");

const Queue = {
  // All today's active queues — used by staff and doctor dashboards

  _parse: (row) => {
    if (!row) return null;
    try {
      row.services = row.services ? JSON.parse(row.services) : [];
    } catch {
      row.services = [];
    }
    return row;
  },
  findTodayActive: async () => {
    const [rows] = await pool.query(`
      SELECT q.*,
             COALESCE(p.full_name, q.walk_in_name) AS full_name
      FROM   queues q
      LEFT JOIN patients p ON q.patient_id = p.patient_id
      WHERE  DATE(q.created_at) = CURDATE()
        AND  q.status IN ('waiting', 'serving', 'done')
      ORDER BY
        FIELD(q.status, 'serving', 'waiting', 'done'),
        FIELD(q.type, 'priority', 'regular'),
        q.created_at ASC
    `);
    return rows.map(Queue._parse);
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
    return Queue._parse(rows[0] || null);
  },

  // Insert a new queue entry (supports both patient self-queue and staff walk-in)
  create: async ({
    patient_id,
    queue_number,
    type,
    services,
    walk_in_name,
    walk_in_age,
    walk_in_gender,
    walk_in_contact,
  }) => {
    const [result] = await pool.query(
      `INSERT INTO queues (patient_id, queue_number, type, services, walk_in_name, walk_in_age, walk_in_gender, walk_in_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id || null,
        queue_number,
        type || "regular",
        services ? JSON.stringify(services) : null,
        walk_in_name || null,
        walk_in_age || null,
        walk_in_gender || null,
        walk_in_contact || null,
      ],
    );
    const [rows] = await pool.query("SELECT * FROM queues WHERE id = ?", [
      result.insertId,
    ]);
    return Queue._parse(rows[0]);
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
      return Queue._parse(updated[0]);
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
    return Queue._parse(rows[0] || null);
  },

  // Minimal public status: now-serving and next-waiting queue numbers only
  getPublicStatus: async () => {
    const [rows] = await pool.query(`
      SELECT queue_number, status
      FROM   queues
      WHERE  DATE(created_at) = CURDATE()
        AND  status IN ('serving', 'waiting')
      ORDER BY
        FIELD(status, 'serving', 'waiting'),
        FIELD(type, 'priority', 'regular'),
        created_at ASC
      LIMIT 2
    `);
    const serving = rows.find((r) => r.status === 'serving');
    const waiting = rows.find((r) => r.status === 'waiting');
    return {
      now_serving: serving?.queue_number ?? null,
      next_queuing: waiting?.queue_number ?? null,
    };
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
