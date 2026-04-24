import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboardIdentity } from "../hooks/useDashboardIdentity";
import { ROUTES } from "../constants/routes";
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

import DashboardProfileMenu from "../components/common/DashboardProfileMenu";
import StaffManager from "../components/dashboards/admin/StaffManager";
import PatientManager from "../components/dashboards/admin/PatientManager";
import ReportsPanel from "../components/dashboards/admin/ReportsPanel";
import api from "../services/api";
import { SERVICES, QUEUE_STATUS } from "../constants/services";
import * as appointmentService from "../services/appointmentService";
import { getQueueDisplayName } from "../utils/queueDisplay";

const formatDoctorName = (appt) => {
  const name =
    `Dr. ${appt?.doctor_first_name ?? ""} ${appt?.doctor_last_name ?? ""}`.trim();
  return name === "Dr." ? "—" : name;
};

const formatAppointmentDate = (value, withYear = true) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
};

const formatAppointmentTime = (value) => {
  if (!value) return "—";
  return new Date(`2000-01-01T${value}`).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch {
    /* fall through */
  }
  return appt?.reason || "—";
};

/* ─── Palette ─────────────────────────────────────────────── */
const BLUE = "#1a3a8f";
const BLUE2 = "#1e4db7";
const ORANGE = "#f97316";
const NAVY = "#2d3a8c";

/* ─── Responsive CSS ───────────────────────────────────────── */
const ADMIN_RESPONSIVE_CSS = `
  .ad-nav { padding: 0 24px; }
  .ad-hamburger { display: none; }
  .ad-sidebar-backdrop { display: none; }
  .ad-main { padding: 24px; }
  .ad-hero-pad { padding: 28px 32px; }
  .ad-section-pad { padding: 20px; }
  .ad-tab-pad { padding: 24px; }
  @media (max-width: 900px) {
    .ad-nav { padding: 0 14px !important; }
    .ad-brand-text { font-size: 14px !important; letter-spacing: 0.3px !important; }
    .ad-nav-btn { padding: 6px 10px !important; font-size: 12px !important; }
    .ad-hamburger { display: flex !important; }
    .ad-sidebar {
      position: fixed !important;
      top: 64px !important;
      left: 0 !important;
      height: calc(100vh - 64px) !important;
      z-index: 99 !important;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      box-shadow: 4px 0 16px rgba(0,0,0,0.18);
    }
    .ad-sidebar-open { transform: translateX(0) !important; }
    .ad-sidebar-backdrop-active {
      display: block !important;
      position: fixed;
      inset: 64px 0 0 0;
      background: rgba(15,23,42,0.45);
      z-index: 98;
    }
    .ad-main { padding: 14px !important; }
    .ad-hero-pad { padding: 22px 18px !important; }
    .ad-section-pad { padding: 16px !important; }
    .ad-tab-pad { padding: 16px !important; }
    .ad-hide-on-mobile { display: none !important; }
    .ad-show-on-mobile { display: flex !important; flex-direction: column; gap: 10px; }
  }
  @media (min-width: 901px) {
    .ad-show-on-mobile { display: none !important; }
  }
`;

const adminHamburgerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "38px",
  height: "38px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.18)",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  marginRight: "8px",
  flexShrink: 0,
};

/* ─── Department Distribution: derive from SERVICES constant ─ */
const GROUP_NAME_MAP = {
  "Restoration (Tooth Filling)": "Restoration",
  "Removable Partial Denture (Vitaflex)": "Prosthetics / RPD",
  "Dental Surgery": "Dental Surgery",
};
const GROUP_COLORS = {
  General: ["#60a5fa", "#93c5fd", "#4ade80", "#2d3a8c", "#bfdbfe", "#dbeafe"],
  Restoration: ["#c084fc", "#a855f7"],
  "Prosthetics / RPD": ["#34d399", "#10b981"],
  "Dental Surgery": ["#fb923c", "#f97316", "#ea580c"],
};
const PLACEHOLDER_USAGE = {
  CONSULTATION: 42,
  ORAL_PROPHYLAXIS: 28,
  PERMANENT_FILLING: 15,
  TEMPORARY_FILLING: 12,
  FLUORIDE: 10,
  SILVER_DIAMINE: 5,
  RPD_UPPER: 8,
  RPD_LOWER: 6,
  CLOSED_EXTRACTION: 25,
  OPEN_EXTRACTION: 18,
  ODONTECTOMY: 10,
  SPECIAL_SURGERY: 7,
  OTHERS: 4,
};
function buildDeptServices() {
  const grouped = {};
  SERVICES.forEach((s) => {
    const dept = s.group ? (GROUP_NAME_MAP[s.group] ?? s.group) : "General";
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(s);
  });
  const result = {};
  Object.entries(grouped).forEach(([dept, svcs]) => {
    const colors = GROUP_COLORS[dept] ?? [
      "#60a5fa",
      "#93c5fd",
      "#4ade80",
      "#2d3a8c",
    ];
    result[dept] = svcs.map((s, i) => ({
      name: s.label,
      value: PLACEHOLDER_USAGE[s.id] ?? 5,
      color: colors[i % colors.length],
    }));
  });
  return result;
}
const departmentServices = buildDeptServices();
const DEPARTMENTS = Object.keys(departmentServices);

/* ─── Chart / Sidebar data (static placeholders) ──────────── */

const queueStatsData = [
  { day: "Mon", count: 25, color: "#60a5fa" },
  { day: "Tue", count: 65, color: "#2dd4bf" },
  { day: "Wed", count: 40, color: "#1e1b4b" },
  { day: "Thu", count: 75, color: "#93c5fd" },
  { day: "Fri", count: 20, color: "#c084fc" },
  { day: "Sat", count: 55, color: "#4ade80" },
];

const volumeDataMap = {
  Daily: [
    { d: "Mon", v: 12 },
    { d: "Tue", v: 18 },
    { d: "Wed", v: 9 },
    { d: "Thu", v: 22 },
    { d: "Fri", v: 15 },
    { d: "Sat", v: 7 },
  ],
  Weekly: [
    { d: "W1", v: 80 },
    { d: "W2", v: 95 },
    { d: "W3", v: 70 },
    { d: "W4", v: 110 },
  ],
  Monthly: [
    { d: "Jan", v: 320 },
    { d: "Feb", v: 290 },
    { d: "Mar", v: 340 },
    { d: "Apr", v: 305 },
  ],
};

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

const sidebarItems = [
  { label: "Dashboard", tab: "overview" },
  { label: "Queue Monitor", tab: "queuemonitor" },
  { label: "Statistics/Analytics", tab: "reports" },
  { label: "Doctors", tab: "doctors" },
  { label: "Patients History", tab: "patientshistory" },
  { label: "Notifications", tab: "notifications" },
  { label: "Accounts", tab: "staff" },
];

/* ─── Tiny helpers ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const normalized = String(status ?? "").toLowerCase();
  const ok =
    normalized === "available" ||
    normalized === "done" ||
    normalized === "completed" ||
    normalized === "confirmed";
  const warning = normalized === "pending";
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: "99px",
        fontSize: "11px",
        fontWeight: 600,
        background: ok ? "#dcfce7" : warning ? "#fef9c3" : "#fee2e2",
        color: ok ? "#15803d" : warning ? "#92400e" : "#b91c1c",
      }}
    >
      {normalized === "available"
        ? "Available"
        : normalized === "on_leave"
          ? "On Leave"
          : normalized
            ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
            : "—"}
    </span>
  );
}

/* ─── Main Component ───────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();

  const [activeTab, setActiveTab] = useState("overview");
  const [accountTab, setAccountTab] = useState("Staff");
  const [volumeTab, setVolumeTab] = useState("Daily");
  const [overview, setOverview] = useState(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [queueMonitor, setQueueMonitor] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueCategoryFilter, setQueueCategoryFilter] = useState("general");

  const fetchAppointments = async () => {
    setApptLoading(true);
    try {
      const res = await appointmentService.getAllAppointments();
      setAppointments(res?.data ?? []);
    } catch {
      setAppointments([]);
    } finally {
      setApptLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchDoctors();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (activeTab !== "patientshistory") return;
    fetchAppointments();
  }, [activeTab]);

  const fetchOverview = async () => {
    setOvLoading(true);
    try {
      const data = await api.get("/admin/overview");
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setOvLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await api.get("/doctor");
      setDoctors(data?.data ?? []);
    } catch {
      /* silently ignore */
    }
  };

  const fetchQueueMonitor = async () => {
    setQueueLoading(true);
    try {
      const data = await api.get("/queue");
      setQueueMonitor(Array.isArray(data) ? data : []);
    } catch {
      setQueueMonitor([]);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "queuemonitor") return;
    fetchQueueMonitor();
    const interval = setInterval(fetchQueueMonitor, 15_000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const completedAppointments = appointments.filter(
    (appt) => appt.status === "completed",
  ).length;
  const pendingAppointments = appointments.filter(
    (appt) => appt.status === "pending",
  ).length;
  const confirmedAppointments = appointments.filter(
    (appt) => appt.status === "confirmed",
  ).length;
  const recentAppointments = appointments.slice(0, 5);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <style>{ADMIN_RESPONSIVE_CSS}</style>

      {/* ═══════════════ TOP NAVBAR ═══════════════ */}
      <nav
        className="ad-nav"
        style={{
          background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE2} 100%)`,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 12px rgba(26,58,143,0.18)",
        }}
      >
        {/* Left: Hamburger (mobile) + Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="ad-hamburger"
            onClick={() => setSidebarOpen((p) => !p)}
            style={adminHamburgerStyle}
            aria-label="Toggle menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
            >
              {sidebarOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
          <img
            src="/assets/Logo.jpg"
            alt="logo"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(255,255,255,0.4)",
            }}
          />
          <span
            className="ad-brand-text"
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.5px",
            }}
          >
            E-KALUSUGAN
          </span>
        </div>

        {/* Right: Help + Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="ad-nav-btn"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "8px",
              padding: "7px 14px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Help
          </button>
          <DashboardProfileMenu
            identity={identity}
            onLogout={handleLogout}
            accentColor={ORANGE}
            chipBg="rgba(255,255,255,0.15)"
            chipBorder="rgba(255,255,255,0.24)"
            chipTextColor="#ffffff"
            subtitleColor="rgba(255,255,255,0.72)"
          />
        </div>
      </nav>

      {/* Mobile sidebar backdrop */}
      <div
        className={`ad-sidebar-backdrop ${sidebarOpen ? "ad-sidebar-backdrop-active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ═══════════════ BODY: SIDEBAR + MAIN ═══════════════ */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        {/* ── Sidebar ── */}
        <aside
          className={`ad-sidebar ${sidebarOpen ? "ad-sidebar-open" : ""}`}
          style={{
            width: "180px",
            flexShrink: 0,
            background: "#ffffff",
            borderRight: "1px solid #e2e8f0",
            padding: "24px 0",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: "64px",
            height: "calc(100vh - 64px)",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              padding: "0 16px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
            }}
          >
            MAIN MENU
          </p>
          {sidebarItems.map(({ label, tab }) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: activeTab === tab ? 600 : 400,
                background: activeTab === tab ? "#eff6ff" : "transparent",
                color: activeTab === tab ? BLUE : "#475569",
                borderLeft:
                  activeTab === tab
                    ? `3px solid ${BLUE}`
                    : "3px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab)
                  e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {label}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main
          className="ad-main"
          style={{ flex: 1, overflowY: "auto", minWidth: 0 }}
        >
          {/* ════════ OVERVIEW / DASHBOARD ════════ */}
          {activeTab === "overview" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
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

              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Patients Today",
                    value: ovLoading ? "—" : (overview?.totalPatients ?? 0),
                    bg: BLUE,
                  },
                  {
                    label: "Doctors Available",
                    value: ovLoading ? "—" : (overview?.doctorsOnDuty ?? 0),
                    bg: "#0891b2",
                  },
                  {
                    label: "Appointments Today",
                    value: ovLoading ? "—" : (overview?.appointments ?? 0),
                    bg: ORANGE,
                  },
                  {
                    label: "Queues Completed",
                    value: ovLoading ? "—" : (overview?.doneToday ?? 0),
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
                    <span
                      style={{ fontSize: "26px", fontWeight: 800, color: bg }}
                    >
                      {value}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Traffic by Location + Patient Volume */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Donut — Department Distribution */}
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
                      margin: "0 0 10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    Department Distribution: Top Services Used
                  </h3>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    style={{
                      marginBottom: "14px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "12px",
                      color: "#1e293b",
                      background: "#f8fafc",
                      outline: "none",
                      cursor: "pointer",
                      width: "100%",
                      fontFamily: "inherit",
                    }}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
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
                          data={departmentServices[selectedDept]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {departmentServices[selectedDept].map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
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
                      {departmentServices[selectedDept].map((d) => {
                        const total = departmentServices[selectedDept].reduce(
                          (sum, s) => sum + s.value,
                          0,
                        );
                        const pct = ((d.value / total) * 100).toFixed(1);
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
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bar — Patient Volume */}
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
                      {["Daily", "Weekly", "Monthly"].map((t) => (
                        <button
                          key={t}
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
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={volumeDataMap[volumeTab]} barSize={18}>
                      <XAxis
                        dataKey="d"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                      />
                      <Bar dataKey="v" fill={BLUE2} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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

              {/* Patient History Table */}
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
                    <div
                      className="ad-hide-on-mobile"
                      style={{ overflowX: "auto" }}
                    >
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
                              <td
                                style={{
                                  padding: "10px 12px",
                                  color: "#64748b",
                                }}
                              >
                                {formatAppointmentDate(appt.appointment_date)}
                              </td>
                              <td
                                style={{
                                  padding: "10px 12px",
                                  color: "#64748b",
                                }}
                              >
                                {formatDoctorName(appt)}
                              </td>
                              <td
                                style={{
                                  padding: "10px 12px",
                                  color: "#64748b",
                                }}
                              >
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
                            {formatAppointmentDate(appt.appointment_date)}
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
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
                >
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

              {/* Notifications Placeholder */}
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
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
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
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
          )}

          {/* ════════ QUEUE MONITOR ════════ */}
          {activeTab === "queuemonitor" && (
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
              <p
                style={{
                  margin: "0 0 16px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Live queue list with queue numbers and patient names.
              </p>

              <div
                style={{
                  display: "inline-flex",
                  padding: "3px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  gap: "4px",
                  marginBottom: "16px",
                }}
              >
                {[
                  { id: "general", label: "General Consultation" },
                  { id: "dental", label: "Dental Check-up" },
                ].map(({ id, label }) => {
                  const active = queueCategoryFilter === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setQueueCategoryFilter(id)}
                      style={{
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: active ? BLUE2 : "transparent",
                        color: active ? "#fff" : "#374151",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {queueLoading ? (
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                  Loading queue...
                </p>
              ) : queueMonitor.filter((q) => q.category === queueCategoryFilter).length === 0 ? (
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                  No {queueCategoryFilter === "general" ? "general consultation" : "dental"} queue entries today.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {queueMonitor.filter((q) => q.category === queueCategoryFilter).map((q) => {
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
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: "999px",
                              background:
                                q.type === "priority" ? "#fff7ed" : "#f3f4f6",
                              color:
                                q.type === "priority" ? "#f97316" : "#64748b",
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
          )}

          {/* ════════ STATISTICS / ANALYTICS ════════ */}
          {activeTab === "reports" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* ── Section Header ── */}
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
                  Queue performance, service breakdowns, and forecasting
                  insights.
                </p>
              </div>

              {/* ── 1. Queue Statistics ── */}
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

                {/* Today summary stat cards */}
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
                      <span
                        style={{ fontSize: "24px", fontWeight: 800, color }}
                      >
                        {value}
                      </span>
                      <span style={{ fontSize: "12px", color, opacity: 0.8 }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Weekly trend bar chart */}
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

              {/* ── 2. Descriptive Analytics ── */}
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
                    margin: "0 0 20px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  Descriptive Analytics
                </h3>
                <ReportsPanel />
              </div>

              {/* ── 3. Predictive Analytics ── */}
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
                    margin: "0 0 20px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  Predictive Analytics
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    padding: "40px 24px",
                    borderRadius: "14px",
                    background:
                      "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
                    border: "1.5px dashed #bfdbfe",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      Forecasting Models Coming Soon
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#64748b",
                        maxWidth: "380px",
                        lineHeight: "1.6",
                      }}
                    >
                      This section will include patient volume predictions,
                      appointment trend analysis, and queue load forecasting
                      based on historical data.
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "4px 14px",
                      borderRadius: "99px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: "#dbeafe",
                      color: BLUE,
                      letterSpacing: "0.5px",
                    }}
                  >
                    COMING SOON
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ════════ DOCTORS ════════ */}
          {activeTab === "doctors" && (
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
                  margin: "0 0 16px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Doctor Availability
              </h3>
              {doctors.length === 0 ? (
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                  No doctors registered yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.map((d) => (
                    <div
                      key={d.doctor_id}
                      style={{
                        border: `1.5px solid ${d.is_available ? "#bbf7d0" : "#fecaca"}`,
                        borderRadius: "14px",
                        padding: "18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        background: d.is_available ? "#f0fdf4" : "#fef2f2",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 2px",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Dr. {d.first_name} {d.last_name}
                        </p>
                        {d.specialization_name && (
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: "12px",
                              color: "#64748b",
                            }}
                          >
                            {d.specialization_name}
                          </p>
                        )}
                        <StatusBadge
                          status={d.is_available ? "available" : "on_leave"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ PATIENTS HISTORY ════════ */}
          {activeTab === "patientshistory" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                className="ad-tab-pad"
                style={{
                  background:
                    "linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%)",
                  borderRadius: "16px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Patient Records
                </p>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#1e293b",
                  }}
                >
                  Patients History
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: 1.6,
                  }}
                >
                  Review appointment activity, service history, assigned doctor,
                  and each patient case status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Records",
                    value: appointments.length,
                    color: BLUE,
                    bg: "#dbeafe",
                  },
                  {
                    label: "Completed",
                    value: completedAppointments,
                    color: "#059669",
                    bg: "#dcfce7",
                  },
                  {
                    label: "Open Cases",
                    value: pendingAppointments + confirmedAppointments,
                    color: ORANGE,
                    bg: "#ffedd5",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "#fff",
                      borderRadius: "14px",
                      padding: "18px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#94a3b8",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.label}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "28px",
                          fontWeight: 800,
                          color: item.color,
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

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
                    margin: "0 0 14px",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  Appointment History
                </h3>

                {apptLoading ? (
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                    Loading appointments...
                  </p>
                ) : appointments.length === 0 ? (
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                    No appointments recorded yet.
                  </p>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div
                      className="ad-hide-on-mobile"
                      style={{ overflowX: "auto" }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "13px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              borderBottom: "2px solid #e2e8f0",
                              textAlign: "left",
                              color: "#475569",
                            }}
                          >
                            <th style={{ padding: "10px 12px" }}>Date</th>
                            <th style={{ padding: "10px 12px" }}>Time</th>
                            <th style={{ padding: "10px 12px" }}>Patient</th>
                            <th style={{ padding: "10px 12px" }}>Doctor</th>
                            <th style={{ padding: "10px 12px" }}>Services</th>
                            <th style={{ padding: "10px 12px" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((appt) => (
                            <tr
                              key={appt.appointment_id}
                              style={{ borderBottom: "1px solid #f1f5f9" }}
                            >
                              <td
                                style={{
                                  padding: "12px",
                                  color: "#1e293b",
                                  fontWeight: 600,
                                }}
                              >
                                {formatAppointmentDate(appt.appointment_date)}
                              </td>
                              <td style={{ padding: "12px", color: "#475569" }}>
                                {formatAppointmentTime(appt.appointment_time)}
                              </td>
                              <td style={{ padding: "12px", color: "#1e293b" }}>
                                {appt.patient_full_name || "—"}
                              </td>
                              <td style={{ padding: "12px", color: "#475569" }}>
                                {formatDoctorName(appt)}
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  color: "#475569",
                                  maxWidth: "280px",
                                }}
                              >
                                {formatServices(appt)}
                              </td>
                              <td style={{ padding: "12px" }}>
                                <StatusBadge status={appt.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div
                      className="ad-show-on-mobile"
                      style={{
                        display: "none",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {appointments.map((appt) => (
                        <div
                          key={appt.appointment_id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            background: "#fff",
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
                                fontWeight: 600,
                                color: "#1e293b",
                                fontSize: "13px",
                              }}
                            >
                              {appt.patient_full_name || "—"}
                            </span>
                            <span
                              style={{ fontSize: "12px", color: "#64748b" }}
                            >
                              {new Date(
                                appt.appointment_date,
                              ).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <span style={{ fontSize: "12px", color: "#475569" }}>
                            {formatServices(appt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════ NOTIFICATIONS ════════ */}
          {activeTab === "notifications" && (
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
                  margin: "0 0 14px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Notifications
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {notificationsPlaceholder.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "14px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "#dbeafe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "18px",
                      }}
                    >
                      🔔
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 2px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {n.title}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#64748b",
                        }}
                      >
                        {n.body}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
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
          )}

          {/* ════════ ACCOUNTS / STAFF ════════ */}
          {activeTab === "staff" && (
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
                  margin: "0 0 14px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Account Management
              </h3>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "20px" }}
              >
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
          )}
        </main>
      </div>
    </div>
  );
}
