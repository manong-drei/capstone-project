const test = require('node:test');
const assert = require('node:assert/strict');
const sms = require('../src/utils/sms');
const { projectQueue, alertState } = require('../src/utils/queueOrder');
const { failureDisposition, queueMessage } = require('../src/services/smsNotifications');

test('projection alternates sources, prioritizes within each source, breaks ties, and falls back', () => {
  const row = (id, is_walk_in, type = 'regular') => ({ id, is_walk_in, type, created_at: new Date(0) });
  const waiting = [row(4, 1), row(2, 0), row(5, 1, 'priority'), row(1, 0, 'priority'), row(3, 0)];
  assert.deepEqual(projectQueue(waiting).map(q => q.id), [1, 5, 2, 4, 3]);
  assert.deepEqual(projectQueue(waiting, { is_walk_in: 0 }).map(q => q.id), [5, 1, 4, 2, 3]);
  assert.deepEqual(projectQueue(waiting, { is_walk_in: 1 }).map(q => q.id), [1, 5, 2, 4, 3]);
  assert.deepEqual(projectQueue([], null), []);
  for (let position = 1; position <= 5; position++) assert.equal(alertState(position, 5), 'suppressed');
  assert.equal(alertState(6, 5), 'armed');
});

test('AES-GCM keeps passwords out of stored payloads and rejects tampering', () => {
  const original = process.env.SMS_ENCRYPTION_KEY;
  process.env.SMS_ENCRYPTION_KEY = 'ab'.repeat(32);
  try {
    const ciphertext = sms.encryptPayload('Temporary password: 012345');
    assert.ok(!ciphertext.includes('012345'));
    assert.equal(sms.decryptPayload(ciphertext), 'Temporary password: 012345');
    const tampered = Buffer.from(ciphertext, 'base64'); tampered[tampered.length - 1] ^= 1;
    assert.throws(() => sms.decryptPayload(tampered.toString('base64')));
    assert.notEqual(sms.encryptPayload('same'), sms.encryptPayload('same'));
  } finally { if (original === undefined) delete process.env.SMS_ENCRYPTION_KEY; else process.env.SMS_ENCRYPTION_KEY = original; }
});

test('retry policy stops at three, honors cooldowns, and never resends uncertain submissions', () => {
  assert.deepEqual(failureDisposition({ code: 'rate_limited', retryable: true, retryAfter: 45000 }, 1), { state: 'queued', delayMs: 45000, code: 'rate_limited' });
  assert.equal(failureDisposition({ code: 'connection_failed', retryable: true }, 3).state, 'failed');
  assert.equal(failureDisposition({ code: 'submission_uncertain', unknown: true }, 1).state, 'unknown');
  assert.equal(failureDisposition(new Error('Secret password 012345'), 1).code, 'sms_processing_failed');
  assert.equal(sms.retryAfterMs('40'), 40000);
  assert.equal(sms.retryAfterMs('Wed, 01 Jan 2025 00:00:40 GMT', Date.UTC(2025, 0, 1)), 40000);
  const message = queueMessage({ queue_number: 'AP999999' }, 100);
  assert.ok(message.includes('AP999999'));
  assert.ok(message.length <= 160 && !/[^\x20-\x7e]/.test(message));
});

test('Semaphore requests validate single recipients, responses, rejection, and uncertainty', async () => {
  const saved = { fetch: global.fetch, env: { ...process.env } };
  process.env.SMS_ENCRYPTION_KEY = 'ab'.repeat(32);
  process.env.SMS_API_KEY = 'private-test-key';
  process.env.SMS_SENDER_NAME = 'EKALUSUGAN';
  let calls = 0;
  const response = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers });
  try {
    global.fetch = async (url, options) => {
      calls++;
      assert.equal(url, 'https://api.semaphore.co/api/v4/messages');
      assert.equal(options.body.get('number'), '09123456789');
      assert.equal(options.body.get('apikey'), 'private-test-key');
      assert.equal(options.body.get('sendername'), 'EKALUSUGAN');
      return response([{ message_id: 42, recipient: '639123456789', status: 'Queued' }]);
    };
    assert.deepEqual(await sms.sendSMS('09123456789', 'E-KALUSUGAN: Hello.'), { message_id: '42', status: 'queued', pauseMs: 0 });
    await assert.rejects(sms.sendSMS('09123456789,09987654321', 'Hello'), /invalid_recipient/);
    await assert.rejects(sms.sendSMS('09123456789', 'x'.repeat(161)), /invalid_message/);
    assert.equal(calls, 1);
    global.fetch = async () => response([{ message_id: 43, recipient: '09987654321', status: 'Sent' }]);
    await assert.rejects(sms.sendSMS('09123456789', 'Hello'), error => error.unknown === true);
    global.fetch = async () => response({ apikey: ['bad key private-test-key'] });
    await assert.rejects(sms.sendSMS('09123456789', 'Hello'), error => error.code === 'provider_rejected' && !error.message.includes('private-test-key'));
    global.fetch = async () => response({}, 429, { 'Retry-After': '40' });
    await assert.rejects(sms.sendSMS('09123456789', 'Hello'), error => error.retryable && error.retryAfter === 40000);
    global.fetch = async () => response({}, 503);
    await assert.rejects(sms.sendSMS('09123456789', 'Hello'), error => error.unknown && !error.retryable);
    global.fetch = async () => { throw Object.assign(new Error('timeout'), { cause: { code: 'ETIMEDOUT' } }); };
    await assert.rejects(sms.sendSMS('09123456789', 'Hello'), error => error.unknown);
    global.fetch = async () => { throw Object.assign(new Error('dns'), { cause: { code: 'EAI_AGAIN' } }); };
    await assert.rejects(sms.sendSMS('09123456789', 'Hello'), error => error.retryable && !error.unknown);
    global.fetch = async () => new Response('not JSON', { status: 200 });
    await assert.rejects(sms.sendSMS('09123456789', 'Hello'), error => error.unknown);
  } finally {
    global.fetch = saved.fetch;
    for (const name of ['SMS_ENCRYPTION_KEY', 'SMS_API_KEY', 'SMS_SENDER_NAME']) {
      if (saved.env[name] === undefined) delete process.env[name]; else process.env[name] = saved.env[name];
    }
  }
});
