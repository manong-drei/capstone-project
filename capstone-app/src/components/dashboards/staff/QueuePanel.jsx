import { getQueueDisplayName } from "@/utils/queueDisplay";

const NAVY = "#1e2d6b";
const INDIGO = "#2d3a8c";
const ORANGE = "#f97316";

/**
 * QueuePanel
 * Left column of the staff dashboard. Shows the currently served patient,
 * the list of patients waiting next, and a "Next Queue" button.
 *
 * Props:
 *   currentServing — queue object currently being served, or null
 *   nextQueue      — array of waiting queue objects
 *   onCallNext     — called when staff clicks "Next Queue"
 *   onNoShow       — called when staff marks current patient as no-show
 *   loading        — disables the button while a request is in-flight
 */
export default function QueuePanel({ currentServing, nextQueue, onCallNext, onNoShow, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Now Serving */}
      <div
        style={{
          background: ORANGE,
          borderRadius: "12px",
          padding: "28px 20px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
        }}
      >
        <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Now Serving
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "clamp(32px, 6vw, 46px)", fontWeight: 900, color: "#ffffff", lineHeight: 1, letterSpacing: "-0.01em" }}>
          {currentServing ? `#${String(currentServing.queue_number).padStart(2, "0")}` : "—"}
        </p>
        {currentServing && (
          <p style={{ margin: "6px 0 0", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>
            {getQueueDisplayName(currentServing)}
          </p>
        )}
        {currentServing && (
          <span style={{ display: "inline-block", marginTop: "8px", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.95)", background: "rgba(255,255,255,0.22)", borderRadius: "20px", padding: "3px 12px" }}>
            {currentServing.type === "priority" ? "Priority" : "Regular"}
          </span>
        )}
        {currentServing && (
          <button
            onClick={onNoShow}
            style={{ display: "block", margin: "10px auto 0", padding: "6px 16px", borderRadius: "99px", border: "1.5px solid rgba(255,255,255,0.6)", background: "transparent", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
          >
            No Show
          </button>
        )}
        {!currentServing && (
          <p style={{ margin: "6px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
            No patient being served
          </p>
        )}
      </div>

      {/* Next Serving list */}
      <div style={{ background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#374151" }}>Next Serving</p>
        </div>

        {nextQueue.length === 0 ? (
          <p style={{ margin: 0, padding: "18px 16px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>
            No patients waiting
          </p>
        ) : (
          nextQueue.slice(0, 5).map((q, i) => (
            <div
              key={q.id ?? i}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < Math.min(nextQueue.length, 5) - 1 ? "1px solid #f9fafb" : "none", transition: "background 0.12s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: i === 0 ? INDIGO : "#374151" }}>
                  #{String(q.queue_number).padStart(3, "0")}
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{getQueueDisplayName(q)}</span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: q.type === "priority" ? ORANGE : "#6b7280", background: q.type === "priority" ? "#fff7ed" : "#f3f4f6", borderRadius: "10px", padding: "2px 8px" }}>
                {q.type === "priority" ? "Priority" : "Regular"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Next Queue button */}
      <button
        onClick={onCallNext}
        disabled={loading || nextQueue.length === 0}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "12px",
          border: "none",
          background: nextQueue.length === 0 ? "#d1d5db" : `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 100%)`,
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: 700,
          cursor: loading || nextQueue.length === 0 ? "not-allowed" : "pointer",
          opacity: nextQueue.length === 0 ? 0.6 : 1,
          boxShadow: nextQueue.length > 0 ? "0 4px 16px rgba(45,58,140,0.35)" : "none",
          transition: "transform 0.15s, box-shadow 0.15s",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          if (nextQueue.length > 0 && !loading) {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(45,58,140,0.45)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = nextQueue.length > 0 ? "0 4px 16px rgba(45,58,140,0.35)" : "none";
        }}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <svg className="ek-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            Processing...
          </span>
        ) : (
          "Next Queue"
        )}
      </button>
    </div>
  );
}
