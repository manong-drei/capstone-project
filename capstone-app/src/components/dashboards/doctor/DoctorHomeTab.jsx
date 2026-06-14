import StatCard from "@/components/common/StatCard";
import Icon from "@/components/common/AppIcons";
import Footer from "@/components/landing/Footer";
import { getQueueDisplayName } from "@/utils/queueDisplay";

const NAVY   = "#2d3a8c";
const INDIGO = "#4f46e5";

/**
 * DoctorHomeTab
 * The main home view for the doctor: hero, availability toggle, daily capacity,
 * stat cards, and queue panels.
 *
 * Props:
 *   isAvailable, availLoading, onToggleAvailability
 *   capacityCollapsed, setCapacityCollapsed
 *   appointmentLimit, setAppointmentLimit
 *   walkInLimit, setWalkInLimit
 *   bookedCount, walkInCount
 *   walkInPercent, apptPercent, apptFull
 *   settingsLoading, settingsSaved
 *   onApplySettings
 *   waiting, serving, doneQueues, servingQueue, nextQueue, done, priority
 *   queueLoading
 *   onCallNext
 *   onMarkDone
 *   error
 */
export default function DoctorHomeTab({
  isAvailable, availLoading, onToggleAvailability,
  capacityCollapsed, setCapacityCollapsed,
  appointmentLimit, setAppointmentLimit,
  walkInLimit, setWalkInLimit,
  bookedCount, walkInCount,
  walkInPercent, apptPercent, apptFull,
  settingsLoading, settingsSaved, onApplySettings,
  waiting, serving, doneQueues, servingQueue, nextQueue, done, priority,
  queueLoading,
  onCallNext, onMarkDone,
  error,
}) {
  return (
    <>
      {/* Hero */}
      <section style={{ position: "relative", minHeight: "320px", backgroundImage: "url('/assets/BGHero.png')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.42)" }} />
        <div className="dd-hero-pad" style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: "0 0 2px", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            Your Health, Schedule.
          </h1>
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800, color: "#1e4db7", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            No More Long Waits.
          </h1>
          <p style={{ margin: 0, fontSize: "clamp(0.875rem, 2vw, 1rem)", color: "#374151", maxWidth: "540px", lineHeight: 1.6 }}>
            Get your queue number online, check doctor availability, and track your wait time—all from your phone.
          </p>
        </div>
      </section>

      {/* Availability Toggle */}
      <div className="dd-content-pad" style={{ paddingTop: "20px" }}>
        <div style={{ background: "#fff", border: `1.5px solid ${isAvailable ? "#bbf7d0" : "#fecaca"}`, borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: isAvailable ? "#059669" : "#dc2626", flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#111827" }}>Today's Availability</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                {isAvailable ? "You are currently marked as available" : "You are currently marked as unavailable"}
              </p>
            </div>
          </div>
          <button
            onClick={() => !availLoading && onToggleAvailability(!isAvailable)}
            disabled={availLoading}
            style={{ padding: "8px 20px", borderRadius: "99px", border: "none", background: isAvailable ? "#059669" : "#dc2626", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: availLoading ? "not-allowed" : "pointer", opacity: availLoading ? 0.7 : 1, flexShrink: 0, transition: "background 0.2s" }}
          >
            {availLoading ? "Saving..." : isAvailable ? "Available" : "Unavailable"}
          </button>
        </div>
      </div>

      {/* Daily Capacity (collapsible) */}
      <div className="dd-content-pad">
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", overflow: "hidden" }}>
          <button
            onClick={() => setCapacityCollapsed((v) => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: capacityCollapsed ? "none" : "1px solid #f3f4f6" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Icon name="chart" size={18} color={INDIGO} />
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#111827" }}>Daily Capacity</p>
                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Today's patient limits — resets at midnight</p>
              </div>
            </div>
            <span style={{ fontSize: "18px", color: "#9ca3af", transition: "transform 0.2s", transform: capacityCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
          </button>

          {!capacityCollapsed && (
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button
                  onClick={onApplySettings}
                  disabled={settingsLoading}
                  style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: settingsSaved ? "#059669" : INDIGO, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: settingsLoading ? "not-allowed" : "pointer", opacity: settingsLoading ? 0.7 : 1, transition: "background 0.2s" }}
                >
                  {settingsLoading ? "Saving..." : settingsSaved ? "Saved ✓" : "Apply"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                {/* Appointment Limit */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Appointment Limit</label>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: appointmentLimit === 10 ? "#059669" : INDIGO, background: appointmentLimit === 10 ? "#ecfdf5" : "#eef2ff", padding: "2px 10px", borderRadius: "20px" }}>
                      {appointmentLimit === 10 ? "Maximum (10)" : `${appointmentLimit} / 10`}
                    </span>
                  </div>
                  <input type="range" min={0} max={10} value={appointmentLimit} onChange={(e) => setAppointmentLimit(parseInt(e.target.value))} style={{ width: "100%", accentColor: INDIGO, cursor: "pointer" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>
                    <span>0</span><span>10 (max)</span>
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>
                      <span>Appointments today</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{bookedCount} / {appointmentLimit > 0 ? appointmentLimit : "—"}</span>
                    </div>
                    <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "99px", width: `${apptPercent}%`, background: apptPercent >= 100 ? "#dc2626" : apptPercent >= 80 ? "#f97316" : "#059669", transition: "width 0.3s ease" }} />
                    </div>
                    {apptFull && (
                      <p style={{ margin: "8px 0 0", fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: "6px", textAlign: "center" }}>
                        ⚠ SLOTS FULL — No more appointments can be booked today
                      </p>
                    )}
                  </div>
                </div>

                {/* Walk-In Capacity */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Walk-In Capacity</label>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: walkInLimit > 0 ? "#f97316" : "#9ca3af", background: walkInLimit > 0 ? "#fff7ed" : "#f3f4f6", padding: "2px 10px", borderRadius: "20px" }}>
                      {walkInLimit > 0 ? `${walkInLimit} slots` : "Not set"}
                    </span>
                  </div>
                  <input type="number" min={0} max={30} placeholder="0" value={walkInLimit === 0 ? "" : walkInLimit} onChange={(e) => setWalkInLimit(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))} style={{ width: "80px", padding: "6px 10px", borderRadius: "7px", border: "1.5px solid #d1d5db", fontSize: "15px", fontWeight: 600, color: "#111827", outline: "none" }} />
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>
                      <span>Walk-ins today</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{walkInCount} / {walkInLimit > 0 ? walkInLimit : "—"}</span>
                    </div>
                    <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "99px", width: `${walkInPercent}%`, background: walkInPercent >= 100 ? "#dc2626" : walkInPercent >= 80 ? "#f97316" : "#059669", transition: "width 0.3s ease" }} />
                    </div>
                    {walkInLimit > 0 && walkInCount >= walkInLimit && (
                      <p style={{ margin: "8px 0 0", fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: "6px", textAlign: "center" }}>
                        ⚠ SLOTS FULL — No more walk-ins can be accepted today
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Now Queuing / Next Queuing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 dd-content-pad">
        <div style={{ background: "#f97316", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em" }}>Now Queuing</p>
          <p style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {servingQueue ? servingQueue.queue_number : "—"}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>
            {servingQueue ? getQueueDisplayName(servingQueue) : "—"}
          </p>
        </div>
        <div style={{ background: NAVY, borderRadius: "16px", padding: "24px 28px", boxShadow: "0 4px 16px rgba(45,58,140,0.25)" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em" }}>Next Queuing</p>
          <p style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {nextQueue ? nextQueue.queue_number : "—"}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>
            {nextQueue ? getQueueDisplayName(nextQueue) : "—"}
          </p>
        </div>
      </div>

      {/* Stat Cards + Queue detail panels */}
      <div className="dd-content-pad">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ marginBottom: "16px" }}>
          <StatCard icon="users"       label="Waiting"   value={waiting.length}  color={NAVY} />
          <StatCard icon="heart"       label="Serving"   value={serving.length}  color="#059669" />
          <StatCard icon="checkCircle" label="Done"      value={done}            color="#6b7280" />
          <StatCard icon="star"        label="Priority"  value={priority}        color="#f97316" />
        </div>
      </div>

      {/* Queue Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 dd-content-pad">
        {/* Currently Serving */}
        <div style={{ background: "white", borderRadius: "16px", padding: "22px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", letterSpacing: "0.04em" }}>Currently Serving</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#111827" }}>{servingQueue ? servingQueue.queue_number : "—"}</span>
            {servingQueue && <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>{getQueueDisplayName(servingQueue)}</span>}
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "#374151" }}>Reason Consultation</p>
            <div style={{ height: "1.5px", background: "#1e4db7", borderRadius: "2px" }} />
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
            <button
              onClick={() => servingQueue && onMarkDone(servingQueue.id)}
              disabled={serving.length === 0}
              style={{ flex: 1, padding: "10px 8px", borderRadius: "10px", border: "none", background: serving.length > 0 ? NAVY : "#e5e7eb", color: serving.length > 0 ? "white" : "#9ca3af", fontSize: "12px", fontWeight: 700, cursor: serving.length > 0 ? "pointer" : "not-allowed" }}
            >
              Mark as Complete
            </button>
            <button
              onClick={onCallNext}
              disabled={(waiting.length === 0 && !servingQueue) || queueLoading}
              style={{ flex: 1, padding: "10px 8px", borderRadius: "10px", border: "none", background: servingQueue ? "#059669" : waiting.length > 0 ? NAVY : "#e5e7eb", color: servingQueue || waiting.length > 0 ? "white" : "#9ca3af", fontSize: "12px", fontWeight: 700, cursor: (waiting.length > 0 || servingQueue) && !queueLoading ? "pointer" : "not-allowed" }}
            >
              {servingQueue ? "Consult" : "Next"}
            </button>
          </div>
        </div>

        {/* Completed List */}
        <div style={{ background: "white", borderRadius: "16px", padding: "22px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", letterSpacing: "0.04em" }}>Completed List</p>
          {doneQueues.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center" }}>No completed patients yet.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "220px", overflowY: "auto" }}>
              {doneQueues.map((q) => {
                const name = getQueueDisplayName(q);
                const services = Array.isArray(q.services) && q.services.length > 0 ? q.services.join(", ") : "—";
                const completedAt = q.updated_at ? new Date(q.updated_at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true }) : null;
                return (
                  <li key={q.id} style={{ borderBottom: "1px solid #f3f4f6", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "1px 7px", borderRadius: "20px" }}>{q.queue_number}</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{name}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
                      {completedAt && <span style={{ fontSize: "11px", color: "#6b7280" }}>✓ {completedAt}</span>}
                      <span style={{ fontSize: "11px", color: "#374151" }}>{services}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Average Time of Waiting */}
        <div style={{ background: "white", borderRadius: "16px", padding: "22px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "flex-start" }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", width: "100%", letterSpacing: "0.04em" }}>
            Average Time of Waiting
          </p>
        </div>
      </div>

      {/* Name of the Next Patient */}
      <div className="dd-content-pad" style={{ paddingBottom: "32px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "22px", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", letterSpacing: "0.04em" }}>
            Name of the Next Patient
          </p>
          {waiting.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center" }}>No patients in queue.</p>
          ) : (
            <ol style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {waiting.slice(0, 8).map((q) => (
                <li key={q.id} style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                  {getQueueDisplayName(q)}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {error && <p style={{ textAlign: "center", color: "#dc2626", fontSize: "14px", padding: "0 24px 16px" }}>{error}</p>}
      <Footer />
    </>
  );
}
