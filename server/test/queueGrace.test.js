const test = require('node:test');
const assert = require('node:assert/strict');
const Queue = require('../src/models/Queue');
const pool = require('../src/config/db');
const { projectQueue } = require('../src/utils/queueOrder');

// A transactional fixture exercises the real model and serializes its category locks.
function fixture() {
  const original = pool.getConnection;
  let now = Date.parse('2026-10-10T09:00:00+08:00');
  let rows = [1, 2, 3].map(id => ({ id, category: 'dental', patient_id: id, queue_number: `Q${id}`,
    status: 'waiting', call_count: 0, is_walk_in: id === 2 ? 1 : 0, type: 'regular',
    services: '[]', created_at: new Date(now - 1000), last_called_at: null, returned_at: null }));
  let tail = Promise.resolve();
  let failCall = false;
  const statements = [];
  pool.getConnection = async () => {
    let working;
    let unlock;
    return {
      async beginTransaction() {},
      async commit() { if (working) rows = working; unlock?.(); unlock = null; },
      async rollback() { working = null; unlock?.(); unlock = null; },
      release() {},
      async query(raw, values = []) {
        const sql = raw.replace(/\s+/g, ' ').trim();
        statements.push(sql);
        if (sql.startsWith('INSERT INTO queue_sequences')) return [{}];
        if (sql.startsWith('SELECT last_number')) {
          const previous = tail;
          tail = new Promise(resolve => { unlock = resolve; });
          await previous;
          working = structuredClone(rows);
          return [[{ last_number: 0 }]];
        }
        const data = working || rows;
        const row = data.find(q => q.id === Number(values[0]));
        if (sql.startsWith('SELECT category')) return [[...row ? [{ category: row.category }] : []]];
        if (sql.startsWith('SELECT *, TIMESTAMPDIFF')) return [[{ ...row,
          call_ready: now - new Date(row.last_called_at) >= 30_000,
          expired: row.grace_expires_at && new Date(row.grace_expires_at).getTime() <= now,
          is_today: row.created_at.toISOString().slice(0, 10) === new Date(now).toISOString().slice(0, 10),
        }]];
        if (sql.startsWith('SELECT id FROM queues')) return [[...data.filter(q => q.category === values[0] && ['called', 'serving'].includes(q.status)).slice(0, 1)]];
        if (sql.startsWith('SELECT is_walk_in')) return [[...data.filter(q => q.category === values[0] && q.last_called_at)
          .sort((a, b) => new Date(b.last_called_at) - new Date(a.last_called_at) || b.id - a.id).slice(0, 1)]];
        if (sql.startsWith('SELECT * FROM queues')) return [structuredClone(data.filter(q => q.category === values[0] && q.status === 'waiting'))];
        if (sql.startsWith('SELECT q.*')) return [row ? [structuredClone(row)] : []];
        if (sql.startsWith("UPDATE queues SET status = 'called'")) {
          if (failCall) throw new Error('Simulated call failure');
          Object.assign(row, { status: 'called', call_count: 1, last_called_at: new Date(now), status_reason: null });
        } else if (sql.startsWith('UPDATE queues SET call_count = 2')) {
          Object.assign(row, { call_count: 2, last_called_at: new Date(now) });
        } else if (sql.startsWith("UPDATE queues SET status = 'missed'")) {
          Object.assign(data.find(q => q.id === values[1]), { status: 'missed', missed_at: new Date(now), grace_expires_at: new Date(now + 600_000) });
        } else if (sql.startsWith("UPDATE queues SET status = 'waiting'")) {
          Object.assign(row, { status: 'waiting', returned_at: new Date(now) });
        } else if (sql.startsWith("UPDATE queues SET status = 'no_show'")) {
          const targets = sql.includes('WHERE category = ?')
            ? data.filter(q => q.category === values[1] && q.status === 'missed' && new Date(q.grace_expires_at).getTime() <= now)
            : data.filter(q => q.id === values[1]);
          targets.forEach(q => Object.assign(q, { status: 'no_show', status_reason: values[0] }));
        } else if (sql.startsWith('UPDATE queues SET status = ?')) {
          Object.assign(data.find(q => q.id === Number(values[2])), { status: values[0], status_reason: values[1] });
        } else throw new Error(`Unexpected SQL: ${sql}`);
        return [{ affectedRows: 1 }];
      },
    };
  };
  return {
    advance: ms => { now += ms; }, rows: () => rows, statements,
    failCall: () => { failCall = true; }, close: () => { pool.getConnection = original; },
  };
}

test('two calls enforce both 30-second waits; skip starts one grace window and calls next', async () => {
  const f = fixture();
  try {
    assert.equal((await Queue.callNext()).status, 'called');
    await assert.rejects(Queue.recall(1), { status: 409 });
    await assert.rejects(Queue.skip(1), { status: 409 });
    f.advance(30_000);
    assert.equal((await Queue.recall(1)).call_count, 2);
    await assert.rejects(Queue.skip(1), { status: 409 });
    f.advance(30_000);
    const result = await Queue.skip(1);
    assert.equal(result.queue.status, 'missed');
    assert.equal(result.queue.grace_expires_at - result.queue.missed_at, 600_000);
    assert.equal(result.next_queue.id, 2);
    assert.equal(result.next_queue.status, 'called');
    await assert.rejects(Queue.updateStatus(1, 'no_show'), { status: 409 });
    await assert.rejects(Queue.updateStatus(1, 'waiting'), { status: 409 });
    await assert.rejects(Queue.updateStatus(3, 'serving'), { status: 409 });
    await assert.rejects(Queue.updateStatus(2, 'done'), { status: 409 });
    assert.equal((await Queue.updateStatus(2, 'serving')).status, 'serving');
  } finally { f.close(); }
});

test('timely return keeps the original ticket beyond expiry and a second miss is final', async () => {
  const f = fixture();
  try {
    await Queue.callNext(); f.advance(30_000); await Queue.recall(1); f.advance(30_000); await Queue.skip(1);
    f.advance(599_999);
    const returned = await Queue.returnPatient(1);
    assert.equal(returned.id, 1);
    assert.equal(returned.status, 'waiting');
    f.advance(1);
    await Queue.expireMissed();
    assert.equal(f.rows()[0].status, 'waiting');
    await Queue.updateStatus(2, 'serving'); await Queue.updateStatus(2, 'done');
    assert.equal((await Queue.callNext()).id, 1);
    f.advance(30_000); await Queue.recall(1); f.advance(30_000);
    const second = await Queue.skip(1);
    assert.equal(second.queue.status, 'no_show');
    assert.equal(second.queue.grace_expires_at.getTime(), returned.grace_expires_at.getTime());
    await assert.rejects(Queue.returnPatient(1), { status: 409 });
    assert.equal(f.rows().length, 3);
  } finally { f.close(); }
});

test('return at the deadline commits no-show; worker closes overdue tickets, including yesterday', async () => {
  const f = fixture();
  try {
    await Queue.callNext(); f.advance(30_000); await Queue.recall(1); f.advance(30_000); await Queue.skip(1);
    f.advance(600_000);
    assert.deepEqual(await Queue.returnPatient(1), { expired: true });
    assert.equal(f.rows()[0].status, 'no_show');
    const second = f.rows()[1];
    Object.assign(second, { status: 'missed', created_at: new Date('2026-10-09T01:00:00Z'), grace_expires_at: new Date(0) });
    await Queue.expireMissed();
    assert.equal(f.rows()[1].status, 'no_show');
  } finally { f.close(); }
});

test('simultaneous call and skip requests serialize; failure rolls back both skip and next', async () => {
  const f = fixture();
  try {
    const calls = await Promise.all([Queue.callNext(), Queue.callNext()]);
    assert.equal(calls.filter(q => q?.status === 'called').length, 1);
    assert.equal(calls.filter(q => q?.conflict).length, 1);
    f.advance(30_000); await Queue.recall(1); f.advance(30_000);
    f.failCall();
    await assert.rejects(Queue.skip(1), /Simulated call failure/);
    assert.equal(f.rows()[0].status, 'called');
    assert.equal(f.rows()[1].status, 'waiting');
  } finally { f.close(); }
  const second = fixture();
  try {
    await Queue.callNext(); second.advance(30_000); await Queue.recall(1); second.advance(30_000);
    const skips = await Promise.allSettled([Queue.skip(1), Queue.skip(1)]);
    assert.equal(skips.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(second.rows().filter(q => q.status === 'called').length, 1);
  } finally { second.close(); }
});

test('skipping the last waiting patient succeeds with no next ticket', async () => {
  const f = fixture();
  try {
    f.rows().splice(1);
    await Queue.callNext(); f.advance(30_000); await Queue.recall(1); f.advance(30_000);
    assert.equal((await Queue.skip(1)).next_queue, null);
  } finally { f.close(); }
});

test('cancellation cannot bypass expiry while waiting for the worker', async () => {
  const f = fixture();
  try {
    await Queue.callNext(); f.advance(30_000); await Queue.recall(1); f.advance(30_000); await Queue.skip(1);
    f.advance(600_000);
    assert.deepEqual(await Queue.updateStatus(1, 'cancelled', 'Leaving', { patientOnly: true }), { expired: true });
    assert.equal(f.rows()[0].status, 'no_show');
  } finally { f.close(); }
});

test('returned patients are FIFO ahead of ordinary priority and source alternation resumes afterward', () => {
  const row = (id, is_walk_in, returned_at, type = 'regular') => ({ id, is_walk_in, returned_at, type, created_at: new Date(0) });
  const waiting = [row(4, 0, new Date(2)), row(3, 1, new Date(1)), row(2, 1, null, 'priority'), row(1, 0, null, 'priority')];
  assert.deepEqual(projectQueue(waiting, { is_walk_in: 1 }).map(q => q.id), [3, 4, 2, 1]);
});

test('expiry startup sweep and five-second timer work with SMS disabled', async () => {
  const worker = require('../src/services/queueExpiry');
  const saved = { expire: Queue.expireMissed, interval: global.setInterval, sms: process.env.SMS_ENABLED };
  let calls = 0;
  Queue.expireMissed = async () => { calls++; };
  process.env.SMS_ENABLED = 'false';
  global.setInterval = (callback, delay) => { assert.equal(delay, 5000); return { unref() {} }; };
  try { await worker.startWorker(); assert.equal(calls, 1); await worker.tick(); assert.equal(calls, 2); }
  finally {
    Queue.expireMissed = saved.expire; global.setInterval = saved.interval;
    if (saved.sms === undefined) delete process.env.SMS_ENABLED; else process.env.SMS_ENABLED = saved.sms;
  }
});
