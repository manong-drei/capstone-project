const test = require('node:test');
const assert = require('node:assert/strict');
const { projectQueue } = require('../src/utils/queueOrder');

const row = (id, is_walk_in, fields = {}) => ({
  id, is_walk_in, type: 'regular', created_at: new Date(id * 1000), ...fields,
});
const ids = (waiting, lastCalled) => projectQueue(waiting, lastCalled).map(q => q.id);

test('held insertions use confirmation order ahead of priority and resume alternation after the final insertion', () => {
  const waiting = [row(1, 0, { type: 'priority' }), row(2, 1),
    row(9, 0, { held_insert_order: 1, type: 'priority' }), row(4, 1, { held_insert_order: 2 })];
  const snapshot = structuredClone(waiting);
  assert.deepEqual(ids(waiting, { type: 'priority' }), [9, 4, 1, 2]);
  assert.deepEqual(waiting, snapshot);
  const called = waiting.find(q => q.id === 9);
  assert.deepEqual(ids(waiting.filter(q => q !== called), called), [4, 1, 2]);
});

test('regular tickets follow entry time across app and walk-in sources', () => {
  const waiting = [row(1, 1), row(2, 1), row(3, 0), row(4, 1)];
  for (const lastCalled of [null, { type: 'regular' }, { type: 'priority' }]) {
    assert.deepEqual(ids(waiting, lastCalled), [1, 2, 3, 4]);
    assert.deepEqual(ids([row(3, 1), row(2, 0), row(1, 0)], lastCalled), [1, 2, 3]);
  }
});

test('priority and regular turns alternate, starting with priority and using FIFO within each group', () => {
  const waiting = [
    row(6, 0, { type: 'priority' }), row(4, 0), row(1, 1),
    row(3, 0, { type: 'priority' }), row(2, 1, { type: 'priority' }), row(5, 1),
  ];
  assert.deepEqual(ids(waiting), [2, 1, 3, 4, 6, 5]);
  assert.deepEqual(ids(waiting, { type: 'regular' }), [2, 1, 3, 4, 6, 5]);
  assert.deepEqual(ids(waiting, { type: 'priority' }), [1, 2, 4, 3, 5, 6]);
});

test('AP01 is followed by the earlier regular app ticket before the later walk-in', () => {
  const waiting = [
    row(1, 0, { queue_number: 'AP01', type: 'priority', created_at: new Date('2026-11-14T13:10:00+08:00') }),
    row(2, 0, { queue_number: 'AQ01', created_at: new Date('2026-11-14T13:13:00+08:00') }),
    row(3, 1, { queue_number: 'Q01', created_at: new Date('2026-11-14T13:19:00+08:00') }),
  ];
  assert.deepEqual(projectQueue(waiting).map(q => q.queue_number), ['AP01', 'AQ01', 'Q01']);
});

test('empty groups are skipped and later arrivals use the last actual called type', () => {
  const priority = [row(1, 0, { type: 'priority' }), row(2, 1, { type: 'priority' })];
  for (const lastCalled of [null, { type: 'regular' }, { type: 'priority' }]) {
    assert.deepEqual(ids(priority, lastCalled), [1, 2]);
  }
  const regular = row(3, 1);
  assert.deepEqual(ids([...priority, regular]), [1, 3, 2]);
  assert.deepEqual(ids([priority[1], regular], priority[0]), [3, 2]);
  assert.deepEqual(ids([priority[1], row(4, 0)], regular), [2, 4]);
});

test('registration time and ID, never the displayed ticket counter, determine earlier entry', () => {
  const time = new Date(0);
  assert.deepEqual(ids([
    row(2, 0, { queue_number: 'AQ01', created_at: time }),
    row(1, 1, { queue_number: 'Q99', created_at: time }),
  ]), [1, 2]);
  assert.deepEqual(ids([row(1, 0, { created_at: new Date(5000) }), row(2, 1)]), [2, 1]);
});

test('regular returns from either source rejoin behind everyone already waiting', () => {
  for (const is_walk_in of [0, 1]) {
    const returned = row(1, is_walk_in, { returned_at: new Date(4000), last_called_at: new Date(1500) });
    assert.deepEqual(ids([returned, row(2, 0), row(3, 1), row(5, 1)], { type: 'regular' }), [2, 3, 1, 5]);
  }
});

test('priority returns follow earlier priority entries and still alternate with regular patients', () => {
  assert.deepEqual(ids([
    row(1, 1, { type: 'priority', returned_at: new Date(5000) }),
    row(2, 0, { type: 'priority' }), row(3, 1, { type: 'priority' }), row(4, 0),
    row(6, 0, { type: 'priority' }),
  ]), [2, 4, 3, 1, 6]);
});

test('equal-time returns follow existing entries and use ID to break remaining ties', () => {
  const time = new Date(5000);
  assert.deepEqual(ids([
    row(1, 0, { returned_at: time }), row(2, 1, { returned_at: time }),
    row(3, 0, { created_at: time }), row(4, 1, { created_at: time }),
  ]), [3, 4, 1, 2]);
});

test('projections are non-mutating and agree with repeatedly calling the next patient', () => {
  const waiting = [row(4, 0), row(2, 1), row(1, 0, { type: 'priority' }), row(3, 1, { type: 'priority' }), row(5, 1)];
  const saved = structuredClone(waiting);
  const expected = ids(waiting);
  assert.deepEqual(waiting, saved);
  const actual = [];
  let previous;
  while (waiting.length) {
    const next = projectQueue(waiting, previous)[0];
    actual.push(next.id);
    waiting.splice(waiting.findIndex(q => q.id === next.id), 1);
    previous = next;
  }
  assert.deepEqual(actual, expected);
  assert.deepEqual(ids(saved), expected);
  assert.deepEqual(projectQueue([], null), []);
  assert.deepEqual(ids([row(1, 0), row(2, 0)]), [1, 2]);
  assert.deepEqual(ids([row(1, 1), row(2, 1)]), [1, 2]);
});
