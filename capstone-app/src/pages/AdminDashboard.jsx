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
import { CANCELLATION_REASONS } from "@/constants/queueReasons";
import QueueReasonModal from "@/components/common/QueueReasonModal";

const BLUE = "#1a3a8f";
const BLUE2 = "#1e4db7";
const ORANGE = "#f97316";

const ADMIN_RESPONSIVE_CSS = `
  :root { --ad-nav-h: 64px; }

  .ad-root {
    min-height: 100vh;
    background: #f1f5f9;
    font-family: Poppins, system-ui, sans-serif;
  }

  /* ───────── Navbar ───────── */
  .ad-nav {
    height: var(--ad-nav-h);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .ad-nav-left,
  .ad-nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .ad-brand-text { white-space: nowrap; }

  /* Hidden by default — the !important is what beats the inline display */
  .ad-hamburger { display: none !important; }

  /* ───────── Layout ───────── */
  .ad-body {
    display: flex;
    min-height: calc(100vh - var(--ad-nav-h));
  }

  /* ───────── Sidebar ───────── */
  .ad-sidebar {
    width: 180px;
    flex-shrink: 0;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: var(--ad-nav-h);
    height: calc(100vh - var(--ad-nav-h));
    overflow-y: auto;
  }

  .ad-sidebar-title {
    margin: 0 0 12px;
    padding: 0 16px;
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }

  .ad-sidebar-btn {
    display: block;
    width: 100%;
    text-align: left;
    padding: 10px 16px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 400;
    background: transparent;
    color: #475569;
    border-left: 3px solid transparent;
    transition: background .15s, color .15s, border-color .15s;
  }
  .ad-sidebar-btn:hover { background: #f8fafc; }
  .ad-sidebar-btn.is-active {
    font-weight: 600;
    background: #eff6ff;
    color: ${BLUE};
    border-left-color: ${BLUE};
  }

  .ad-sidebar-backdrop { display: none; }

  /* ───────── Main ───────── */
  .ad-main {
    flex: 1;
    min-width: 0;
    padding: 24px;
    overflow-x: hidden;
  }

  /* ───────── Tablet / Mobile ───────── */
  @media (max-width: 900px) {
    .ad-nav { padding: 0 12px; }
    .ad-brand-text { font-size: 14px !important; letter-spacing: .3px !important; }
    .ad-hamburger { display: flex !important; }
    .ad-hide-on-mobile { display: none !important; }

    .ad-sidebar {
      position: fixed !important;
      top: var(--ad-nav-h) !important;
      left: 0 !important;
      width: 250px !important;
      max-width: 82vw !important;
      height: calc(100vh - var(--ad-nav-h)) !important;
      height: calc(100dvh - var(--ad-nav-h)) !important; /* mobile browser chrome */
      z-index: 99 !important;
      transform: translateX(-100%);
      transition: transform .25s ease;
      box-shadow: 4px 0 18px rgba(0, 0, 0, .18);
      overscroll-behavior: contain;
      padding-bottom: calc(24px + env(safe-area-inset-bottom)) !important;
    }
    .ad-sidebar.ad-sidebar-open { transform: translateX(0) !important; }

    /* bigger touch targets */
    .ad-sidebar-btn { padding: 13px 18px !important; font-size: 14px !important; }
    .ad-sidebar-title { padding: 0 18px !important; }

    .ad-sidebar-backdrop {
      position: fixed;
      inset: var(--ad-nav-h) 0 0 0;
      background: rgba(15, 23, 42, .45);
      z-index: 98;
      -webkit-tap-highlight-color: transparent;
    }
    .ad-sidebar-backdrop.ad-sidebar-backdrop-active { display: block !important; }

    .ad-main {
      padding: 14px !important;
      padding-bottom: calc(24px + env(safe-area-inset-bottom)) !important;
    }
  }

  /* ───────── Small phones ───────── */
  @media (max-width: 420px) {
    .ad-nav { padding: 0 10px; }
    .ad-brand-text { font-size: 12.5px !important; }
    .ad-logo { width: 32px !important; height: 32px !important; }
    .ad-main { padding: 10px !important; }
  }
`;

const sidebarItems = [
  { label: "Dashboard", tab: "overview" },
  { label: "Queue Monitor", tab: "queuemonitor" },
  { label: "Statistics/Analytics", tab: "reports" },
  { label: "Doctors", tab: "doctors" },
  { label: "Patients History", tab: "patientshistory" },
  { label: "Notifications", tab: "notifications" },
  { label: "Accounts", tab: "staff" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [overview, setOverview] = useState(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [queueMonitor, setQueueMonitor] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueCategoryFilter, setQueueCategoryFilter] = useState("general");
  const [queueReasonRequest, setQueueReasonRequest] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (activeTab !== "overview") return;
    fetchOverview();
    fetchAppointments();
  }, [activeTab]);

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

  /* ── Lock body scroll while the mobile drawer is open ── */
  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  /* ── Auto-close the drawer when resizing back to desktop ── */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const handle = (e) => {
      if (e.matches) setSidebarOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener("change", handle);
    else mq.addListener(handle); // Safari < 14
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handle);
      else mq.removeListener(handle);
    };
  }, []);

  /* ── Close the drawer with Escape ── */
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  /* ── Scroll back to top when switching tabs ── */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const fetchOverview = async () => {
    setOvLoading(true);
    try {
      setOverview(await api.get("/admin/overview"));
    } catch {
      setOverview(null);
    } finally {
      setOvLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setDoctors((await api.get("/doctor"))?.data ?? []);
    } catch {
      /* silently ignore */
    }
  };

  const fetchAppointments = async () => {
    setApptLoading(true);
    try {
      setAppointments(
        (await appointmentService.getAllAppointments())?.data ?? [],
      );
    } catch {
      setAppointments([]);
    } finally {
      setApptLoading(false);
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

  const handleQueueStatus = async (queue, status) => {
    setQueueReasonRequest({
      title: "Reason for cancellation",
      reasons: CANCELLATION_REASONS,
      id: queue.id,
      status,
    });
  };

  const submitQueueReason = async (reason) => {
    const { id, status } = queueReasonRequest;
    try {
      await api.patch(`/queue/${id}/status`, { status, reason });
      await fetchQueueMonitor();
    } catch (err) {
      window.alert(err.message || "Could not update queue status.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="ad-root">
      <style>{ADMIN_RESPONSIVE_CSS}</style>
      <QueueReasonModal
        request={queueReasonRequest}
        onClose={() => setQueueReasonRequest(null)}
        onSubmit={submitQueueReason}
      />

      {/* ── Navbar ── */}
      <nav
        className="ad-nav"
        style={{
          background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE2} 100%)`,
          boxShadow: "0 2px 12px rgba(26,58,143,0.18)",
        }}
      >
        <div className="ad-nav-left">
          <button
            className="ad-hamburger"
            onClick={() => setSidebarOpen((p) => !p)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.18)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
            aria-controls="ad-sidebar"
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
            className="ad-logo"
            src="/assets/Logo.jpg"
            alt="logo"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(255,255,255,0.4)",
              flexShrink: 0,
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

        <div className="ad-nav-right">
          <button
            className="ad-nav-btn ad-hide-on-mobile"
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
        aria-hidden="true"
      />

      {/* ── Body: Sidebar + Main ── */}
      <div className="ad-body">
        <aside
          id="ad-sidebar"
          className={`ad-sidebar ${sidebarOpen ? "ad-sidebar-open" : ""}`}
        >
          <p className="ad-sidebar-title">MAIN MENU</p>
          {sidebarItems.map(({ label, tab }) => (
            <button
              key={tab}
              className={`ad-sidebar-btn ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => selectTab(tab)}
              aria-current={activeTab === tab ? "page" : undefined}
            >
              {label}
            </button>
          ))}
        </aside>

        <main className="ad-main">
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
              onQueueStatus={handleQueueStatus}
            />
          )}
          {activeTab === "reports" && (
            <AdminReportsTab overview={overview} ovLoading={ovLoading} />
          )}
          {activeTab === "doctors" && <AdminDoctorsTab doctors={doctors} />}
          {activeTab === "patientshistory" && (
            <AdminPatientsHistoryTab
              appointments={appointments}
              apptLoading={apptLoading}
            />
          )}
          {activeTab === "notifications" && <AdminNotificationsTab />}
          {activeTab === "staff" && <AdminStaffTab />}
        </main>
      </div>
    </div>
  );
}
