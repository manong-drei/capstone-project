import StatCard from "@/components/common/StatCard";
import Footer from "@/components/landing/Footer";

const NAVY   = "#2d3a8c";
const INDIGO = "#4f46e5";

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
  return (
    <>
      <div className="dd-tab-pad" style={{ flex: 1, maxWidth: "960px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>
              Today's Analytics
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard icon="users"       label="Waiting"              value={waiting.length}          color={NAVY} />
            <StatCard icon="heart"       label="Serving"              value={serving.length}          color="#059669" />
            <StatCard icon="checkCircle" label="Completed"            value={done}                    color="#6b7280" />
            <StatCard icon="star"        label="Priority"             value={priority}                color="#f97316" />
            <StatCard icon="appointment" label="Appointments Today"   value={bookedCount}             color={INDIGO} />
            <StatCard icon="queue"       label="Walk-ins Today"       value={walkInCount}             color="#f97316" />
            <StatCard icon="users"       label="Total Patients Today" value={bookedCount + walkInCount} color="#1a3a8f" />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
