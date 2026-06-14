import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { useQueue } from "@/hooks/useQueue";
import { ROUTES } from "@/constants/routes";
import { QUEUE_STATUS } from "@/constants/queue";
import { DENTAL_SERVICES } from "@/constants/medicalServices";
import api from "@/services/api";
import * as appointmentService from "@/services/appointmentService";
import * as queueService from "@/services/queueService";
import { getQueueDisplayName } from "@/utils/queueDisplay";

import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";
import Icon from "@/components/common/AppIcons";
import GetQueueModal from "@/components/dashboards/patient/GetQueueModal";
import PatientHomeTab from "@/components/dashboards/patient/PatientHomeTab";
import PatientQueueTab from "@/components/dashboards/patient/PatientQueueTab";
import PatientAppointmentsTab from "@/components/dashboards/patient/PatientAppointmentsTab";

const ORANGE = "#f97316";

const DENTAL_SUBSERVICE_LABEL_BY_ID = DENTAL_SERVICES.reduce((acc, s) => { acc[s.id] = s.label; return acc; }, {});

const formatQueuedServices = (queue) => {
  if (!Array.isArray(queue?.services) || queue.services.length === 0) return "";
  return queue.services.map((s) => {
    if (s && typeof s === "object") return s.label || s.name || s.id || "";
    const key = String(s ?? "").trim();
    return DENTAL_SUBSERVICE_LABEL_BY_ID[key] || key;
  }).filter(Boolean).join(", ");
};

const PATIENT_RESPONSIVE_CSS = `
  .pd-nav { padding: 10px 24px; }
  .pd-nav-items { display: flex; align-items: center; gap: 4px; }
  .pd-nav-btn-label { display: inline; }
  .pd-hamburger { display: none; }
  .pd-mobile-menu { display: none; }
  .pd-actions { padding: 28px 24px; }
  .pd-content-pad { padding: 0 24px 32px; }
  .pd-tab-pad { padding: 28px 24px; }
  .pd-hero-pad { padding: 48px 24px; }
  .pd-doctor-hero-pad { padding: 40px 24px; }
  @media (max-width: 768px) {
    .pd-nav { padding: 10px 16px; }
    .pd-nav-items { gap: 2px; }
    .pd-nav-btn-label { display: none; }
    .pd-brand-text { font-size: 14px !important; letter-spacing: 0.06em !important; }
  }
  @media (max-width: 640px) {
    .pd-nav { padding: 10px 14px; }
    .pd-hamburger { display: flex !important; }
    .pd-nav-items-desktop { display: none !important; }
    .pd-mobile-menu.open { display: block; }
    .pd-actions { padding: 20px 14px; gap: 12px !important; }
    .pd-content-pad { padding: 0 14px 24px; }
    .pd-tab-pad { padding: 20px 14px; }
    .pd-hero-pad { padding: 36px 16px !important; }
    .pd-doctor-hero-pad { padding: 32px 16px !important; }
    .pd-brand-logo { width: 32px !important; height: 32px !important; }
    .pd-action-btn { padding: 16px 18px !important; font-size: 13px !important; flex: 1 1 100% !important; }
    .pd-info-card { padding: 16px !important; min-height: 110px !important; }
    .pd-info-card-big { font-size: 18px !important; }
    .pd-info-card-num { font-size: 24px !important; }
  }
`;

const mobileMenuBtn = {
  display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none",
  color: "white", fontSize: "14px", fontWeight: 500, cursor: "pointer",
  padding: "10px 12px", borderRadius: "8px", textAlign: "left", width: "100%",
};

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const { queue, loading, error, fetchMyQueue, submitQueue } = useQueue();

  const [activeTab, setActiveTab]           = useState("home");
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appointments, setAppointments]     = useState([]);
  const [apptLoading, setApptLoading]       = useState(false);
  const [queueStatus, setQueueStatus]       = useState({ now_serving: null, now_serving_name: null, next_queuing: null, next_queuing_name: null });
  const [doctorAvailability, setDoctorAvailability] = useState(null);

  const fetchQueueStatus = async () => {
    try { setQueueStatus(await queueService.getQueueStatus() ?? { now_serving: null, now_serving_name: null, next_queuing: null, next_queuing_name: null }); }
    catch { /* silently ignore */ }
  };

  const fetchDoctorAvailability = async () => {
    try {
      const doctors = (await api.get("/doctor"))?.data ?? [];
      if (!doctors.length) { setDoctorAvailability(null); return; }
      setDoctorAvailability(doctors.some((d) => Number(d?.is_available ?? 1) !== 0) ? 1 : 0);
    } catch { /* silently ignore */ }
  };

  useEffect(() => {
    fetchMyQueue();
    fetchQueueStatus();
    fetchDoctorAvailability();
    const interval = setInterval(() => { fetchMyQueue(); fetchQueueStatus(); fetchDoctorAvailability(); }, 15_000);
    return () => clearInterval(interval);
  }, [fetchMyQueue]);

  useEffect(() => {
    if (activeTab === "appointments") loadAppointments();
  }, [activeTab]);

  const loadAppointments = async () => {
    setApptLoading(true);
    try { setAppointments((await appointmentService.getMyAppointments())?.appointments ?? []); }
    catch { setAppointments([]); }
    finally { setApptLoading(false); }
  };

  const handleGetQueue = async (payload) => {
    try { await submitQueue(payload); setShowQueueModal(false); }
    catch (err) { alert(err.message || "Failed to get queue number."); }
  };

  const handleCancelQueue = async () => {
    if (!window.confirm("Cancel your queue number?")) return;
    try { await queueService.cancelQueue(queue.id); fetchMyQueue(); }
    catch (err) { alert(err.message); }
  };

  const handleLogout = () => { logout(); navigate(ROUTES.LOGIN); };

  const hasActiveQueue = queue && queue.status !== QUEUE_STATUS.DONE && queue.status !== QUEUE_STATUS.CANCELLED;
  const queueDisplayName = hasActiveQueue ? getQueueDisplayName(queue) : "";
  const queuedServices   = hasActiveQueue ? formatQueuedServices(queue) : "";
  const myQueueSubtitle  = hasActiveQueue
    ? [queueDisplayName, queuedServices ? `Dental Sub-services: ${queuedServices}` : null].filter(Boolean).join(" | ")
    : "-";

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
      <style>{PATIENT_RESPONSIVE_CSS}</style>

      {/* ── Navbar ── */}
      <nav className="pd-nav" style={{ background: "linear-gradient(90deg, #1a3a8f 0%, #1e4db7 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/assets/Logo.jpg" alt="E-KALUSUGAN" className="pd-brand-logo" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <span className="pd-brand-text" style={{ color: "white", fontWeight: 800, fontSize: "16px", letterSpacing: "0.1em" }}>E-KALUSUGAN</span>
        </div>

        <button className="pd-hamburger" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Toggle menu" style={{ display: "none", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", color: "white" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            {mobileMenuOpen ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
          </svg>
        </button>

        <div className="pd-nav-items pd-nav-items-desktop" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {[{ icon: "info", label: "Help" }, { icon: "bell", label: "Notification" }].map(({ icon, label }) => (
            <button key={label} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", padding: "7px 12px", borderRadius: "8px" }}>
              <Icon name={icon} size={16} color="white" />
              <span className="pd-nav-btn-label">{label}</span>
            </button>
          ))}
          <div style={{ marginLeft: "8px" }}>
            <DashboardProfileMenu identity={identity} onLogout={handleLogout} accentColor={ORANGE} chipBg="rgba(255,255,255,0.15)" chipBorder="rgba(255,255,255,0.35)" chipTextColor="#ffffff" subtitleColor="rgba(255,255,255,0.72)" />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="pd-mobile-menu open" style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e4db7", borderTop: "1px solid rgba(255,255,255,0.15)", padding: "8px 14px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 50, boxShadow: "0 6px 14px rgba(0,0,0,0.18)" }}>
            <DashboardProfileMenu mobile identity={identity} onLogout={() => { setMobileMenuOpen(false); handleLogout(); }} accentColor={ORANGE} panelBg="rgba(255,255,255,0.1)" panelTextColor="#ffffff" panelMutedColor="rgba(255,255,255,0.72)" />
            {[{ icon: "info", label: "Help" }, { icon: "bell", label: "Notification" }].map(({ icon, label }) => (
              <button key={label} onClick={() => setMobileMenuOpen(false)} style={mobileMenuBtn}>
                <Icon name={icon} size={16} color="white" /> {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Tab Content ── */}
      {activeTab === "home" && (
        <PatientHomeTab
          queueStatus={queueStatus}
          doctorAvailability={doctorAvailability}
          hasActiveQueue={hasActiveQueue}
          queue={queue}
          myQueueSubtitle={myQueueSubtitle}
          onGetQueue={() => setShowQueueModal(true)}
          onCancelQueue={handleCancelQueue}
          onGoAppointments={() => setActiveTab("appointments")}
        />
      )}
      {activeTab === "queue" && (
        <PatientQueueTab
          hasActiveQueue={hasActiveQueue}
          queue={queue}
          loading={loading}
          error={error}
          onGetQueue={() => setShowQueueModal(true)}
          onCancelQueue={handleCancelQueue}
          onBack={() => setActiveTab("home")}
        />
      )}
      {activeTab === "appointments" && (
        <PatientAppointmentsTab
          appointments={appointments}
          apptLoading={apptLoading}
          onBack={() => setActiveTab("home")}
        />
      )}

      {/* ── Get Queue Modal ── */}
      <GetQueueModal isOpen={showQueueModal} onClose={() => setShowQueueModal(false)} onSubmit={handleGetQueue} loading={loading} />
    </div>
  );
}
