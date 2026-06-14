import Icon from "@/components/common/AppIcons";
import QueueStatus from "./QueueStatus";
import Footer from "@/components/landing/Footer";

const ORANGE = "#f97316";
const NAVY   = "#2d3a8c";

/**
 * PatientHomeTab
 * Hero, Now/Next queuing banners, action buttons, info cards, and footer.
 *
 * Props:
 *   queueStatus        — { now_serving, now_serving_name, next_queuing, next_queuing_name }
 *   doctorAvailability — 1 | 0 | null
 *   hasActiveQueue     — boolean
 *   queue              — current queue object (or null)
 *   myQueueSubtitle    — formatted subtitle string
 *   onGetQueue         — open the GetQueueModal
 *   onCancelQueue      — cancel the active queue
 *   onGoAppointments   — navigate to appointments tab
 */
export default function PatientHomeTab({
  queueStatus, doctorAvailability,
  hasActiveQueue, queue, myQueueSubtitle,
  onGetQueue, onCancelQueue, onGoAppointments,
}) {
  return (
    <>
      {/* Hero */}
      <section style={{ position: "relative", minHeight: "380px", backgroundImage: "url('/assets/BGHero.png')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.42)" }} />
        <div className="pd-hero-pad" style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: "0 0 2px", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            Your Health, Schedule.
          </h1>
          <h1 style={{ margin: "0 0 20px", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, color: "#1e4db7", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            No More Long Waits.
          </h1>
          <p style={{ margin: 0, fontSize: "clamp(0.875rem, 2vw, 1rem)", color: "#374151", maxWidth: "540px", lineHeight: 1.6 }}>
            Get your queue number online, check doctor availability, and track your wait time—all from your phone.
          </p>
        </div>
      </section>

      {/* Now Queuing / Next Queuing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pd-content-pad">
        <div style={{ background: ORANGE, marginTop: "20px", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em" }}>Now Queuing</p>
          <p style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>{queueStatus.now_serving ?? "—"}</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>{queueStatus.now_serving_name ?? "—"}</p>
        </div>
        <div style={{ background: NAVY, borderRadius: "16px", padding: "24px 28px", boxShadow: "0 4px 16px rgba(45,58,140,0.25)", marginTop: "20px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em" }}>Next Queuing</p>
          <p style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>{queueStatus.next_queuing ?? "—"}</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>{queueStatus.next_queuing_name ?? "—"}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pd-actions" style={{ background: "#f3f4f6", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={onGetQueue}
          disabled={hasActiveQueue}
          className="pd-action-btn"
          style={{ flex: "1 1 220px", maxWidth: "340px", padding: "22px 32px", borderRadius: "16px", border: "none", background: ORANGE, color: "white", fontSize: "15px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: hasActiveQueue ? "not-allowed" : "pointer", opacity: hasActiveQueue ? 0.65 : 1, boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}
        >
          GET QUEUE NUMBER
        </button>
        <button
          onClick={onGoAppointments}
          className="pd-action-btn"
          style={{ flex: "1 1 220px", maxWidth: "340px", padding: "22px 32px", borderRadius: "16px", border: "none", background: "#e5e7eb", color: "#374151", fontSize: "15px", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}
        >
          APPOINTMENT HISTORY
        </button>
      </div>

      {/* Active Queue Alert */}
      {hasActiveQueue && (
        <div className="pd-content-pad" style={{ paddingBottom: 8 }}>
          <QueueStatus queue={queue} onCancel={onCancelQueue} />
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pd-content-pad">
        {/* My Queue Number */}
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", borderLeft: "4px solid #f97316", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "relative", minHeight: "130px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em" }}>MY QUEUE NUMBER</p>
          <p style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 800, color: "#f97316" }}>{hasActiveQueue ? queue.queue_number : "—"}</p>
          <p style={{ margin: 0, fontSize: "12px", color: "#374151", fontWeight: 600 }}>{myQueueSubtitle}</p>
          <div style={{ position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px", borderRadius: "50%", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="user" size={18} color="#f97316" />
          </div>
        </div>

        {/* Est. Wait Time */}
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", borderLeft: "4px solid #1e4db7", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "relative", minHeight: "130px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.12em" }}>EST. WAIT TIME</p>
          <p style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 800, color: "#1e4db7" }}>~15 min</p>
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>Based on current queue</p>
          <div style={{ position: "absolute", top: "16px", right: "16px", width: "36px", height: "36px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="clock" size={18} color="#1e4db7" />
          </div>
        </div>

        {/* Doctor Availability */}
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", borderLeft: doctorAvailability === null ? "4px solid #d1d5db" : doctorAvailability !== 0 ? "4px solid #059669" : "4px solid #dc2626", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "130px", gap: "8px" }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Doctor Availability</p>
          {doctorAvailability === null ? (
            <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>—</p>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "99px", fontSize: "14px", fontWeight: 700, background: doctorAvailability !== 0 ? "#dcfce7" : "#fee2e2", color: doctorAvailability !== 0 ? "#059669" : "#dc2626" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: doctorAvailability !== 0 ? "#059669" : "#dc2626", flexShrink: 0 }} />
              {doctorAvailability !== 0 ? "Available Today" : "Unavailable Today"}
            </span>
          )}
        </div>

        {/* Appointment History */}
        <div onClick={onGoAppointments} style={{ background: "white", borderRadius: "16px", padding: "20px", borderLeft: "4px solid #1e4db7", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "130px", cursor: "pointer" }}>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", textAlign: "center" }}>Appointment<br />History</p>
        </div>

        {/* Location */}
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", borderLeft: "4px solid #1e1b4b", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "130px" }}>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", textAlign: "center" }}>Location</p>
        </div>

        {/* CHO Service */}
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", borderLeft: "4px solid #f97316", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "130px" }}>
          <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827", textAlign: "center" }}>CHO SERVICE</p>
        </div>
      </div>

      <Footer />
    </>
  );
}
