import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import ReportsPanel from "./ReportsPanel";

const BLUE  = "#1a3a8f";
const BLUE2 = "#1e4db7";

const queueStatsData = [
  { day: "Mon", count: 25, color: "#60a5fa" },
  { day: "Tue", count: 65, color: "#2dd4bf" },
  { day: "Wed", count: 40, color: "#1e1b4b" },
  { day: "Thu", count: 75, color: "#93c5fd" },
  { day: "Fri", count: 20, color: "#c084fc" },
  { day: "Sat", count: 55, color: "#4ade80" },
];

/**
 * AdminReportsTab
 * Statistics & Analytics tab: queue stats, descriptive analytics, predictive placeholder.
 *
 * Props:
 *   overview   — overview data object from /admin/overview
 *   ovLoading  — boolean
 */
export default function AdminReportsTab({ overview, ovLoading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800, color: BLUE }}>
          Statistics & Analytics
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Queue performance, service breakdowns, and forecasting insights.
        </p>
      </div>

      {/* Queue Statistics */}
      <div className="ad-section-pad" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
          Queue Statistics
        </h3>

        <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px" }}>
          Today
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: "24px" }}>
          {[
            { label: "Waiting",   value: ovLoading ? "—" : (overview?.activeQueues ?? 0), color: "#2d3a8c", bg: "#eef2ff" },
            { label: "Serving",   value: ovLoading ? "—" : (overview?.serving ?? 0),      color: "#059669", bg: "#d1fae5" },
            { label: "Done",      value: ovLoading ? "—" : (overview?.doneToday ?? 0),    color: "#0891b2", bg: "#e0f2fe" },
            { label: "Cancelled", value: ovLoading ? "—" : (overview?.cancelled ?? 0),    color: "#dc2626", bg: "#fee2e2" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color }}>{value}</span>
              <span style={{ fontSize: "12px", color, opacity: 0.8 }}>{label}</span>
            </div>
          ))}
        </div>

        <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px" }}>
          Weekly Trend
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={queueStatsData} barSize={28}>
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {queueStatsData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Descriptive Analytics */}
      <div className="ad-section-pad" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
          Descriptive Analytics
        </h3>
        <ReportsPanel />
      </div>

      {/* Predictive Analytics */}
      <div className="ad-section-pad" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
          Predictive Analytics
        </h3>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "40px 24px", borderRadius: "14px", background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)", border: "1.5px dashed #bfdbfe", textAlign: "center" }}>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
              Forecasting Models Coming Soon
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b", maxWidth: "380px", lineHeight: "1.6" }}>
              This section will include patient volume predictions, appointment trend analysis, and queue load forecasting based on historical data.
            </p>
          </div>
          <span style={{ padding: "4px 14px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, background: "#dbeafe", color: BLUE, letterSpacing: "0.5px" }}>
            COMING SOON
          </span>
        </div>
      </div>
    </div>
  );
}
