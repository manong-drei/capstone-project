export const DATA_UPDATES_CHANNEL = 'ekalusugan-data-updates';
// shortcut: other devices are detected by five-second polling; add server push if sub-second delivery is needed.
export const SYNC_INTERVAL_MS = 5_000;

const listeners = new Set();
let channel;
let stop;

function refresh(reason) {
  if (document.visibilityState === 'hidden' || navigator.onLine === false) return;
  for (const listener of listeners) listener(reason);
}

export function subscribeToDataChanges(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    const timer = window.setInterval(() => refresh('poll'), SYNC_INTERVAL_MS);
    const resume = () => refresh('resume');
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    try {
      channel = new BroadcastChannel(DATA_UPDATES_CHANNEL);
      channel.onmessage = () => refresh('change');
    } catch { /* Polling also synchronizes browsers without BroadcastChannel. */ }
    stop = () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
      channel?.close();
      channel = undefined;
    };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stop();
  };
}

export function notifyDataChange() {
  refresh('change');
  try {
    if (channel) {
      channel.postMessage('changed');
      return;
    }
    const updates = new BroadcastChannel(DATA_UPDATES_CHANNEL);
    updates.postMessage('changed');
    updates.close();
  } catch { /* Other tabs and devices still poll. */ }
}
