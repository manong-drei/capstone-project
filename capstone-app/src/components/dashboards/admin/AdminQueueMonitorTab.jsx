import { QUEUE_STATUS } from "@/constants/queue";
import { getQueueDisplayName } from "@/utils/queueDisplay";

/**
 * AdminQueueMonitorTab
 * Live read-only view of today's dental queue.
 *
 * Props:
 *   queueMonitor — array of queue entries
 *   queueLoading — boolean loading state
 */
export default function AdminQueueMonitorTab({ queueMonitor, queueLoading, onQueueStatus }) {
  return (
    <div
      className="ad-tab-pad"
      style={{
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}
    >
      <h3
        style={{
          margin: "0 0 8px",
          fontSize: "16px",
          fontWeight: 700,
          color: "#1e293b",
        }}
      >
        Queue Monitor
      </h3>
      <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "13px" }}>
        Live queue list with queue numbers and patient names.
      </p>

      {queueLoading ? (
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
          Loading queue...
        </p>
      ) : queueMonitor.length === 0 ? (
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
          No queue entries today.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {queueMonitor.map((q) => {
            const status = String(q.status ?? "").toLowerCase();
            const statusColor =
              status === QUEUE_STATUS.SERVING
                ? "#059669"
                : status === QUEUE_STATUS.WAITING
                  ? "#2d3a8c"
                  : status === QUEUE_STATUS.DONE
                    ? "#0891b2"
                    : "#dc2626";
            const statusBg =
              status === QUEUE_STATUS.SERVING
                ? "#d1fae5"
                : status === QUEUE_STATUS.WAITING
                  ? "#eef2ff"
                  : status === QUEUE_STATUS.DONE
                    ? "#e0f2fe"
                    : "#fee2e2";
            const statusLabel = status
              ? `${status.charAt(0).toUpperCase()}${status.slice(1)}`
              : "Unknown";

            return (
              <div
                key={q.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    {q.queue_number ?? "—"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#334155" }}>
                    {getQueueDisplayName(q)}
                  </span>
                </div>
                {q.status_reason && (
                  <small style={{ flexBasis: "100%", color: "#64748b" }}>
                    Reason: {q.status_reason}
                  </small>
                )}
                {onQueueStatus && [QUEUE_STATUS.WAITING, QUEUE_STATUS.SERVING].includes(status) && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => onQueueStatus(q, "cancelled")} style={{ border: "1px solid #fecaca", borderRadius: "8px", background: "#fff", color: "#b91c1c", padding: "6px 10px", cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => onQueueStatus(q, "no_show")} style={{ border: "1px solid #fed7aa", borderRadius: "8px", background: "#fff", color: "#c2410c", padding: "6px 10px", cursor: "pointer" }}>No-show</button>
                  </div>
                )}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: q.type === "priority" ? "#fff7ed" : "#f3f4f6",
                      color: q.type === "priority" ? "#f97316" : "#64748b",
                    }}
                  >
                    {q.type === "priority" ? "Priority" : "Regular"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: statusBg,
                      color: statusColor,
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
