import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { ROUTES } from "@/constants/routes";
import api from "@/services/api";
import * as appointmentService from "@/services/appointmentService";

import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";
import AdminOverviewTab from "@/components/dashboards/admin/AdminOverviewTab";
import AdminQueueMonitorTab from "@/components/dashboards/admin/AdminQueueMonitorTab";
import AdminReportsTab from "@/components/dashboards/admin/AdminReportsTab";
import AdminDoctorsTab from "@/components/dashboards/admin/AdminDoctorsTab";
import AdminPatientsHistoryTab from "@/components/dashboards/admin/AdminPatientsHistoryTab";
import AdminNotificationsTab from "@/components/dashboards/admin/AdminNotificationsTab";
import AdminStaffTab from "@/components/dashboards/admin/AdminStaffTab";

const BLUE  = "#1a3a8f";
const BLUE2 = "#1e4db7";
const ORANGE = "#f97316";

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
      position: fixed !important; top: 64px !important; left: 0 !important;
      height: calc(100vh - 64px) !important; z-index: 99 !important;
      transform: translateX(-100%); transition: transform 0.25s ease;
      box-shadow: 4px 0 16px rgba(0,0,0,0.18);
    }
    .ad-sidebar-open { transform: translateX(0) !important; }
    .ad-sidebar-backdrop-active {
      display: block !important; position: fixed; inset: 64px 0 0 0;
      background: rgba(15,23,42,0.45); z-index: 98;
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

const sidebarItems = [
  { label: "Dashboard",           tab: "overview" },
  { label: "Queue Monitor",       tab: "queuemonitor" },
  { label: "Statistics/Analytics",tab: "reports" },
  { label: "Doctors",             tab: "doctors" },
  { label: "Patients History",    tab: "patientshistory" },
  { label: "Notifications",       tab: "notifications" },
  { label: "Accounts",            tab: "staff" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [overview, setOverview]     = useState(null);
  const [ovLoading, setOvLoading]   = useState(true);
  const [doctors, setDoctors]       = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading]   = useState(false);
  const [queueMonitor, setQueueMonitor] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueCategoryFilter, setQueueCategoryFilter] = useState("general");

  useEffect(() => {
    fetchOverview();
    fetchDoctors();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (activeTab !== "patientshistory") return;
    fetchAppointments();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "queuemonitor") return;
    fetchQueueMonitor();
    const interval = setInterval(fetchQueueMonitor, 15_000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchOverview = async () => {
    setOvLoading(true);
    try { setOverview(await api.get("/admin/overview")); }
    catch { setOverview(null); }
    finally { setOvLoading(false); }
  };

  const fetchDoctors = async () => {
    try { setDoctors((await api.get("/doctor"))?.data ?? []); }
    catch { /* silently ignore */ }
  };

  const fetchAppointments = async () => {
    setApptLoading(true);
    try { setAppointments((await appointmentService.getAllAppointments())?.data ?? []); }
    catch { setAppointments([]); }
    finally { setApptLoading(false); }
  };

  const fetchQueueMonitor = async () => {
    setQueueLoading(true);
    try {
      const data = await api.get("/queue");
      setQueueMonitor(Array.isArray(data) ? data : []);
    } catch { setQueueMonitor([]); }
    finally { setQueueLoading(false); }
  };

  const handleLogout = () => { logout(); navigate(ROUTES.LOGIN); };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "Poppins, system-ui, sans-serif" }}>
      <style>{ADMIN_RESPONSIVE_CSS}</style>

      {/* ── Navbar ── */}
      <nav className="ad-nav" style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE2} 100%)`, height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(26,58,143,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="ad-hamburger"
            onClick={() => setSidebarOpen((p) => !p)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "8px", background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", cursor: "pointer", marginRight: "8px", flexShrink: 0 }}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              {sidebarOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
          <img src="/assets/Logo.jpg" alt="logo" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)" }} />
          <span className="ad-brand-text" style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.5px" }}>
            E-KALUSUGAN
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="ad-nav-btn" style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "7px 14px", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            Help
          </button>
          <DashboardProfileMenu identity={identity} onLogout={handleLogout} accentColor={ORANGE} chipBg="rgba(255,255,255,0.15)" chipBorder="rgba(255,255,255,0.24)" chipTextColor="#ffffff" subtitleColor="rgba(255,255,255,0.72)" />
        </div>
      </nav>

      {/* Mobile sidebar backdrop */}
      <div className={`ad-sidebar-backdrop ${sidebarOpen ? "ad-sidebar-backdrop-active" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Body: Sidebar + Main ── */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        <aside className={`ad-sidebar ${sidebarOpen ? "ad-sidebar-open" : ""}`} style={{ width: "180px", flexShrink: 0, background: "#ffffff", borderRight: "1px solid #e2e8f0", padding: "24px 0", display: "flex", flexDirection: "column", position: "sticky", top: "64px", height: "calc(100vh - 64px)", overflowY: "auto" }}>
          <p style={{ margin: "0 0 12px", padding: "0 16px", fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "1.2px", textTransform: "uppercase" }}>
            MAIN MENU
          </p>
          {sidebarItems.map(({ label, tab }) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: activeTab === tab ? 600 : 400, background: activeTab === tab ? "#eff6ff" : "transparent", color: activeTab === tab ? BLUE : "#475569", borderLeft: activeTab === tab ? `3px solid ${BLUE}` : "3px solid transparent", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (activeTab !== tab) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { if (activeTab !== tab) e.currentTarget.style.background = "transparent"; }}
            >
              {label}
            </button>
          ))}
        </aside>

        <main className="ad-main" style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {activeTab === "overview" && (
            <AdminOverviewTab
              overview={overview}
              ovLoading={ovLoading}
              doctors={doctors}
              recentAppointments={appointments.slice(0, 5)}
              apptLoading={apptLoading}
            />
          )}
          {activeTab === "queuemonitor" && (
            <AdminQueueMonitorTab
              queueMonitor={queueMonitor}
              queueLoading={queueLoading}
              queueCategoryFilter={queueCategoryFilter}
              setQueueCategoryFilter={setQueueCategoryFilter}
            />
          )}
          {activeTab === "reports" && (
            <AdminReportsTab overview={overview} ovLoading={ovLoading} />
          )}
          {activeTab === "doctors" && (
            <AdminDoctorsTab doctors={doctors} />
          )}
          {activeTab === "patientshistory" && (
            <AdminPatientsHistoryTab appointments={appointments} apptLoading={apptLoading} />
          )}
          {activeTab === "notifications" && <AdminNotificationsTab />}
          {activeTab === "staff" && <AdminStaffTab />}
        </main>
      </div>
    </div>
  );
}
