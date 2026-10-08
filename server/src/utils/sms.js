const crypto = require('node:crypto');
const { normalizePhilippineMobilePhone } = require('./phone');
const API_URL = 'https://api.semaphore.co/api/v4/messages';
const STATUSES = new Set(['queued', 'pending', 'sent', 'failed', 'refunded']);

function encryptionKey() {
  const value = process.env.SMS_ENCRYPTION_KEY || '';
  if (!/^[a-f\d]{64}$/i.test(value)) throw new Error('SMS_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters.');
  return Buffer.from(value, 'hex');
}
function encryptPayload(message) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
}
function decryptPayload(payload) {
  const value = Buffer.from(payload, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), value.subarray(0, 12));
  decipher.setAuthTag(value.subarray(12, 28));
  return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]).toString('utf8');
}
function validateConfig() {
  encryptionKey();
  if (!process.env.SMS_API_KEY || !/^(?=.*[a-z])[a-z\d]{1,11}$/i.test(process.env.SMS_SENDER_NAME || '')) {
    throw new Error('SMS requires an API key and an approved alphanumeric sender name (1–11 characters).');
  }
}
function smsError(code, retryable = false, retryAfter = 0, unknown = false) {
  return Object.assign(new Error(code), { code, retryable, retryAfter, unknown });
}
function retryAfterMs(value, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(value) - now) || 0;
}
function parseMessage(data, recipient, id) {
  const row = Array.isArray(data) && data.length === 1 ? data[0] : null;
  if (!row || !/^\d+$/.test(String(row.message_id)) || !STATUSES.has(String(row.status).toLowerCase()) ||
      normalizePhilippineMobilePhone(row.recipient) !== recipient || (id && String(row.message_id) !== String(id))) {
    throw smsError('invalid_provider_response', false, 0, true);
  }
  return { message_id: String(row.message_id), status: row.status.toLowerCase() };
}
async function request(url, options) {
  let response;
  try { response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) }); }
  catch (error) {
    const beforeSubmission = ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT'].includes(error.cause?.code);
    throw smsError(beforeSubmission ? 'connection_failed' : 'submission_uncertain', beforeSubmission, 0, !beforeSubmission);
  }
  const retryAfter = retryAfterMs(response.headers.get('Retry-After'));
  if (!response.ok) {
    if (response.status === 429) throw smsError('rate_limited', true, retryAfter);
    throw smsError(`provider_http_${response.status}`, false, retryAfter, response.status >= 500);
  }
  let data;
  try { data = await response.json(); } catch { throw smsError('invalid_provider_response', false, 0, true); }
  const remaining = response.headers.get('X-RateLimit-Remaining');
  return { data, pauseMs: remaining === '0' ? Math.max(retryAfter, 60000) : 0 };
}
async function sendSMS(number, message) {
  validateConfig();
  const recipient = normalizePhilippineMobilePhone(number);
  if (!recipient) throw smsError('invalid_recipient');
  if (typeof message !== 'string' || !message.length || message.length > 160 || /[^\x20-\x7e]/.test(message) || /^test/i.test(message)) {
    throw smsError('invalid_message');
  }
  const body = new URLSearchParams({ apikey: process.env.SMS_API_KEY, number: recipient, message, sendername: process.env.SMS_SENDER_NAME });
  const result = await request(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!Array.isArray(result.data) && result.data && typeof result.data === 'object' &&
      ['apikey', 'number', 'message', 'sendername'].some(key => Array.isArray(result.data[key]))) throw smsError('provider_rejected');
  return { ...parseMessage(result.data, recipient), pauseMs: result.pauseMs };
}
async function getSMSStatus(id, recipient) {
  validateConfig();
  if (!/^\d+$/.test(String(id))) throw smsError('invalid_message_id');
  const url = new URL(`${API_URL}/${id}`);
  url.searchParams.set('apikey', process.env.SMS_API_KEY);
  const result = await request(url, { method: 'GET' });
  return { ...parseMessage(result.data, recipient, id), pauseMs: result.pauseMs };
}
module.exports = { sendSMS, getSMSStatus, encryptPayload, decryptPayload, validateConfig, retryAfterMs };
