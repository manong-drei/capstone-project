import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { useQueue } from "@/hooks/useQueue";
import { ROUTES } from "@/constants/routes";
import { QUEUE_STATUS } from "@/constants/queue";
import api from "@/services/api";
import * as appointmentService from "@/services/appointmentService";

import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";
import Icon from "@/components/common/AppIcons";
import ConsultationModal from "@/components/dashboards/doctor/ConsultationModal";
import LimitWarningModal from "@/components/dashboards/doctor/LimitWarningModal";
import DoctorHomeTab from "@/components/dashboards/doctor/DoctorHomeTab";
import DoctorAnalyticsTab from "@/components/dashboards/doctor/DoctorAnalyticsTab";
import DoctorAppointmentsTab from "@/components/dashboards/doctor/DoctorAppointmentsTab";

const INDIGO = "#4f46e5";
const TODAY  = new Date().toISOString().split("T")[0];

const DOC_RESPONSIVE_CSS = `
  .dd-nav { padding: 10px 24px; }
  .dd-nav-btn-label { display: inline; }
  .dd-hamburger { display: none; }
  .dd-content-pad { padding: 20px 24px 0; }
  .dd-hero-pad { padding: 40px 24px; }
  .dd-tab-pad { padding: 28px 24px; }
  .dd-hide-on-mobile { display: block; }
  .dd-show-on-mobile { display: none; }
  @media (max-width: 900px) { .dd-nav-btn-label { display: none; } }
  @media (max-width: 640px) {
    .dd-nav { padding: 10px 14px; }
    .dd-hamburger { display: flex !important; }
    .dd-nav-items-desktop { display: none !important; }
    .dd-content-pad { padding: 14px 14px 0 !important; }
    .dd-hero-pad { padding: 32px 16px !important; }
    .dd-tab-pad { padding: 20px 14px !important; }
    .dd-brand-text { font-size: 13px !important; letter-spacing: 0.06em !important; }
    .dd-brand-logo { width: 32px !important; height: 32px !important; }
    .dd-hide-on-mobile { display: none !important; }
    .dd-show-on-mobile { display: flex !important; }
  }
`;

const mobileMenuBtnStyle = {
  display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none",
  color: "white", fontSize: "14px", fontWeight: 500, cursor: "pointer",
  padding: "10px 12px", borderRadius: "8px", textAlign: "left", width: "100%",
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const { queues, loading, error, fetchAllQueues, updateStatus } = useQueue();

  const [activeTab, setActiveTab]           = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [servingPatient, setServingPatient] = useState(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [capacityCollapsed, setCapacityCollapsed] = useState(false);
  const [showLimitWarning, setShowLimitWarning]   = useState(false);
  const [pendingSettings, setPendingSettings]     = useState(null);

  // Daily capacity state
  const [appointmentLimit, setAppointmentLimit] = useState(10);
  const [walkInLimit, setWalkInLimit]           = useState(0);
  const [bookedCount, setBookedCount]           = useState(0);
  const [walkInCount, setWalkInCount]           = useState(0);
  const [settingsLoading, setSettingsLoading]   = useState(false);
  const [settingsSaved, setSettingsSaved]       = useState(false);
  const [isAvailable, setIsAvailable]           = useState(true);
  const [availLoading, setAvailLoading]         = useState(false);

  // Appointments tab
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading]   = useState(false);

  const fetchDailySettings = async () => {
    try {
      const data = await api.get(`/doctor/daily-settings?date=${TODAY}`);
      setAppointmentLimit(data.appointment_limit ?? 10);
      setWalkInLimit(data.walk_in_limit ?? 0);
      setBookedCount(data.booked_count ?? 0);
      setWalkInCount(data.walkin_count ?? 0);
      setIsAvailable(data.is_available !== 0);
    } catch (err) {
      if (import.meta.env.DEV) console.error("fetchDailySettings error:", err);
    }
  };

  const persistSettings = async (apptLimit, wiLimit) => {
    setSettingsLoading(true);
    try {
      await api.put("/doctor/daily-settings", { date: TODAY, appointment_limit: apptLimit, walk_in_limit: wiLimit, is_available: isAvailable ? 1 : 0 });
      setAppointmentLimit(apptLimit);
      setWalkInLimit(wiLimit);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      alert(err.message || "Failed to save settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleApplySettings = () => {
    if (appointmentLimit < bookedCount) {
      setPendingSettings({ appt: appointmentLimit, wi: walkInLimit });
      setShowLimitWarning(true);
    } else {
      persistSettings(appointmentLimit, walkInLimit);
    }
  };

  const handleConfirmWarning = () => {
    if (pendingSettings) persistSettings(pendingSettings.appt, pendingSettings.wi);
    setShowLimitWarning(false);
    setPendingSettings(null);
  };

  const handleCancelWarning = () => {
    fetchDailySettings();
    setShowLimitWarning(false);
    setPendingSettings(null);
  };

  const handleToggleAvailability = async (val) => {
    setAvailLoading(true);
    try {
      await api.put("/doctor/daily-settings", { date: TODAY, appointment_limit: appointmentLimit, walk_in_limit: walkInLimit, is_available: val ? 1 : 0 });
      setIsAvailable(val);
    } catch (err) {
      alert(err.message || "Failed to update availability.");
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQueues();
    fetchDailySettings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { fetchAllQueues(); fetchDailySettings(); }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab !== "appointments") return;
    let cancelled = false;
    (async () => {
      setApptLoading(true);
      try {
        const data = await appointmentService.getDoctorAppointments();
        if (!cancelled) setAppointments(data?.appointments ?? []);
      } catch {
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setApptLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  const handleCallNext = async () => {
    if (servingQueue) { setServingPatient(servingQueue); setShowConsultModal(true); return; }
    try {
      const next = await api.post("/queue/call-next", { category: "dental" });
      setServingPatient(next);
      setShowConsultModal(true);
      fetchAllQueues();
    } catch (err) { alert(err.message); }
  };

  const handleMarkDone = async (id) => {
    await updateStatus(id, QUEUE_STATUS.DONE);
    fetchAllQueues();
  };

  const handleSaveConsultation = async (notes) => {
    setConsultLoading(true);
    try {
      await api.post("/doctor/consultations", { queue_id: servingPatient?.id, ...notes });
      setShowConsultModal(false);
      setServingPatient(null);
      fetchAllQueues();
    } catch (err) {
      alert(err.message);
    } finally {
      setConsultLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate(ROUTES.LOGIN); };

  // Derived queue data
  const dentalQueues  = queues.filter((q) => q.category === "dental");
  const waiting       = dentalQueues.filter((q) => q.status === QUEUE_STATUS.WAITING);
  const serving       = dentalQueues.filter((q) => q.status === QUEUE_STATUS.SERVING);
  const doneQueues    = dentalQueues.filter((q) => q.status === QUEUE_STATUS.DONE);
  const servingQueue  = serving[0] ?? null;
  const nextQueue     = waiting[0] ?? null;
  const done          = doneQueues.length;
  const priority      = dentalQueues.filter((q) => q.type === "priority").length;

  const walkInPercent = walkInLimit > 0 ? Math.min(100, Math.round((walkInCount / walkInLimit) * 100)) : 0;
  const apptPercent   = appointmentLimit > 0 ? Math.min(100, Math.round((bookedCount / appointmentLimit) * 100)) : 0;
  const apptFull      = bookedCount >= appointmentLimit && appointmentLimit > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
      <style>{DOC_RESPONSIVE_CSS}</style>

      {/* ── Navbar ── */}
      <nav className="dd-nav" style={{ background: "linear-gradient(90deg, #1a3a8f 0%, #1e4db7 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/assets/Logo.jpg" alt="E-KALUSUGAN" className="dd-brand-logo" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          <span className="dd-brand-text" style={{ color: "white", fontWeight: 800, fontSize: "16px", letterSpacing: "0.1em" }}>E-KALUSUGAN</span>
        </div>

        <button className="dd-hamburger" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Toggle menu" style={{ display: "none", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", width: "38px", height: "38px", cursor: "pointer", color: "white" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            {mobileMenuOpen ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>)}
          </svg>
        </button>

        <div className="dd-nav-items-desktop" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {[{ tab: "analytics", icon: "chart", label: "Analytics" }, { tab: "appointments", icon: "appointment", label: "Appointment History" }].map(({ tab, icon, label }) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: "flex", alignItems: "center", gap: "6px", background: activeTab === tab ? "rgba(255,255,255,0.2)" : "none", border: "none", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", padding: "7px 12px", borderRadius: "8px" }}>
              <Icon name={icon} size={16} color="white" />
              <span className="dd-nav-btn-label">{label}</span>
            </button>
          ))}
          <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", padding: "7px 12px", borderRadius: "8px" }}>
            <Icon name="info" size={16} color="white" />
            <span className="dd-nav-btn-label">Help</span>
          </button>
          <div style={{ marginLeft: "8px" }}>
            <DashboardProfileMenu identity={identity} onLogout={handleLogout} accentColor={INDIGO} chipBg="rgba(255,255,255,0.15)" chipBorder="rgba(255,255,255,0.35)" chipTextColor="#ffffff" subtitleColor="rgba(255,255,255,0.72)" />
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e4db7", borderTop: "1px solid rgba(255,255,255,0.15)", padding: "8px 14px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 50, boxShadow: "0 6px 14px rgba(0,0,0,0.18)" }}>
            <DashboardProfileMenu mobile identity={identity} onLogout={() => { setMobileMenuOpen(false); handleLogout(); }} accentColor={INDIGO} panelBg="rgba(255,255,255,0.1)" panelTextColor="#ffffff" panelMutedColor="rgba(255,255,255,0.72)" />
            {[{ tab: "analytics", icon: "chart", label: "Analytics" }, { tab: "appointments", icon: "appointment", label: "Appointment History" }].map(({ tab, icon, label }) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }} style={mobileMenuBtnStyle}>
                <Icon name={icon} size={16} color="white" /> {label}
              </button>
            ))}
            <button onClick={() => setMobileMenuOpen(false)} style={mobileMenuBtnStyle}>
              <Icon name="info" size={16} color="white" /> Help
            </button>
          </div>
        )}
      </nav>

      {/* ── Tab Content ── */}
      {activeTab === "home" && (
        <DoctorHomeTab
          isAvailable={isAvailable} availLoading={availLoading} onToggleAvailability={handleToggleAvailability}
          capacityCollapsed={capacityCollapsed} setCapacityCollapsed={setCapacityCollapsed}
          appointmentLimit={appointmentLimit} setAppointmentLimit={setAppointmentLimit}
          walkInLimit={walkInLimit} setWalkInLimit={setWalkInLimit}
          bookedCount={bookedCount} walkInCount={walkInCount}
          walkInPercent={walkInPercent} apptPercent={apptPercent} apptFull={apptFull}
          settingsLoading={settingsLoading} settingsSaved={settingsSaved} onApplySettings={handleApplySettings}
          waiting={waiting} serving={serving} doneQueues={doneQueues}
          servingQueue={servingQueue} nextQueue={nextQueue} done={done} priority={priority}
          queueLoading={loading}
          onCallNext={handleCallNext} onMarkDone={handleMarkDone}
          error={error}
        />
      )}
      {activeTab === "analytics" && (
        <DoctorAnalyticsTab
          waiting={waiting} serving={serving} done={done} priority={priority}
          bookedCount={bookedCount} walkInCount={walkInCount}
          onBack={() => setActiveTab("home")}
        />
      )}
      {activeTab === "appointments" && (
        <DoctorAppointmentsTab
          appointments={appointments} apptLoading={apptLoading}
          onBack={() => setActiveTab("home")}
        />
      )}

      {/* ── Modals ── */}
      <ConsultationModal isOpen={showConsultModal} onClose={() => setShowConsultModal(false)} onSubmit={handleSaveConsultation} patient={servingPatient} loading={consultLoading} />
      {showLimitWarning && <LimitWarningModal bookedCount={bookedCount} onConfirm={handleConfirmWarning} onCancel={handleCancelWarning} />}
    </div>
  );
}
