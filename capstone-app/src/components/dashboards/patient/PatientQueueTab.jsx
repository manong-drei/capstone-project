import QueueStatus from "./QueueStatus";
import PatientQueueLine from "./PatientQueueLine";

export default function PatientQueueTab({ hasActiveQueue, registrationMessage, queue, loading, error, queueStatus, queueStatusError, queueStatusLoaded, onGetQueue, onCancelQueue, onBack }) {
  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <button type="button" className="min-h-11 rounded-lg px-2 text-sm font-medium text-blue-800 hover:bg-blue-50" onClick={onBack}>← Back</button>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">My Queue</h1>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <PatientQueueLine queueStatus={queueStatus} queue={queue} hasActiveQueue={hasActiveQueue} error={queueStatusError} loaded={queueStatusLoaded} expanded />
        <section className="min-w-0 space-y-5" aria-label="My ticket">
          {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">{error} Displayed ticket information may be outdated.</p>}
          {(hasActiveQueue || queue?.status === "no_show") && <QueueStatus queue={queue} onCancel={hasActiveQueue ? onCancelQueue : undefined} />}
          {!hasActiveQueue && <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-xs">
            <h2 className="text-lg font-semibold text-blue-950">No active queue number</h2>
            <p role="status" className="text-base leading-6 text-slate-700">{registrationMessage || "You don't have an active queue number."}</p>
            <button type="button" className="min-h-12 rounded-xl bg-orange-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-800 disabled:opacity-60" onClick={onGetQueue} disabled={loading || !!registrationMessage}>Get Queue Ticket</button>
          </div>}
        </section>
      </div>
    </div>
  );
}
