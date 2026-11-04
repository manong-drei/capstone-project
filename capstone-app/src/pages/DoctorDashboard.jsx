import { useState, useEffect } from "react";
import {
  Link,
  Navigate,
  matchPath,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { useQueue } from "@/hooks/useQueue";
import { ROUTES } from "@/constants/routes";
import { QUEUE_STATUS } from "@/constants/queue";
import api from "@/services/api";

import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";
import { DashboardSkeleton } from "@/components/common/LoadingState";
import UserManual from "@/components/common/UserManual";
import ConsultationModal from "@/components/dashboards/doctor/ConsultationModal";
import LimitWarningModal from "@/components/dashboards/doctor/LimitWarningModal";
import DoctorHomeTab from "@/components/dashboards/doctor/DoctorHomeTab";
import DoctorAnalyticsTab from "@/components/dashboards/doctor/DoctorAnalyticsTab";
import DoctorAppointmentsTab from "@/components/dashboards/doctor/DoctorAppointmentsTab";
import DoctorLeaveModal from "@/components/dashboards/doctor/DoctorLeaveModal";

const DOCTOR_PAGES = {
  home: ROUTES.DOCTOR_DASHBOARD,
  analytics: ROUTES.DOCTOR_ANALYTICS,
  history: ROUTES.DOCTOR_PATIENT_HISTORY,
};
const clinicToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const NAV_ITEMS = [
  { tab: "home", icon: LayoutDashboard, label: "Dashboard" },
  { tab: "analytics", icon: BarChart3, label: "Analytics" },
  { tab: "history", icon: ClipboardList, label: "Patient History" },
];

/** Shared desktop container — keep the header and every tab's content on the same axis. */
const CONTENT_CONTAINER = "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const { queues, loading, error, fetchAllQueues, updateStatus } = useQueue();

  const leaveOpen = pathname === ROUTES.DOCTOR_LEAVE_REQUESTS;
  const activeTab =
    leaveOpen
      ? "home"
      : pathname === ROUTES.DOCTOR_DAILY_REPORT
        ? "analytics"
        : matchPath(ROUTES.DOCTOR_CONSULTATION, pathname)
          ? "history"
          : Object.keys(DOCTOR_PAGES).find(
              (tab) => DOCTOR_PAGES[tab] === pathname,
            );
  const setActiveTab = (tab) => navigate(DOCTOR_PAGES[tab]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [servingPatient, setServingPatient] = useState(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [queueActionLoading, setQueueActionLoading] = useState(false);
  const [capacityCollapsed, setCapacityCollapsed] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [pendingSettings, setPendingSettings] = useState(null);

  // Daily capacity state
  const [appointmentLimit, setAppointmentLimit] = useState(10);
  const [walkInLimit, setWalkInLimit] = useState(0);
  const [bookedCount, setBookedCount] = useState(0);
  const [walkInCount, setWalkInCount] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availLoading, setAvailLoading] = useState(false);
  const [approvedLeave, setApprovedLeave] = useState(null);

  const [historyVisits, setHistoryVisits] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyRetry, setHistoryRetry] = useState(0);

  const fetchDailySettings = async () => {
    try {
      const data = await api.get(
        `/doctor/daily-settings?date=${clinicToday()}`,
      );
      setAppointmentLimit(data.appointment_limit ?? 10);
      setWalkInLimit(data.walk_in_limit ?? 0);
      setBookedCount(data.booked_count ?? 0);
      setWalkInCount(data.walkin_count ?? 0);
      setIsAvailable(data.is_available !== 0);
      setApprovedLeave(data.approved_leave ?? null);
    } catch (err) {
      if (import.meta.env.DEV) console.error("fetchDailySettings error:", err);
    }
  };

  const persistSettings = async (apptLimit, wiLimit) => {
    setSettingsLoading(true);
    try {
      await api.put("/doctor/daily-settings", {
        date: clinicToday(),
        appointment_limit: apptLimit,
        walk_in_limit: wiLimit,
      });
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
    if (pendingSettings)
      persistSettings(pendingSettings.appt, pendingSettings.wi);
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
      await api.put("/doctor/daily-settings", {
        date: clinicToday(),
        appointment_limit: appointmentLimit,
        walk_in_limit: walkInLimit,
        is_available: val ? 1 : 0,
      });
      setIsAvailable(val);
    } catch (err) {
      alert(err.message || "Failed to update availability.");
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetchAllQueues(), fetchDailySettings()]).finally(() => {
      if (active) setInitialLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchAllQueues]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllQueues();
      fetchDailySettings();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchAllQueues]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const controller = new AbortController();
    (async () => {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const data = await api.get("/doctor/patient-history", {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setHistoryVisits(data.visits ?? []);
      } catch (err) {
        if (!controller.signal.aborted) setHistoryError(err.message);
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activeTab, historyRetry]);

  const handleCallNext = async () => {
    if (servingQueue) {
      setServingPatient(servingQueue);
      setShowConsultModal(true);
      return;
    }
    setQueueActionLoading(true);
    try {
      await api.post("/queue/call-next", { category: "dental" });
      await fetchAllQueues();
    } catch (err) {
      alert(err.message);
    } finally {
      setQueueActionLoading(false);
    }
  };

  const handleMarkDone = async (id) => {
    await updateStatus(id, QUEUE_STATUS.DONE);
    fetchAllQueues();
  };

  const handleQueueAction = async (id, action) => {
    setQueueActionLoading(true);
    try {
      if (action === "present") {
        const patient = await api.patch(`/queue/${id}/status`, {
          status: "serving",
        });
        setServingPatient(patient);
        setShowConsultModal(true);
      } else await api.post(`/queue/${id}/${action}`);
      await fetchAllQueues();
    } catch (err) {
      await fetchAllQueues();
      alert(err.message);
    } finally {
      setQueueActionLoading(false);
    }
  };

  const handleSaveConsultation = async (notes) => {
    setConsultLoading(true);
    try {
      await api.post("/doctor/consultations", {
        queue_id: servingPatient?.id,
        ...notes,
      });
      setShowConsultModal(false);
      setServingPatient(null);
      fetchAllQueues();
    } catch (err) {
      alert(err.message);
    } finally {
      setConsultLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  // Derived queue data
  const dentalQueues = queues.filter((q) => q.category === "dental");
  const waiting = dentalQueues.filter((q) => q.status === QUEUE_STATUS.WAITING);
  const serving = dentalQueues.filter((q) => q.status === QUEUE_STATUS.SERVING);
  const doneQueues = dentalQueues.filter((q) => q.status === QUEUE_STATUS.DONE);
  const servingQueue = serving[0] ?? null;
  const calledQueue =
    dentalQueues.find((q) => q.status === QUEUE_STATUS.CALLED) ?? null;
  const missedQueues = dentalQueues.filter(
    (q) => q.status === QUEUE_STATUS.MISSED,
  );
  const nextQueue = waiting[0] ?? null;
  const done = doneQueues.length;
  const priority = dentalQueues.filter((q) => q.type === "priority").length;

  const walkInPercent =
    walkInLimit > 0
      ? Math.min(100, Math.round((walkInCount / walkInLimit) * 100))
      : 0;
  const apptPercent =
    appointmentLimit > 0
      ? Math.min(100, Math.round((bookedCount / appointmentLimit) * 100))
      : 0;
  const apptFull = bookedCount >= appointmentLimit && appointmentLimit > 0;

  if (!activeTab) return <Navigate to={ROUTES.DOCTOR_DASHBOARD} replace />;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-[Poppins,sans-serif] text-slate-800">
      <UserManual
        role="doctor"
        isOpen={showManual}
        onClose={() => setShowManual(false)}
      />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7] text-white shadow-sm">
        <nav
          aria-label="Doctor navigation"
          className={`relative flex h-16 items-center justify-between gap-3 ${activeTab === "analytics" || activeTab === "history" ? "w-full px-3 sm:px-4" : CONTENT_CONTAINER}`}
        >
          {/* ── Left: Logo (anchored to content's left edge) ── */}
          <Link
            to={DOCTOR_PAGES.home}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="E-KALUSUGAN doctor dashboard"
            className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-white"
          >
            <img
              src="/assets/Logo.jpg"
              alt=""
              className="h-9 w-9 rounded-full border-2 border-white/40 object-cover"
            />
            <span className="text-sm font-bold tracking-wide">E-KALUSUGAN</span>
          </Link>

          {/* ── Right cluster: Tabs + Help + Profile (all anchored to right edge) ── */}
          <div className="hidden min-w-0 items-center gap-1 min-[641px]:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.tab}
                type="button"
                aria-label={item.label}
                aria-current={activeTab === item.tab ? "page" : undefined}
                onClick={() => setActiveTab(item.tab)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-medium transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white ${activeTab === item.tab ? "bg-white/15" : ""}`}
              >
                <item.icon size={17} aria-hidden="true" />
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              aria-label="Help"
              onClick={() => setShowManual(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-medium hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
            >
              <CircleHelp size={17} aria-hidden="true" />
              <span className="hidden xl:inline">Help</span>
            </button>
            <div className="ml-2 rounded-xl border border-white/20 bg-white/10 p-2.5">
              <DashboardProfileMenu
                identity={identity}
                onLogout={handleLogout}
                accentColor="#f97316"
                chipTextColor="#ffffff"
                subtitleColor="rgba(255,255,255,0.75)"
              />
            </div>
          </div>

          {/* ── Mobile: Hamburger toggle ── */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="doctor-mobile-menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white min-[641px]:hidden"
          >
            {mobileMenuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>

          {/* ── Mobile: Drawer ── */}
          {mobileMenuOpen && (
            <div
              id="doctor-mobile-menu"
              className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto border-t border-white/15 bg-[#1e4db7] p-4 shadow-lg min-[641px]:hidden"
            >
              <div className="mb-3 rounded-xl border border-white/20 bg-white/10 p-3">
                <DashboardProfileMenu
                  mobile
                  identity={identity}
                  onLogout={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  accentColor="#f97316"
                  chipTextColor="#ffffff"
                  subtitleColor="rgba(255,255,255,0.75)"
                  panelBg="rgba(255,255,255,0.1)"
                />
              </div>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  aria-current={activeTab === item.tab ? "page" : undefined}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white ${activeTab === item.tab ? "bg-white/15" : ""}`}
                >
                  <item.icon size={18} aria-hidden="true" />
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowManual(true);
                  setMobileMenuOpen(false);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
              >
                <CircleHelp size={18} aria-hidden="true" />
                Help
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* ── Tab Content ── */}
      {activeTab === "home" &&
        (initialLoading ? (
          <div className={`${CONTENT_CONTAINER} py-6`}>
            <DashboardSkeleton hero />
          </div>
        ) : (
          <DoctorHomeTab
            identity={identity}
            isAvailable={isAvailable}
            approvedLeave={approvedLeave}
            availLoading={availLoading}
            onToggleAvailability={handleToggleAvailability}
            onRequestLeave={() => navigate(ROUTES.DOCTOR_LEAVE_REQUESTS)}
            capacityCollapsed={capacityCollapsed}
            setCapacityCollapsed={setCapacityCollapsed}
            appointmentLimit={appointmentLimit}
            setAppointmentLimit={setAppointmentLimit}
            walkInLimit={walkInLimit}
            setWalkInLimit={setWalkInLimit}
            bookedCount={bookedCount}
            walkInCount={walkInCount}
            walkInPercent={walkInPercent}
            apptPercent={apptPercent}
            apptFull={apptFull}
            settingsLoading={settingsLoading}
            settingsSaved={settingsSaved}
            onApplySettings={handleApplySettings}
            waiting={waiting}
            serving={serving}
            doneQueues={doneQueues}
            servingQueue={servingQueue}
            nextQueue={nextQueue}
            done={done}
            priority={priority}
            queueLoading={loading || queueActionLoading}
            onCallNext={handleCallNext}
            onMarkDone={handleMarkDone}
            onConsult={(patient) => {
              setServingPatient(patient);
              setShowConsultModal(true);
            }}
            calledQueue={calledQueue}
            missedQueues={missedQueues}
            onQueueAction={handleQueueAction}
            error={error}
          />
        ))}
      {activeTab === "analytics" && (
        <DoctorAnalyticsTab
          dailyEntry={pathname === ROUTES.DOCTOR_DAILY_REPORT}
          onBack={() => setActiveTab("home")}
        />
      )}
      {activeTab === "history" && (
        <DoctorAppointmentsTab
          visits={historyVisits}
          loading={historyLoading}
          error={historyError}
          onRetry={() => setHistoryRetry((value) => value + 1)}
          onBack={() => setActiveTab("home")}
        />
      )}
      {leaveOpen && (
        <DoctorLeaveModal
          onClose={() => {
            setActiveTab("home");
            fetchDailySettings();
          }}
        />
      )}

      {/* ── Modals ── */}
      <ConsultationModal
        isOpen={showConsultModal}
        onClose={() => setShowConsultModal(false)}
        onSubmit={handleSaveConsultation}
        patient={servingPatient}
        loading={consultLoading}
      />
      {showLimitWarning && (
        <LimitWarningModal
          bookedCount={bookedCount}
          onConfirm={handleConfirmWarning}
          onCancel={handleCancelWarning}
        />
      )}
    </div>
  );
}
