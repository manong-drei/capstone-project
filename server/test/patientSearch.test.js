const assert = require('node:assert/strict');
const test = require('node:test');
const pool = require('../src/config/db');
const Patient = require('../src/models/Patient');
const { searchPatients } = require('../src/controllers/patientController');

test.after(() => pool.end());

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('phone lookup accepts four-digit fragments and full formats while masking and auditing matches', async t => {
  const searches = [];
  const audits = [];
  t.mock.method(Patient, 'search', async input => {
    searches.push(input);
    return [{ patient_id: 12, first_name: 'Ana', contact_number: '09123456789' }];
  });
  t.mock.method(Patient, 'audit', async (...args) => audits.push(args));
  for (const [input, expected] of [
    ['4567', '4567'], ['6789', '6789'], ['0912', '0912'], ['456-7', '4567'],
    ['9123456789', '9123456789'], ['09123456789', '09123456789'],
    ['+63 912 345 6789', '09123456789'], ['639123456789', '09123456789'],
  ]) {
    const res = response();
    await searchPatients({ query: { phone: input }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 200, input);
    assert.equal(searches.at(-1).phone, expected);
    assert.equal(res.body.data[0].masked_contact, '•••••••6789');
    assert.equal(res.body.data[0].contact_number, undefined);
    assert.deepEqual(audits.at(-1), [12, 3, 'search']);
  }
});

test('phone lookup rejects short, excessive, malformed, and non-string searches before querying', async t => {
  let searches = 0;
  t.mock.method(Patient, 'search', async () => { searches++; return []; });
  for (const phone of ['123', '1234567890123', '45%67', '45_67', 'abc4567', '+', ['4567']]) {
    const res = response();
    await searchPatients({ query: { phone }, user: { user_id: 3 } }, res);
    assert.equal(res.statusCode, 400, String(phone));
  }
  assert.equal(searches, 0);
});

test('MySQL phone fragments match patient and account contacts and exclude archived records', { skip: process.env.PATIENT_DB_TESTS !== 'true' }, async () => {
  const connection = await pool.getConnection();
  try {
    // Temporary tables shadow real tables only on this connection.
    await connection.query(`CREATE TEMPORARY TABLE patients (
      patient_id INT PRIMARY KEY, first_name VARCHAR(100), last_name VARCHAR(100),
      date_of_birth DATE, gender VARCHAR(20), contact_number VARCHAR(20), barangay VARCHAR(100),
      city VARCHAR(100), user_id INT, archived_into_patient_id INT)`);
    await connection.query('CREATE TEMPORARY TABLE users (user_id INT PRIMARY KEY, phone VARCHAR(20))');
    await connection.query("INSERT INTO users VALUES (11, '09999456788')");
    await connection.query(`INSERT INTO patients (patient_id, first_name, last_name, contact_number, user_id, archived_into_patient_id) VALUES
      (1, 'Zed', 'Walkin', '09123456789', NULL, NULL),
      (2, 'Ana', 'Account', NULL, 11, NULL),
      (3, 'Bob', 'Archived', '09123456789', NULL, 1),
      (4, 'Cara', 'Unrelated', '09111111111', NULL, NULL)`);
    for (const [phone, ids] of [['4567', [2, 1]], ['0912', [1]], ['6789', [1]], ['9999', [2]], ['8888', []]]) {
      assert.deepEqual((await Patient.search({ phone }, connection)).map(patient => patient.patient_id), ids, phone);
    }
  } finally {
    for (const table of ['patients', 'users']) await connection.query(`DROP TEMPORARY TABLE IF EXISTS ${table}`);
    connection.release();
  }
});
