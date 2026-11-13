const test = require('node:test');
const assert = require('node:assert/strict');
const Doctor = require('../src/models/Doctor');
const audit = require('../src/services/auditLog');
const { upsertDailySettings } = require('../src/controllers/doctorController');
const { migrate } = require('../src/config/migrateDoctorUnavailableReason');
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; } });

test('unavailability requires a bounded reason, persists it and preserves it on capacity-only saves', async t => {
  t.mock.method(Doctor, 'findByUserId', async () => ({ doctor_id: 7 }));
  const writes = [];
  t.mock.method(audit, 'transaction', async fn => fn({ query: async (sql, values) => { writes.push({ sql, values }); return [[]]; } }));
  const body = { date: '2026-11-13', appointment_limit: 10, walk_in_limit: 5, is_available: 0 };
  for (const reason of [undefined, '', '   ', {}, 'x'.repeat(501)]) {
    const res = response();
    await upsertDailySettings({ user: { user_id: 4 }, body: { ...body, unavailable_reason: reason } }, res);
    assert.equal(res.code, 400);
  }
  assert.equal(writes.length, 0);
  for (const [availability, expected] of [[0, 'Emergency duty'], [undefined, null]]) {
    const res = response();
    await upsertDailySettings({ user: { user_id: 4 }, body: { ...body, is_available: availability, unavailable_reason: '  Emergency duty  ' } }, res);
    assert.equal(res.code, 200);
    assert.equal(writes.at(-1).values[5], expected);
    assert.equal(writes.at(-1).values[7], availability === undefined ? null : availability);
    assert.match(writes.at(-1).sql, /unavailable_reason = IF/);
  }
});

test('reason migration adds the column once and preserves existing settings', async () => {
  const statements = [];
  let installed = false;
  const database = { query: async sql => {
    statements.push(sql);
    if (sql.startsWith('SHOW')) return [installed ? [{}] : []];
    installed = true; return [{}];
  } };
  await migrate(database); await migrate(database);
  assert.equal(statements.filter(sql => sql.startsWith('ALTER')).length, 1);
});
