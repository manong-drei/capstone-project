const test = require('node:test');
const assert = require('node:assert/strict');
const { projectQueue } = require('../src/utils/queueOrder');

const row = (id, is_walk_in, fields = {}) => ({
  id, is_walk_in, type: 'regular', created_at: new Date(id * 1000), ...fields,
});
const ids = (waiting, lastCalled) => projectQueue(waiting, lastCalled).map(q => q.id);

test('a new app ticket waits for earlier walk-ins, but later arrivals do not extend its protection boundary', () => {
  const waiting = [row(1, 1), row(2, 1), row(3, 0), row(4, 1)];
  for (const lastCalled of [null, { is_walk_in: 0 }, { is_walk_in: 1 }]) {
    assert.deepEqual(ids(waiting, lastCalled), [1, 2, 3, 4]);
  }
  assert.deepEqual(ids([row(1, 0), row(2, 0), row(3, 1)], { is_walk_in: 0 }), [3, 1, 2]);
});

test('verified priority tickets precede regular tickets and are FIFO across sources', () => {
  const waiting = [row(1, 1), row(2, 1, { type: 'priority' }), row(3, 0, { type: 'priority' }), row(4, 0)];
  assert.deepEqual(ids(waiting, { is_walk_in: 0 }), [2, 3, 1, 4]);
  assert.deepEqual(ids([row(1, 0, { type: 'priority' }), row(2, 1, { type: 'priority' })]), [1, 2]);
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
    assert.deepEqual(ids([returned, row(2, 0), row(3, 1), row(5, 1)], { is_walk_in: 1 }), [2, 3, 1, 5]);
  }
});

test('priority returns retain priority but rejoin after priority patients already waiting', () => {
  assert.deepEqual(ids([
    row(1, 1, { type: 'priority', returned_at: new Date(5000) }),
    row(2, 0, { type: 'priority' }), row(3, 1, { type: 'priority' }), row(4, 0),
    row(6, 0, { type: 'priority' }),
  ]), [2, 3, 1, 6, 4]);
});

test('equal-time returns follow existing entries and use ID to break remaining ties', () => {
  const time = new Date(5000);
  assert.deepEqual(ids([
    row(1, 0, { returned_at: time }), row(2, 1, { returned_at: time }),
    row(3, 0, { created_at: time }), row(4, 1, { created_at: time }),
  ]), [3, 4, 1, 2]);
});

test('projections are non-mutating and agree with repeatedly calling the next patient', () => {
  const waiting = [row(4, 0), row(2, 1), row(1, 0, { type: 'priority' }), row(3, 1)];
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
