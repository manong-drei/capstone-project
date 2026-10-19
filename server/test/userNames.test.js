const assert = require('node:assert/strict');
const test = require('node:test');
const pool = require('../src/config/db');
const migrate = require('../src/config/migrateUserNames');
const { normalizeSuffix, normalizeMiddleName } = require('../src/utils/name');
const Patient = require('../src/models/Patient');
const Staff = require('../src/models/Staff');
const Doctor = require('../src/models/Doctor');
const Queue = require('../src/models/Queue');
const { createStaff, createPatient, updateStaff } = require('../src/controllers/adminController');
const { updateProfile } = require('../src/controllers/patientController');
const { createWalkIn } = require('../src/controllers/queueController');
const { getProfile } = require('../src/controllers/authController');

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test.after(() => pool.end());

test('name migration adds nullable columns and safely resumes partial application', async () => {
  const columns = {
    patients: ['first_name', 'last_name'],
    staff: ['first_name', 'middle_name', 'last_name'],
    doctors: ['first_name', 'middle_name', 'last_name', 'suffix'],
  };
  const writes = [];
  let snapshotType = 'varchar(255)';
  const connection = {
    async query(sql) {
      if (sql.startsWith('SHOW COLUMNS FROM queues')) return [[{ Field: 'walk_in_name', Type: snapshotType }]];
      if (sql.startsWith('ALTER TABLE queues')) {
        assert.equal(sql, 'ALTER TABLE queues MODIFY COLUMN walk_in_name VARCHAR(323) NULL DEFAULT NULL');
        writes.push(sql);
        snapshotType = 'varchar(323)';
        return [{}];
      }
      const table = sql.match(/(?:FROM|TABLE) (patients|staff|doctors)/)[1];
      if (sql.startsWith('SHOW')) return [columns[table].map(Field => ({ Field }))];
      assert.match(sql, /ADD COLUMN (middle_name VARCHAR\(100\)|suffix VARCHAR\(20\)) NULL DEFAULT NULL AFTER (first_name|last_name)$/);
      writes.push(sql);
      columns[table].push(sql.match(/ADD COLUMN (\w+)/)[1]);
      return [{}];
    },
  };
  await migrate(connection);
  assert.equal(writes.length, 4);
  await migrate(connection);
  assert.equal(writes.length, 4);
  snapshotType = 'varchar(500)';
  await migrate(connection);
  assert.equal(writes.length, 4, 'Existing larger name snapshots must not be shrunk');
  for (const table of Object.values(columns)) {
    assert.ok(table.includes('middle_name'));
    assert.ok(table.includes('suffix'));
  }
});

test('optional name fields trim strings, clear blank values, and reject invalid or oversized input', () => {
  for (const [normalize, limit] of [[normalizeSuffix, 20], [normalizeMiddleName, 100]]) {
    for (const value of [undefined, null, '', '   ']) assert.equal(normalize(value), null);
    assert.equal(normalize('  Santos  '), 'Santos');
    assert.equal(normalize('x'.repeat(limit)), 'x'.repeat(limit));
    for (const value of [10, false, {}, [], ['Jr.'], 'x'.repeat(limit + 1)]) {
      assert.throws(() => normalize(value), { status: 400 });
    }
  }
});

test('all name write endpoints reject invalid optional fields before database access', async t => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(pool, 'query', async () => assert.fail('Invalid names must not query the database'));
  t.mock.method(pool, 'getConnection', async () => assert.fail('Invalid names must not acquire a connection'));
  for (const handler of [createStaff, createPatient, updateStaff, updateProfile, createWalkIn]) {
    for (const body of [{ suffix: {} }, { suffix: 'x'.repeat(21) }, { middle_name: [] }, { middle_name: 'x'.repeat(101) }]) {
      const res = response();
      await handler({ body: {
        first_name: 'Juan', last_name: 'Cruz', password: 'test-password', role: 'staff', position: 'Staff',
        phone: '09123456789', full_name: 'Juan Cruz', date_of_birth: '1990-01-01', gender: 'male',
        contact: '09123456789', address: 'Poblacion', services: ['CONSULTATION'], ...body,
      }, params: { user_id: '7' }, user: { user_id: 7 } }, res);
      assert.equal(res.statusCode, 400, handler.name + JSON.stringify(body));
    }
  }
});

test('authenticated profiles include complete names and separate optional fields for every role', async t => {
  let profile;
  t.mock.method(pool, 'query', async () => [[profile]]);
  for (const role of ['patient', 'doctor', 'staff', 'admin']) {
    const prefix = role === 'admin' ? 'staff' : role;
    profile = {
      user_id: 7, role,
      [prefix + '_first_name']: 'Juan', [prefix + '_middle_name']: 'Santos',
      [prefix + '_last_name']: 'Cruz', [prefix + '_suffix']: 'Jr.',
      ...(role === 'patient' ? { patient_full_name: 'Juan Santos Cruz Jr.' } : {}),
    };
    const res = response();
    await getProfile({ user: { user_id: 7 } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.display_name, 'Juan Santos Cruz Jr.', role);
    assert.equal(res.body.data.middle_name, 'Santos');
    assert.equal(res.body.data.suffix, 'Jr.');
    assert.equal(res.body.data.first_name, 'Juan');
    assert.equal(res.body.data.last_name, 'Cruz');
  }
});

test('staff, doctor, and admin edits can change or clear names while omission preserves them', async t => {
  const writes = [];
  let role;
  t.mock.method(pool, 'query', async () => [[{ user_id: 7, role }]]);
  t.mock.method(pool, 'getConnection', async () => ({
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async query(sql, values) { writes.push({ sql, values }); return [{}]; },
  }));
  for (role of ['staff', 'doctor', 'admin']) {
    for (const [body, expected] of [
      [{ middle_name: '  Santos ', suffix: ' Jr. ', phone: '09123456789' }, ['Santos', 'Jr.']],
      [{ middle_name: '', suffix: '' }, [null, null]],
      [{ middle_name: null, suffix: null }, [null, null]],
      [{ first_name: 'Juan' }, undefined],
    ]) {
      writes.length = 0;
      const res = response();
      await updateStaff({ params: { user_id: '7' }, body }, res);
      assert.equal(res.statusCode, 200, role);
      const write = writes.find(row => row.sql.startsWith(role === 'doctor' ? 'UPDATE doctors' : 'UPDATE staff'));
      assert.ok(write);
      if (expected) {
        const fields = write.sql.match(/SET (.*) WHERE/)[1].split(', ').map(field => field.split(' =')[0]);
        assert.equal(write.values[fields.indexOf('middle_name')], expected[0]);
        assert.equal(write.values[fields.indexOf('suffix')], expected[1]);
        if (body.phone) assert.equal(write.values[fields.indexOf('contact_number')], '09123456789');
      } else {
        assert.doesNotMatch(write.sql, /middle_name|suffix/);
      }
    }
  }
});

test('walk-in registration saves complete names and preserves or clears selected optional fields', async t => {
  const writes = [];
  let created;
  let queue;
  let duplicateValues;
  const existing = { patient_id: 7, first_name: 'Juan', middle_name: 'Santos', last_name: 'Cruz', suffix: 'Jr.', date_of_birth: '1990-01-01', gender: 'Male', contact_number: '09123456789', barangay: 'Poblacion', priority_category: null };
  t.mock.method(pool, 'getConnection', async () => ({
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
    async query(sql, values) {
      if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.includes('SELECT * FROM patients')) return [[existing]];
      if (sql.includes('FROM patients p LEFT JOIN users')) { duplicateValues = values; return [[]]; }
      if (sql.startsWith('UPDATE patients')) writes.push(values);
      return [[]];
    },
  }));
  t.mock.method(Patient, 'audit', async () => {});
  t.mock.method(Patient, 'createWalkIn', async input => { created = input; return 42; });
  t.mock.method(Queue, 'lockCategory', async () => {});
  t.mock.method(Queue, 'nextQueueNumber', async () => 'G-001');
  t.mock.method(Queue, 'create', async input => { queue = input; return { id: 1, ...input }; });
  const body = { full_name: 'Juan Cruz', date_of_birth: '1990-01-01', gender: 'male', contact: '09123456789', address: 'Poblacion', category: 'general' };
  for (const [fields, expectedName] of [
    [{ middle_name: ' Santos ', suffix: ' Jr. ' }, 'Juan Santos Cruz Jr.'],
    [{ patient_id: 7, full_name: 'John Cruz' }, 'John Santos Cruz Jr.'],
    [{ patient_id: 7, middle_name: '', suffix: '' }, 'Juan Cruz'],
  ]) {
    const res = response();
    await createWalkIn({ body: { ...body, ...fields }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(queue.walk_in_name, expectedName);
  }
  assert.equal(created.middle_name, 'Santos');
  assert.equal(created.suffix, 'Jr.');
  assert.equal(duplicateValues[1], 'Juan Santos Cruz Jr.');
  assert.equal(writes[0][1], 'Santos');
  assert.equal(writes[0][3], 'Jr.');
  assert.equal(writes[1][1], null);
  assert.equal(writes[1][3], null);
});

test('MySQL persists optional names, searches complete and legacy names, and displays queue names', { skip: process.env.USER_NAMES_DB_TESTS !== 'true' }, async t => {
  const connection = await pool.getConnection();
  const tables = ['patients', 'staff', 'doctors', 'users', 'queues'];
  try {
    // Temporary copies keep all writes isolated from application records.
    for (const table of tables) {
      await connection.query(`CREATE TEMPORARY TABLE user_name_fixture LIKE ${table}`);
      await connection.query(`CREATE TEMPORARY TABLE ${table} LIKE user_name_fixture`);
      await connection.query('DROP TEMPORARY TABLE user_name_fixture');
    }
    t.mock.method(pool, 'query', connection.query.bind(connection));
    const name = { first_name: 'Juan', middle_name: ' Santos ', last_name: 'Cruz', suffix: ' Jr. ' };
    const patientId = await Patient.create({ ...name, user_id: 9001, date_of_birth: '1990-01-01', gender: 'Male', address: 'Poblacion', phone: '09123456789' });
    const walkInId = await Patient.createWalkIn({ first_name: 'Ana', last_name: 'Test', date_of_birth: '1990-01-01', gender: 'Female', barangay: 'Poblacion', contact_number: '09987654321' }, connection);
    await Staff.create({ ...name, user_id: 9002, position: 'Staff' });
    await Doctor.create({ ...name, user_id: 9003, license_number: 'TEST-NAMES' });
    for (const table of ['patients', 'staff', 'doctors']) {
      const [[row]] = await connection.query(`SELECT middle_name, suffix FROM ${table} WHERE first_name = 'Juan'`);
      assert.deepEqual(row, { middle_name: 'Santos', suffix: 'Jr.' }, table);
    }
    const walkIn = await Patient.findById(walkInId);
    assert.equal(walkIn.middle_name, null);
    assert.equal(walkIn.suffix, null);
    for (const name of ['Juan Santos Cruz Jr.', 'Juan Cruz Jr.', 'Juan Cruz', 'Santos', 'Jr.']) {
      assert.deepEqual((await Patient.search({ name }, connection)).map(row => row.patient_id), [patientId], name);
    }
    await connection.query("INSERT INTO queues (patient_id, queue_number, category, walk_in_name) VALUES (?, 'TEST-NAMES', 'dental', 'Legacy Name')", [patientId]);
    const [[{ id }]] = await connection.query("SELECT id FROM queues WHERE queue_number = 'TEST-NAMES'");
    assert.equal((await Queue._fetchById(id, connection)).full_name, 'Juan Santos Cruz Jr.');
    await Patient.updateByUserId(9001, { first_name: 'John' });
    let patient = await Patient.findByUserId(9001);
    assert.equal(patient.middle_name, 'Santos');
    assert.equal(patient.suffix, 'Jr.');
    await Patient.updateByUserId(9001, { middle_name: '', suffix: '' });
    patient = await Patient.findByUserId(9001);
    assert.equal(patient.middle_name, null);
    assert.equal(patient.suffix, null);
    assert.equal((await Queue._fetchById(id, connection)).full_name, 'John Cruz');
    const longName = ['A'.repeat(100), 'B'.repeat(100), 'C'.repeat(100), 'D'.repeat(20)].join(' ');
    await connection.query("UPDATE queues SET patient_id = 4294967290, walk_in_name = ? WHERE id = ?", [longName, id]);
    assert.equal((await Queue._fetchById(id, connection)).full_name, longName);
  } finally {
    t.mock.restoreAll();
    for (const table of [...tables, 'user_name_fixture']) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    connection.release();
  }
});
