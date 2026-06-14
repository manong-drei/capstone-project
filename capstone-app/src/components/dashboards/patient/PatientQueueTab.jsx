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
export default function PatientQueueTab({ hasActiveQueue, queue, loading, error, onGetQueue, onCancelQueue, onBack }) {
  return (
    <div className="pd-tab-pad" style={{ flex: 1, maxWidth: "860px", margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>
            ← Back
          </button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>My Queue</h2>
        </div>
        {loading && <p style={{ color: "#9ca3af" }}>Loading...</p>}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        {!loading && !hasActiveQueue && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "16px" }}>
              You don't have an active queue number.
            </p>
            <button
              onClick={onGetQueue}
              style={{ padding: "12px 24px", borderRadius: "12px", border: "none", background: NAVY, color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
            >
              Get Queue Number
            </button>
          </div>
        )}
        {hasActiveQueue && <QueueStatus queue={queue} onCancel={onCancelQueue} />}
      </div>
    </div>
  );
}
