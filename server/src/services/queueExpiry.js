const Queue = require('../models/Queue');

let timer;
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try { await Queue.expireMissed(); }
  catch (error) { console.error('Queue expiry failed:', error.message); }
  finally { running = false; }
}

async function startWorker() {
  if (timer) return;
  await Queue.expireMissed();
  timer = setInterval(tick, 5000);
  timer.unref();
}

module.exports = { startWorker, tick };
