const pool = require("../config/db");
const { projectQueue, alertState } = require('../utils/queueOrder');

const Queue = {
  lockCategory: async (category, connection) => {
    if (!['dental', 'general'].includes(category)) throw new Error('Invalid queue category.');
    await connection.query(`INSERT INTO queue_sequences (queue_date, category, sequence_type, last_number)
      VALUES (CURDATE(), ?, 'serving', 0) ON DUPLICATE KEY UPDATE last_number = last_number`, [category]);
    await connection.query(`SELECT last_number FROM queue_sequences
      WHERE queue_date = CURDATE() AND category = ? AND sequence_type = 'serving' FOR UPDATE`, [category]);
  },

  projectWaiting: async (category, connection = pool) => {
    const [[lastCalled]] = await connection.query(`SELECT is_walk_in FROM queues
      WHERE category = ? AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY AND status IN ('serving', 'done')
      ORDER BY updated_at DESC, id DESC LIMIT 1 FOR UPDATE`, [category]);
    const [waiting] = await connection.query(`SELECT * FROM queues
      WHERE category = ? AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY AND status = 'waiting' FOR UPDATE`, [category]);
    return projectQueue(waiting, lastCalled);
  },
  // All today's active queues used by staff and doctor dashboards

  _parse: (row) => {
    if (!row) return null;
    try {
      row.services = row.services ? JSON.parse(row.services) : [];
    } catch {
      row.services = [];
    }
    return row;
  },

  _fetchById: async (id, connection = pool) => {
    const [rows] = await connection.query(
      `
      SELECT q.*,
             COALESCE(CONCAT(p.first_name,' ',p.last_name), q.walk_in_name) AS full_name
      FROM   queues q
      LEFT JOIN patients p ON q.patient_id = p.patient_id
      WHERE  q.id = ?
      LIMIT  1
      `,
      [id],
    );
    return Queue._parse(rows[0] || null);
  },

  findTodayActive: async ({ category } = {}) => {
    const params = [];
    let categoryClause = "";
    if (category) {
      categoryClause = "AND q.category = ?";
      params.push(category);
    }
    const [rows] = await pool.query(
      `
      SELECT q.*,
             COALESCE(CONCAT(p.first_name, ' ', p.last_name), q.walk_in_name) AS full_name
      FROM   queues q
      LEFT JOIN patients p ON q.patient_id = p.patient_id
      WHERE  DATE(q.created_at) = CURDATE()
        AND  q.status IN ('waiting', 'serving', 'done')
        ${categoryClause}
      ORDER BY
        FIELD(q.status, 'serving', 'waiting', 'done'),
        FIELD(q.type, 'priority', 'regular'),
        q.created_at ASC
    `,
      params,
    );
    const ordered = [];
    for (const service of ['dental', 'general']) {
      const group = rows.filter(row => row.category === service);
      const called = group.filter(row => ['serving', 'done'].includes(row.status))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at) || b.id - a.id)[0];
      ordered.push(...group.filter(row => row.status === 'serving'),
        ...projectQueue(group.filter(row => row.status === 'waiting'), called),
        ...group.filter(row => row.status === 'done'));
    }
    return ordered.map(Queue._parse);
  },

  // Patient's own active queue for today (dental only — patients cannot join general)
  findByPatientId: async (patient_id, connection = pool) => {
    const [rows] = await connection.query(
      `
      SELECT q.*,
             COALESCE(CONCAT(p.first_name,' ', p.last_name), q.walk_in_name) AS full_name
      FROM   queues q
      LEFT JOIN patients p ON q.patient_id = p.patient_id
      WHERE  q.patient_id = ?
        AND  q.category = 'dental'
        AND  DATE(q.created_at) = CURDATE()
        AND  q.status IN ('waiting', 'serving')
      ORDER  BY q.created_at DESC
      LIMIT  1
    `,
      [patient_id],
    );
    return Queue._parse(rows[0] || null);
  },

  // Insert a new queue entry (supports both patient self-queue and staff walk-in)
  create: async ({
    patient_id,
    is_walk_in,
    queue_number,
    type,
    category,
    services,
    walk_in_name,
    walk_in_dob,
    walk_in_gender,
    walk_in_contact,
  }, connection = pool) => {
    await Queue.lockCategory(category || 'dental', connection);
    const [result] = await connection.query(
      `INSERT INTO queues (patient_id, is_walk_in, queue_number, type, category, services, walk_in_name, walk_in_dob, walk_in_gender, walk_in_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id || null,
        is_walk_in ? 1 : 0,
        queue_number,
        type || "regular",
        category || "dental",
        services ? JSON.stringify(services) : null,
        walk_in_name || null,
        walk_in_dob || null,
        walk_in_gender || null,
        walk_in_contact || null,
      ],
    );
    const [[settings]] = await connection.query('SELECT threshold FROM sms_settings WHERE id = 1 FOR UPDATE');
    const order = await Queue.projectWaiting(category || 'dental', connection);
    const position = order.findIndex(q => q.id === result.insertId) + 1;
    await connection.query(`UPDATE queues SET sms_alert_state = ?, sms_initial_position = ?, sms_initial_threshold = ?
      WHERE id = ?`, [alertState(position, settings.threshold), position, settings.threshold, result.insertId]);
    return Queue._fetchById(result.insertId, connection);
  },

  nextQueueNumber: async ({ category, type }, connection) => {
    const sequenceType = category === "general" ? "general" : type;
    const prefix = category === "general" ? "G" : type === "priority" ? "P" : "Q";

    await connection.query(
      `INSERT INTO queue_sequences (queue_date, category, sequence_type, last_number)
       VALUES (CURDATE(), ?, ?, 1)
       ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
      [category, sequenceType],
    );
    const [[sequence]] = await connection.query(
      `SELECT last_number FROM queue_sequences
       WHERE queue_date = CURDATE() AND category = ? AND sequence_type = ?
       FOR UPDATE`,
      [category, sequenceType],
    );
    return `${prefix}-${String(sequence.last_number).padStart(3, "0")}`;
  },

  callNext: async ({ category = 'dental' } = {}) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await Queue.lockCategory(category, conn);
      const [[serving]] = await conn.query(
        `SELECT id FROM queues
         WHERE status = 'serving' AND DATE(created_at) = CURDATE() AND category = ?
         LIMIT 1 FOR UPDATE`,
        [category],
      );
      if (serving) {
        await conn.rollback();
        return { conflict: true };
      }

      const [next] = await Queue.projectWaiting(category, conn);

      if (!next) {
        await conn.rollback();
        return null;
      }

      await conn.query(
        `UPDATE queues SET status = 'serving', updated_at = NOW() WHERE id = ?`,
        [next.id],
      );
      await conn.commit();

      return Queue._fetchById(next.id, conn);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Update status of any queue entry
  updateStatus: async (id, status, statusReason = null) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[row]] = await conn.query('SELECT category FROM queues WHERE id = ?', [id]);
      if (!row) { await conn.rollback(); return null; }
      await Queue.lockCategory(row.category, conn);
      await conn.query(
        `UPDATE queues SET status = ?, status_reason = ?, updated_at = NOW() WHERE id = ?`,
        [status, statusReason, id],
      );
      await conn.commit();
      return Queue._fetchById(id, conn);
    } catch (err) { await conn.rollback(); throw err; }
    finally { conn.release(); }
  },

  // Public status cards: now-serving and next-waiting queue + names
  getPublicStatus: async ({ category } = {}) => {
    const rows = await Queue.findTodayActive({ category });
    const serving = rows.find((r) => r.status === "serving");
    const waiting = rows.find((r) => r.status === "waiting");
    return {
      now_serving: serving?.queue_number ?? null,
      now_serving_name: serving?.full_name ?? null,
      next_queuing: waiting?.queue_number ?? null,
      next_queuing_name: waiting?.full_name ?? null,
    };
  },

  // Aggregate stats for today used by admin overview
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
