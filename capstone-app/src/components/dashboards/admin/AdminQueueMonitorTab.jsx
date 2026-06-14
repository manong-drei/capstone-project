import { QUEUE_STATUS } from "@/constants/queue";
import { getQueueDisplayName } from "@/utils/queueDisplay";

const BLUE2 = "#1e4db7";

/**
 * AdminQueueMonitorTab
 * Live read-only view of today's queue, filterable by dental / general.
 *
 * Props:
 *   queueMonitor        — array of queue entries
 *   queueLoading        — boolean loading state
 *   queueCategoryFilter — "general" | "dental"
 *   setQueueCategoryFilter — state setter
 */
export default function AdminQueueMonitorTab({
  queueMonitor,
  queueLoading,
  queueCategoryFilter,
  setQueueCategoryFilter,
}) {
  const filtered = queueMonitor.filter((q) => q.category === queueCategoryFilter);

  return (
    <div className="ad-tab-pad" style={{ background:"#fff", borderRadius:"16px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
      <h3 style={{ margin:"0 0 8px", fontSize:"16px", fontWeight:700, color:"#1e293b" }}>Queue Monitor</h3>
      <p style={{ margin:"0 0 16px", color:"#64748b", fontSize:"13px" }}>Live queue list with queue numbers and patient names.</p>

      {/* Category filter */}
      <div style={{ display:"inline-flex", padding:"3px", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:"10px", gap:"4px", marginBottom:"16px" }}>
        {[{ id:"general", label:"General Consultation" }, { id:"dental", label:"Dental Check-up" }].map(({ id, label }) => {
          const active = queueCategoryFilter === id;
          return (
            <button key={id} onClick={() => setQueueCategoryFilter(id)} style={{ border:"none", borderRadius:"8px", padding:"6px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer", background: active ? BLUE2 : "transparent", color: active ? "#fff" : "#374151" }}>
              {label}
            </button>
          );
        })}
      </div>

      {queueLoading ? (
        <p style={{ margin:0, color:"#94a3b8", fontSize:"13px" }}>Loading queue...</p>
      ) : filtered.length === 0 ? (
        <p style={{ margin:0, color:"#94a3b8", fontSize:"13px" }}>
          No {queueCategoryFilter === "general" ? "general consultation" : "dental"} queue entries today.
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {filtered.map((q) => {
            const status = String(q.status ?? "").toLowerCase();
            const statusColor =
              status === QUEUE_STATUS.SERVING ? "#059669"
              : status === QUEUE_STATUS.WAITING ? "#2d3a8c"
              : status === QUEUE_STATUS.DONE    ? "#0891b2"
              : "#dc2626";
            const statusBg =
              status === QUEUE_STATUS.SERVING ? "#d1fae5"
              : status === QUEUE_STATUS.WAITING ? "#eef2ff"
              : status === QUEUE_STATUS.DONE    ? "#e0f2fe"
              : "#fee2e2";
            const statusLabel = status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : "Unknown";

            return (
              <div key={q.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", padding:"12px 14px", borderRadius:"12px", border:"1px solid #e2e8f0", background:"#f8fafc", flexWrap:"wrap" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  <span style={{ fontSize:"13px", fontWeight:700, color:"#1e293b" }}>{q.queue_number ?? "—"}</span>
                  <span style={{ fontSize:"13px", color:"#334155" }}>{getQueueDisplayName(q)}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"999px", background: q.type === "priority" ? "#fff7ed" : "#f3f4f6", color: q.type === "priority" ? "#f97316" : "#64748b" }}>
                    {q.type === "priority" ? "Priority" : "Regular"}
                  </span>
                  <span style={{ fontSize:"11px", fontWeight:700, padding:"3px 10px", borderRadius:"999px", background:statusBg, color:statusColor }}>
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
