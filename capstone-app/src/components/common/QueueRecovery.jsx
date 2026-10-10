import { useEffect, useState } from 'react';
import { formatQueueTime, getQueueDisplayName } from '@/utils/queueDisplay';

export default function QueueRecovery({ called, missed = [], onAction, loading, presentLabel = 'Patient present' }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = called ? Math.max(0, Math.ceil((new Date(called.last_called_at).getTime() + 30_000 - now) / 1000)) : 0;
  const buttonClass = 'rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50';

  return <div className="space-y-4">
    {called && <section aria-label="Called patient controls" className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="mb-3 text-sm text-blue-900">Called {called.queue_number} · Call {called.call_count} of 2{remaining > 0 && ` · Wait ${remaining}s`}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={loading} onClick={() => onAction(called.id, 'present')}>{presentLabel}</button>
        {called.call_count < 2
          ? <button type="button" className={buttonClass} disabled={loading || remaining > 0} onClick={() => onAction(called.id, 'recall')}>Call again</button>
          : <button type="button" className={buttonClass} disabled={loading || remaining > 0} onClick={() => onAction(called.id, 'skip')}>Skip and call next</button>}
      </div>
      <p className="mt-3 text-xs text-blue-800">Confirm presence only when the patient is physically here. Each call is announced twice; use Call again for the second call.</p>
    </section>}
    {missed.length > 0 && <section aria-label="Missed patients" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-amber-900">Missed patients · 10-minute return window</h3>
      <ul className="space-y-3">{missed.map(queue => <li key={queue.id} className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm font-semibold text-slate-900">{queue.queue_number} · {getQueueDisplayName(queue)}</p><p className="text-xs text-amber-900">Report before {formatQueueTime(queue.grace_expires_at)}{new Date(queue.grace_expires_at).getTime() <= now && ' · Return window expired'}</p></div>
        <button type="button" className={buttonClass} disabled={loading || new Date(queue.grace_expires_at).getTime() <= now} onClick={() => onAction(queue.id, 'return')}>Patient returned<span className="sr-only"> {queue.queue_number}</span></button>
      </li>)}</ul>
    </section>}
  </div>;
}
