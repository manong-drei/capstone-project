import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import api from "@/services/api";

const BLUE = "#1a3a8f";
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
 * Statistics & Analytics tab: queue stats and BOHC forecasts.
 *
 * Props:
 *   overview   — overview data object from /admin/overview
 *   ovLoading  — boolean
 */
export default function AdminReportsTab({ overview, ovLoading }) {
  const [bohcForecast, setBohcForecast] = useState([]);
  const [bohcHistory, setBohcHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");

  useEffect(() => {
    api
      .get("/admin/bohc-forecast")
      .then((data) => {
        setBohcForecast(data.forecasts ?? []);
        setBohcHistory(data.history ?? []);
      })
      .catch((error) => setForecastError(error.message))
      .finally(() => setForecastLoading(false));
  }, []);

  const years = [...new Set(bohcHistory.map((row) => row.year))].sort((a, b) => b - a);
  const isForecast = selectedYear === 2026;
  const chartData = bohcForecast.map((row) => {
    const actual = bohcHistory.find((item) => item.year === selectedYear && item.age_group === row.age_group);
    return {
      age_group: row.age_group,
      recipients: isForecast ? Number(row.actual_2025) : actual?.recipients,
      forecast: isForecast ? Number(row.forecast_2026) : undefined,
      lower: isForecast ? Number(row.lower_95) : undefined,
      upper: isForecast ? Number(row.upper_95) : undefined,
    };
  });
  const synthetic = !isForecast && bohcHistory.some((row) => row.year === selectedYear && row.is_synthetic);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2
          style={{
            margin: "0 0 4px",
            fontSize: "20px",
            fontWeight: 800,
            color: BLUE,
          }}
        >
          Statistics & Analytics
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Queue performance, service breakdowns, and forecasting insights.
        </p>
      </div>

      {/* Queue Statistics */}
      <div
        className="ad-section-pad"
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: "15px",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          Queue Statistics
        </h3>

        <p
          style={{
            margin: "0 0 12px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Today
        </p>
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          style={{ marginBottom: "24px" }}
        >
          {[
            {
              label: "Waiting",
              value: ovLoading ? "—" : (overview?.activeQueues ?? 0),
              color: "#2d3a8c",
              bg: "#eef2ff",
            },
            {
              label: "Serving",
              value: ovLoading ? "—" : (overview?.serving ?? 0),
              color: "#059669",
              bg: "#d1fae5",
            },
            {
              label: "Done",
              value: ovLoading ? "—" : (overview?.doneToday ?? 0),
              color: "#0891b2",
              bg: "#e0f2fe",
            },
            {
              label: "Cancelled",
              value: ovLoading ? "—" : (overview?.cancelled ?? 0),
              color: "#dc2626",
              bg: "#fee2e2",
            },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              style={{
                background: bg,
                borderRadius: "14px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: 800, color }}>
                {value}
              </span>
              <span style={{ fontSize: "12px", color, opacity: 0.8 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <p
          style={{
            margin: "0 0 12px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Weekly Trend
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={queueStatsData} barSize={28}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {queueStatsData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Predictive Analytics */}
      <div
        className="ad-section-pad"
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: "0 0 5px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
              BOHC recipients by age group
            </h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
              Select a year to see every age group, or view the next annual prediction.
            </p>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
            Year
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              disabled={forecastLoading || !!forecastError}
              style={{ padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", color: "#1e293b" }}
            >
              <option value={2026}>2026 prediction</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>
        {forecastLoading ? (
          <p
            role="status"
            style={{ padding: "24px 0", color: "#64748b", fontSize: "13px" }}
          >
            Loading forecast…
          </p>
        ) : forecastError ? (
          <p
            role="alert"
            style={{
              padding: "16px",
              borderRadius: "10px",
              background: "#fff7ed",
              color: "#9a3412",
              fontSize: "13px",
            }}
          >
            Forecast results are unavailable. Run the ARIMA training script,
            then refresh this page.
          </p>
        ) : (
          <>
            <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b" }}>
              {isForecast
                ? "2026 ARIMA prediction compared with 2025 actual recipients. Dashed lines show the 95% prediction interval."
                : `${selectedYear} recipient counts${synthetic ? " · synthetic teaching data, not facility records" : " · recorded data"}.`}
            </p>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: "620px", height: "350px" }} role="img" aria-label={`Line graph of BOHC recipients by age group for ${selectedYear}${isForecast ? " prediction compared with 2025 actuals" : ""}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 28, left: 10 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="age_group" tickFormatter={(value) => value.match(/\d+(?:-\d+)?/)?.[0] ?? value} tick={{ fontSize: 11, fill: "#475569" }} label={{ value: "Age group (years; first group in months)", position: "insideBottom", offset: -18, fontSize: 11, fill: "#64748b" }} />
                    <YAxis tickFormatter={(value) => Number(value).toLocaleString()} tick={{ fontSize: 11, fill: "#475569" }} width={58} label={{ value: "Recipients", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      labelFormatter={(value) => value}
                      formatter={(value, name) => [Number(value).toLocaleString(), name]}
                      contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                    />
                    {isForecast && <Line type="linear" dataKey="lower" name="95% lower" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />}
                    {isForecast && <Line type="linear" dataKey="upper" name="95% upper" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />}
                    <Line type="linear" dataKey="recipients" name={isForecast ? "2025 actual" : `${selectedYear} recipients`} stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    {isForecast && <Line type="linear" dataKey="forecast" name="2026 prediction" stroke={BLUE2} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#64748b" }}>
              {isForecast
                ? "Green: 2025 actual · Blue: 2026 prediction · Gray: 95% interval. Forecast training includes synthetic data from 2014–2019."
                : "Hover or tap a point to see its full age group and count."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
