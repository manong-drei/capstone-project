import { useState } from "react";
import StatCard from "@/components/common/StatCard";
import { Footer } from "@/pages/LandingPage";

const NAVY   = "#2d3a8c";
const INDIGO = "#4f46e5";
const AGE_GROUPS = ["0–11 months", "1–4 years", "5–9 years", "10–14 years", "15–19 years", "20–59 years", "60+ years"];

/**
 * DoctorAnalyticsTab
 * A simple grid of today's queue and appointment stats.
 *
 * Props:
 *   waiting     — waiting queue entries array
 *   serving     — serving queue entries array
 *   done        — count of completed queue entries
 *   priority    — count of priority queue entries
 *   bookedCount — appointment bookings today
 *   walkInCount — walk-in patients today
 *   onBack      — callback to return to home tab
 */
export default function DoctorAnalyticsTab({ waiting, serving, done, priority, bookedCount, walkInCount, onBack }) {
  const [period, setPeriod] = useState("Today");

  return (
    <>
      <div className="dd-tab-pad" style={{ flex: 1, maxWidth: "960px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>Doctor Analytics</h2>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} aria-label="Analytics period">
            {["Today", "Weekly", "Monthly"].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={period === option}
                onClick={() => setPeriod(option)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #d1d5db", background: period === option ? NAVY : "#fff", color: period === option ? "#fff" : "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                {option}
              </button>
            ))}
          </div>
          {period === "Today" ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard icon="users"       label="Waiting"              value={waiting.length}          color={NAVY} />
            <StatCard icon="heart"       label="Serving"              value={serving.length}          color="#059669" />
            <StatCard icon="checkCircle" label="Completed"            value={done}                    color="#6b7280" />
            <StatCard icon="star"        label="Priority"             value={priority}                color="#f97316" />
            <StatCard icon="appointment" label="Appointments Today"   value={bookedCount}             color={INDIGO} />
            <StatCard icon="queue"       label="Walk-ins Today"       value={walkInCount}             color="#f97316" />
            <StatCard icon="users"       label="Total Patients Today" value={bookedCount + walkInCount} color="#1a3a8f" />
          </div> : <div style={{ padding: "28px", borderRadius: "12px", border: "1px dashed #cbd5e1", background: "#fff", color: "#64748b", fontSize: "13px" }}>
            {period} analytics will appear here when period data is connected.
          </div>}

          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#111827" }}>Dental Queue Age Groups</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Age groups of patients queued for dental service · {period.toLowerCase()}</p>
              </div>
              <button type="button" disabled title="Printing will be available when age group reports are connected" style={{ padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#f3f4f6", color: "#6b7280", fontSize: "12px", fontWeight: 600, cursor: "not-allowed" }}>
                Print today's age group report · Coming soon
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" style={{ marginTop: "18px" }}>
              {AGE_GROUPS.map((group) => (
                <div key={group} style={{ padding: "12px", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#374151", fontSize: "12px", fontWeight: 600 }}>
                  {group}
                </div>
              ))}
            </div>
            <p style={{ margin: "16px 0 0", fontSize: "12px", color: "#64748b" }}>Age group counts will appear here when dental queue data is connected.</p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
