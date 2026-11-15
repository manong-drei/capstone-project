const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const Queue = require('../src/models/Queue');
const Appointment = require('../src/models/Appointment');
const DoctorHistory = require('../src/models/DoctorHistory');
const migrate = require('../src/config/migrateQueueHolds');

test.after(() => pool.end());

test('MySQL held lifecycle survives midnight, orders simultaneous confirmations, numbers H returns, and expires safely', { skip: process.env.QUEUE_DB_TESTS !== 'true' }, async t => {
  const connection = await pool.getConnection();
  const saved = { query: pool.query, getConnection: pool.getConnection, end: pool.end };
  try {
    for (const table of ['queues', 'queue_sequences']) {
      await connection.query(`CREATE TEMPORARY TABLE hold_fixture LIKE ${table}`);
      await connection.query(`CREATE TEMPORARY TABLE ${table} LIKE hold_fixture`);
      await connection.query('DROP TEMPORARY TABLE hold_fixture');
    }
    await connection.query('CREATE TEMPORARY TABLE patients (patient_id INT PRIMARY KEY, first_name VARCHAR(40), last_name VARCHAR(40), middle_name VARCHAR(40), suffix VARCHAR(10))');
    await connection.query('CREATE TEMPORARY TABLE appointments (appointment_id INT PRIMARY KEY, patient_id INT, doctor_id INT, appointment_date DATE, appointment_time TIME, reason VARCHAR(100), status VARCHAR(20), created_at DATETIME, updated_at DATETIME)');
    await connection.query('CREATE TEMPORARY TABLE doctors (doctor_id INT PRIMARY KEY, specialization_id INT, first_name VARCHAR(40), middle_name VARCHAR(40), last_name VARCHAR(40), suffix VARCHAR(10))');
    await connection.query('CREATE TEMPORARY TABLE specializations (specialization_id INT PRIMARY KEY, specialization_name VARCHAR(40))');
    await connection.query('CREATE TEMPORARY TABLE consultations (consultation_id INT PRIMARY KEY, queue_id INT, patient_id INT, doctor_id INT, diagnosis VARCHAR(100))');
    await connection.query('CREATE TEMPORARY TABLE prescriptions (consultation_id INT, medication_name VARCHAR(100))');
    await connection.query('CREATE TEMPORARY TABLE sms_jobs (id INT PRIMARY KEY, state VARCHAR(20), provider_status VARCHAR(20), deduplication_key VARCHAR(80), purpose VARCHAR(20))');
    pool.query = connection.query.bind(connection);
    pool.getConnection = async () => ({ query: connection.query.bind(connection), beginTransaction: connection.beginTransaction.bind(connection),
      commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {} });
    pool.end = async () => {};
    t.mock.method(console, 'log', () => {});
    await migrate();
    await migrate();
    const start = Date.parse('2026-10-10T23:59:00+08:00');
    await connection.query('SET timestamp = ?', [start / 1000]);
    await connection.query("INSERT INTO patients (patient_id, first_name) VALUES (9001, 'Held One'), (9002, 'Held Two'), (9003, 'Today')");
    await connection.query("INSERT INTO doctors (doctor_id, first_name) VALUES (9, 'Test Dentist')");
    await connection.query("INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (901, 9001, 9, CURDATE(), CURTIME(), 'confirmed'), (902, 9001, 9, CURDATE(), CURTIME(), 'confirmed')");
    await connection.query(`INSERT INTO queues (id, patient_id, appointment_id, queue_number, type, category, services, created_at)
      VALUES (9001, 9001, 901, 'AQ01', 'regular', 'dental', '[]', NOW()),
             (9002, 9002, NULL, 'P01', 'priority', 'dental', '[]', NOW())`);
    assert.equal((await Queue.holdRemaining()).held_count, 2);
    assert.equal((await Queue.findByPatientId(9001)).status, 'held');
    await connection.query('SET timestamp = ?', [(start + 120_000) / 1000]);
    assert.equal((await Queue.findByPatientId(9001)).status, 'held');
    await connection.query(`INSERT INTO queues (id, patient_id, queue_number, type, category, services, created_at)
      VALUES (9003, 9003, 'AQ01', 'priority', 'dental', '[]', NOW())`);
    const first = await Queue.reactivate(9002);
    const second = await Queue.reactivate(9001);
    assert.deepEqual([first.queue_number, second.queue_number], ['H01', 'H02']);
    assert.equal(second.original_queue_number, 'AQ01');
    assert.equal(second.appointment_id, 901);
    const history = (await Appointment.findByPatientId(9001)).find(visit => visit.appointment_id === 901);
    assert.equal(history.queue_number, 'H02');
    assert.equal(history.original_queue_number, 'AQ01');
    assert.equal(history.queue_status, 'waiting');
    assert.equal((await Appointment.findAll({ includeWalkIns: true })).find(visit => visit.appointment_id === 901).original_queue_number, 'AQ01');
    assert.equal((await DoctorHistory.findVisits(9, 9001)).find(visit => visit.visit_id === 'queue-9001').original_queue_number, 'AQ01');
    assert.equal((await Queue.findByPatientId(9001)).id, 9001);
    assert.deepEqual((await Queue.findTodayActive({ category: 'dental' })).filter(q => q.status === 'waiting').map(q => q.id), [9002, 9001, 9003]);
    assert.equal((await Queue.callNext()).id, 9002);
    assert.deepEqual(await Queue.callNext(), { conflict: true });
    await Queue.updateStatus(9002, 'serving');
    await Queue.updateStatus(9002, 'done');
    assert.equal((await Queue.callNext()).id, 9001);
    await Queue.updateStatus(9001, 'serving');
    await Queue.updateStatus(9001, 'done');
    const [appointments] = await connection.query('SELECT status FROM appointments ORDER BY appointment_id');
    assert.deepEqual(appointments.map(row => row.status), ['completed', 'confirmed']);
    await Queue.hold(9003);
    await connection.query('UPDATE queues SET held_expires_at = NOW(3) WHERE id = 9003');
    assert.deepEqual(await Queue.reactivate(9003), { expired: true, held: true });
    assert.equal((await Queue._fetchById(9003)).status, 'expired');
    assert.equal((await Queue.findLatestNoShow(9003)).status, 'expired');
    assert.equal((await connection.query('SELECT COUNT(*) AS total FROM queues'))[0][0].total, 3);
  } finally {
    Object.assign(pool, saved);
    connection.destroy();
  }
});
