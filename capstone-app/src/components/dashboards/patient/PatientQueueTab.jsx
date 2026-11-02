import QueueStatus from "./QueueStatus";

const NAVY = "#2d3a8c";

/**
 * PatientQueueTab
 * Shows the patient's current queue status or a prompt to get a queue number.
 *
 * Props:
 *   hasActiveQueue — boolean
 *   queue          — queue object or null
 *   loading        — boolean
 *   error          — error string or null
 *   onGetQueue     — open the GetQueueModal
 *   onCancelQueue  — cancel the active queue
 *   onBack         — navigate back to home tab
 */
export default function PatientQueueTab({
  hasActiveQueue,
  registrationMessage,
  queue,
  loading,
  error,
  queueStatus,
  queueStatusError,
  queueStatusLoaded,
  onGetQueue,
  onCancelQueue,
  onBack,
}) {
  return (
    <div
      className="pd-tab-pad"
      style={{ flex: 1, maxWidth: "860px", margin: "0 auto", width: "100%" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            ← Back
          </button>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            My Queue
          </h2>
        </div>
        <section aria-labelledby="patient-queue-line-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 id="patient-queue-line-title" className="text-lg font-bold text-slate-900">Current dental queue line</h3>
          <p className="mt-1 text-sm text-slate-500">Updates every 15 seconds. Tickets follow the clinic's service order.</p>
          {queueStatusError ? <p role="alert" className="mt-4 text-sm text-red-700">{queueStatusError}</p>
            : !queueStatusLoaded ? <p role="status" className="mt-4 text-sm text-slate-500">Loading queue line…</p>
            : <>
              <div className="my-4 grid grid-cols-2 gap-3" aria-live="polite">
                <div className="rounded-xl bg-blue-50 p-3"><p className="text-xs text-blue-700">{queueStatus.current_status === "called" ? "Now calling" : "Now serving"}</p><p className="mt-1 text-xl font-bold text-blue-900">{queueStatus.now_serving || "—"}</p></div>
                <div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-orange-700">Next in queue</p><p className="mt-1 text-xl font-bold text-orange-900">{queueStatus.next_queuing || "—"}</p></div>
              </div>
              {queueStatus.line?.length ? <ol aria-label="Current queue line" className="space-y-2">
                {queueStatus.line.map((ticket, index) => {
                  const isMine = hasActiveQueue && ticket.queue_number === queue.queue_number;
                  return <li key={ticket.queue_number} aria-current={isMine ? "true" : undefined} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${isMine ? "border-blue-300 bg-blue-50" : "border-slate-200"}`}>
                    <span className="font-semibold text-slate-900"><span className="mr-3 text-sm font-normal text-slate-500">{index + 1}.</span>{ticket.queue_number}{isMine && <span className="ml-2 text-sm text-blue-700">Your ticket</span>}</span>
                    <span className="text-sm text-slate-600">{ticket.status === "called" ? "Now calling" : ticket.status === "serving" ? "Now serving" : "Waiting"}</span>
                  </li>;
                })}
              </ol> : <p className="text-sm text-slate-500">No active tickets in the queue.</p>}
            </>}
        </section>
        {loading && <p style={{ color: "#9ca3af" }}>Loading...</p>}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        {!loading && !hasActiveQueue && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p
              role="status"
              style={{
                color: "#6b7280",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {registrationMessage || "You don't have an active queue number."}
            </p>
            <button
              onClick={onGetQueue}
              disabled={!!registrationMessage}
              className="disabled:opacity-60"
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: "none",
                background: NAVY,
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: registrationMessage ? "not-allowed" : "pointer",
              }}
            >
              Get Queue Ticket
            </button>
          </div>
        )}
        {(hasActiveQueue || queue?.status === "no_show") && (
          <QueueStatus
            queue={queue}
            onCancel={hasActiveQueue ? onCancelQueue : undefined}
          />
        )}
      </div>
    </div>
  );
}
