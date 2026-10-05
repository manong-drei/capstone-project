import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatusBadge from "@/components/common/StatusBadge";
import StaffManager from "./StaffManager";
import PatientManager from "./PatientManager";

const BLUE = "#1a3a8f";
const BLUE2 = "#1e4db7";
const ORANGE = "#f97316";

const AGE_COLORS = [
  "#1e4db7",
  "#60a5fa",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#eab308",
  "#64748b",
  "#94a3b8",
];
const AGE_GROUPS = [
  "0–11 months",
  "1–4 years",
  "5–9 years",
  "10–14 years",
  "15–19 years",
  "20–59 years",
  "60+ years",
  "Unknown",
];
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function buildVolumeData(rows, period) {
  const today = new Date();
  const sum = (start, end) =>
    rows.reduce(
      (total, row) =>
        total +
        (row.day >= dateKey(start) && row.day < dateKey(end)
          ? Number(row.count)
          : 0),
      0,
    );
  const count = period === "Monthly" ? 12 : period === "Weekly" ? 8 : 7;
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - ((today.getDay() + 6) % 7),
  );
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const start =
      period === "Monthly"
        ? new Date(today.getFullYear(), today.getMonth() - offset, 1)
        : period === "Weekly"
          ? new Date(
              monday.getFullYear(),
              monday.getMonth(),
              monday.getDate() - offset * 7,
            )
          : new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() - offset,
            );
    const end =
      period === "Monthly"
        ? new Date(start.getFullYear(), start.getMonth() + 1, 1)
        : new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + (period === "Weekly" ? 7 : 1),
          );
    return {
      label: start.toLocaleDateString(
        "en-PH",
        period === "Monthly"
          ? { month: "short", year: "2-digit" }
          : { month: "short", day: "numeric" },
      ),
      count: sum(start, end),
    };
  });
}

const notificationsPlaceholder = [
  {
    id: 1,
    title: "New appointment request",
    body: "Juan Dela Cruz booked for Apr 22.",
    time: "2 min ago",
  },
  {
    id: 2,
    title: "Doctor went on leave",
    body: "Dr. Santos marked absent today.",
    time: "15 min ago",
  },
  {
    id: 3,
    title: "Queue threshold reached",
    body: "Queue exceeded 30 patients today.",
    time: "1 hr ago",
  },
  {
    id: 4,
    title: "Monthly report ready",
    body: "March analytics are now available.",
    time: "1 day ago",
  },
];

const formatAppointmentDate = (value, withYear = true) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
};
const formatAppointmentTime = (value) =>
  value
    ? new Date(`2000-01-01T${value}`).toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";
const formatDoctorName = (appt) => {
  const name =
    `Dr. ${appt?.doctor_first_name ?? ""} ${appt?.doctor_last_name ?? ""}`.trim();
  return name === "Dr." ? "—" : name;
};
const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch {
    /* fall through */
  }
  return (
    appt?.cancellation_reason ||
    (appt?.reason === "Same-day queue registration" ? "—" : appt?.reason) ||
    "—"
  );
};

/**
 * AdminOverviewTab
 * The main "Dashboard" tab shown when an admin first lands on the dashboard.
 *
 * Props:
 *   overview          — overview data object from /admin/overview
 *   ovLoading         — boolean
 *   doctors           — array of doctor objects
 *   recentAppointments — first 5 appointments
 *   apptLoading       — boolean
 */
export default function AdminOverviewTab({
  overview,
  ovLoading,
  doctors,
  recentAppointments,
  apptLoading,
}) {
  const [accountTab, setAccountTab] = useState("Staff");
  const [volumeTab, setVolumeTab] = useState("Monthly");
  const dentalAges = (overview?.dentalAgeGroups ?? [])
    .map((row) => ({
      name: row.age_group,
      value: Number(row.count),
      color: AGE_COLORS[AGE_GROUPS.indexOf(row.age_group)] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value);
  const dentalTotal = dentalAges.reduce((sum, row) => sum + row.value, 0);
  const volumeData = buildVolumeData(overview?.volumeDaily ?? [], volumeTab);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Hero */}
      <div
        style={{
          borderRadius: "20px",
          overflow: "hidden",
          position: "relative",
          minHeight: "140px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/assets/BGHero.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.42)",
          }}
        />
        <div className="ad-hero-pad" style={{ position: "relative" }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#475569",
            }}
          >
            Admin Panel
          </p>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: 800,
              color: BLUE,
            }}
          >
            {new Date().getHours() < 12
              ? "Good Morning"
              : new Date().getHours() < 18
                ? "Good Afternoon"
                : "Good Evening"}
            !
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Patient Visits",
            value: ovLoading ? "—" : (overview?.totalPatients ?? 0),
            bg: BLUE,
          },
          {
            label: "Total Doctors",
            value: ovLoading ? "—" : (overview?.totalDoctors ?? 0),
            bg: "#0891b2",
          },
          {
            label: "Total Appointments",
            value: ovLoading ? "—" : (overview?.totalAppointments ?? 0),
            bg: ORANGE,
          },
          {
            label: "Total Queues Completed",
            value: ovLoading ? "—" : (overview?.completedQueues ?? 0),
            bg: "#059669",
          },
        ].map(({ label, value, bg }) => (
          <div
            key={label}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "18px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              borderTop: `4px solid ${bg}`,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "26px", fontWeight: 800, color: bg }}>
              {value}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Dental age distribution + Patient Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              margin: "0 0 5px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            Dental Queues by Age Group
          </h3>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748b" }}>
            All recorded dental queues · most common age group:{" "}
            {dentalAges.find((row) => row.name !== "Unknown")?.name ?? "—"}
          </p>
          {ovLoading ? (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              Loading age groups...
            </p>
          ) : dentalTotal === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              No dental queues recorded yet.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={dentalAges}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dentalAges.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} queues`,
                      "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {dentalAges.map((d) => {
                  const pct = ((d.value / dentalTotal) * 100).toFixed(1);
                  return (
                    <div
                      key={d.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: d.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#475569",
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.name}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#1e293b",
                          flexShrink: 0,
                        }}
                      >
                        {d.value.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="ad-section-pad"
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Patient Volume
            </h3>
            <div style={{ display: "flex", gap: "4px" }}>
              {["Monthly", "Weekly", "Daily"].map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={volumeTab === t}
                  onClick={() => setVolumeTab(t)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: volumeTab === t ? BLUE : "#f1f5f9",
                    color: volumeTab === t ? "#fff" : "#64748b",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <p
            style={{
              margin: "-8px 0 12px",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            All queue visits · last{" "}
            {volumeTab === "Monthly"
              ? "12 months"
              : volumeTab === "Weekly"
                ? "8 weeks"
                : "7 days"}
          </p>
          {ovLoading ? (
            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              Loading patient volume...
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={volumeData} barSize={18}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  interval={volumeTab === "Monthly" ? 1 : 0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} queues`,
                    "Patient volume",
                  ]}
                />
                <Bar dataKey="count" fill={BLUE2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Doctors Profile */}
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
            margin: "0 0 14px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          Doctors Profile
        </h3>
        {doctors.length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            No doctors registered yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {doctors.map((d) => (
              <div
                key={d.doctor_id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Dr. {d.first_name} {d.last_name}
                </span>
                <StatusBadge
                  status={d.is_available ? "available" : "on_leave"}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Patient History */}
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
            margin: "0 0 14px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          Patient History
        </h3>
        {apptLoading ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            Loading recent history...
          </p>
        ) : recentAppointments.length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            No appointments recorded yet.
          </p>
        ) : (
          <>
            <div className="ad-hide-on-mobile" style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    {[
                      "Patient",
                      "Date",
                      "Time",
                      "Doctor",
                      "Service",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appt) => (
                    <tr
                      key={appt.appointment_id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td
                        style={{
                          padding: "10px 12px",
                          color: "#1e293b",
                          fontWeight: 500,
                        }}
                      >
                        {appt.patient_full_name || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {formatAppointmentDate(appt.appointment_date)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {formatAppointmentTime(appt.appointment_time)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {formatDoctorName(appt)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>
                        {formatServices(appt)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ad-show-on-mobile">
              {recentAppointments.map((appt) => (
                <div
                  key={appt.appointment_id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {appt.patient_full_name || "—"}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {formatDoctorName(appt)}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {formatServices(appt)}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {formatAppointmentDate(appt.appointment_date)} at{" "}
                    {formatAppointmentTime(appt.appointment_time)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Account Management */}
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
            margin: "0 0 14px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          Account Management
        </h3>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {["Staff", "Patients"].map((t) => (
            <button
              key={t}
              onClick={() => setAccountTab(t)}
              style={{
                padding: "8px 22px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                background: accountTab === t ? BLUE : "#f1f5f9",
                color: accountTab === t ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {accountTab === "Staff" ? <StaffManager /> : <PatientManager />}
      </div>

      {/* Notifications */}
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
            margin: "0 0 14px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          Notifications
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {notificationsPlaceholder.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex",
                gap: "12px",
                padding: "12px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "16px",
                }}
              >
                🔔
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  {n.title}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                  {n.body}
                </p>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  flexShrink: 0,
                  alignSelf: "flex-start",
                }}
              >
                {n.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
