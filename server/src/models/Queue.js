const pool = require("../config/db");
const { projectQueue, alertState } = require('../utils/queueOrder');
const conflict = message => Object.assign(new Error(message), { status: 409 });
const NO_SHOW_EXPIRED = 'No-show — did not return within 10 minutes';

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
      WHERE category = ? AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY AND last_called_at IS NOT NULL
      ORDER BY last_called_at DESC, id DESC LIMIT 1 FOR UPDATE`, [category]);
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
        AND (q.status IN ('waiting', 'called', 'serving', 'missed', 'done', 'no_show')
             OR (q.status = 'cancelled' AND q.last_called_at IS NOT NULL))
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
      const called = group.filter(row => row.last_called_at)
        .sort((a, b) => new Date(b.last_called_at) - new Date(a.last_called_at) || b.id - a.id)[0];
      ordered.push(...group.filter(row => ['called', 'serving'].includes(row.status)),
        ...projectQueue(group.filter(row => row.status === 'waiting'), called),
        ...group.filter(row => ['missed', 'done', 'no_show'].includes(row.status)));
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
        AND  q.status IN ('waiting', 'called', 'serving', 'missed')
      ORDER  BY q.created_at DESC
      LIMIT  1
    `,
      [patient_id],
    );
    return Queue._parse(rows[0] || null);
  },

  findLatestNoShow: async (patient_id) => {
    const [[row]] = await pool.query(`SELECT id, status FROM queues
      WHERE patient_id = ? AND category = 'dental' AND DATE(created_at) = CURDATE()
      ORDER BY created_at DESC, id DESC LIMIT 1`, [patient_id]);
    return row?.status === 'no_show' ? Queue._fetchById(row.id) : null;
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

  nextQueueNumber: async ({ category, type, is_walk_in = false }, connection) => {
    const sequenceType = category === "general" ? "general" : type;
    const prefix = type === "priority" ? "P" : "Q";

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
    return category === "general"
      ? `G-${String(sequence.last_number).padStart(3, "0")}`
      : `${is_walk_in ? "" : "A"}${prefix}${String(sequence.last_number).padStart(2, "0")}`;
  },

  _callNext: async (category, conn) => {
    const [[occupied]] = await conn.query(`SELECT id FROM queues
      WHERE status IN ('called', 'serving') AND DATE(created_at) = CURDATE() AND category = ?
      LIMIT 1 FOR UPDATE`, [category]);
    if (occupied) return { conflict: true };
    const [next] = await Queue.projectWaiting(category, conn);
    if (!next) return null;
    await conn.query(`UPDATE queues SET status = 'called', call_count = 1,
      last_called_at = NOW(3), status_reason = NULL, updated_at = NOW() WHERE id = ?`, [next.id]);
    return Queue._fetchById(next.id, conn);
  },

  callNext: async ({ category = 'dental' } = {}) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await Queue.lockCategory(category, conn);
      const next = await Queue._callNext(category, conn);
      await conn.commit();
      return next;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // All ticket mutations take the category lock before locking the ticket.
  _withTicket: async (id, change) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[row]] = await conn.query('SELECT category FROM queues WHERE id = ?', [id]);
      if (!row) { await conn.rollback(); return null; }
      await Queue.lockCategory(row.category, conn);
      const [[ticket]] = await conn.query(`SELECT *,
        TIMESTAMPDIFF(MICROSECOND, last_called_at, NOW(3)) >= 30000000 AS call_ready,
        grace_expires_at <= NOW(3) AS expired, DATE(created_at) = CURDATE() AS is_today
        FROM queues WHERE id = ? FOR UPDATE`, [id]);
      if (ticket.status === 'missed' && ticket.expired) {
        await conn.query(`UPDATE queues SET status = 'no_show', status_reason = ?, updated_at = NOW() WHERE id = ?`, [NO_SHOW_EXPIRED, id]);
        await conn.commit();
        return { expired: true };
      }
      if (!ticket.is_today) throw conflict('This ticket is not for today.');
      const result = await change(ticket, conn);
      await conn.commit();
      return result;
    } catch (err) { await conn.rollback(); throw err; }
    finally { conn.release(); }
  },

  updateStatus: (id, status, statusReason = null, { patientOnly = false } = {}) => Queue._withTicket(id, async (ticket, conn) => {
      const allowed = status === 'serving' ? ticket.status === 'called' && !patientOnly
        : status === 'done' ? ticket.status === 'serving' && !patientOnly
        : status === 'cancelled' && (patientOnly ? ['waiting', 'missed'] : ['waiting', 'called', 'serving', 'missed']).includes(ticket.status);
      if (!allowed) throw conflict('This queue status change is not allowed.');
      if (status === 'cancelled' && !String(statusReason || '').trim()) throw conflict('A cancellation reason is required.');
      await conn.query(
        `UPDATE queues SET status = ?, status_reason = ?, updated_at = NOW() WHERE id = ?`,
        [status, statusReason, id],
      );
      return Queue._fetchById(id, conn);
  }),

  recall: id => Queue._withTicket(id, async (ticket, conn) => {
    if (ticket.status !== 'called' || ticket.call_count !== 1 || !ticket.call_ready) {
      throw conflict('Call again is available 30 seconds after the first call.');
    }
    await conn.query(`UPDATE queues SET call_count = 2, last_called_at = NOW(3), updated_at = NOW() WHERE id = ?`, [id]);
    return Queue._fetchById(id, conn);
  }),

  skip: id => Queue._withTicket(id, async (ticket, conn) => {
    if (ticket.status !== 'called' || ticket.call_count < 2 || !ticket.call_ready) {
      throw conflict('Call the patient twice and wait 30 seconds after the second call before skipping.');
    }
    if (ticket.returned_at) {
      await conn.query(`UPDATE queues SET status = 'no_show', status_reason = ?, updated_at = NOW() WHERE id = ?`,
        ['No-show — missed the second turn after returning', id]);
    } else {
      await conn.query(`UPDATE queues SET status = 'missed', missed_at = NOW(3),
        grace_expires_at = DATE_ADD(NOW(3), INTERVAL 10 MINUTE), status_reason = ?, updated_at = NOW() WHERE id = ?`,
        ['Patient did not respond to two calls', id]);
    }
    const next = await Queue._callNext(ticket.category, conn);
    if (next?.conflict) throw conflict('Another patient is already called or serving.');
    return { queue: await Queue._fetchById(id, conn), next_queue: next };
  }),

  returnPatient: id => Queue._withTicket(id, async (ticket, conn) => {
    if (ticket.status !== 'missed') throw conflict('Only a missed ticket can return to the queue.');
    await conn.query(`UPDATE queues SET status = 'waiting', returned_at = NOW(3),
      status_reason = NULL, updated_at = NOW() WHERE id = ?`, [id]);
    return Queue._fetchById(id, conn);
  }),

  expireMissed: async () => {
    for (const category of ['dental', 'general']) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await Queue.lockCategory(category, conn);
        await conn.query(`UPDATE queues SET status = 'no_show', status_reason = ?, updated_at = NOW()
          WHERE category = ? AND status = 'missed' AND grace_expires_at <= NOW(3)`, [NO_SHOW_EXPIRED, category]);
        await conn.commit();
      } catch (err) { await conn.rollback(); throw err; }
      finally { conn.release(); }
    }
  },

  // Public status cards: now-serving and next-waiting queue + names
  getPublicStatus: async ({ category } = {}) => {
    const rows = await Queue.findTodayActive({ category });
    const serving = rows.find((r) => ['called', 'serving'].includes(r.status));
    const waiting = rows.find((r) => r.status === "waiting");
    return {
      now_serving: serving?.queue_number ?? null,
      now_serving_name: serving?.full_name ?? null,
      current_status: serving?.status ?? null,
      next_queuing: waiting?.queue_number ?? null,
      next_queuing_name: waiting?.full_name ?? null,
    };
  },

  // Aggregate stats for today used by admin overview
  getTodayStats: async () => {
    const [rows] = await pool.query(`
      SELECT
        SUM(status IN ('waiting', 'called', 'serving', 'missed')) AS activeQueues,
        SUM(status = 'done')                        AS doneToday,
        SUM(type = 'priority' AND status = 'done')  AS priorityServed
      FROM queues
      WHERE DATE(created_at) = CURDATE()
    `);
    return rows[0];
  },
};

module.exports = Queue;
