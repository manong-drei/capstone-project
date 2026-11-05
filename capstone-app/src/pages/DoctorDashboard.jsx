import useLiveData from "@/hooks/useLiveData";
import { useState, useCallback, useRef } from "react";
import {
  Navigate,
  matchPath,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { useQueue } from "@/hooks/useQueue";
import { ROUTES } from "@/constants/routes";
import { QUEUE_STATUS } from "@/constants/queue";
import api from "@/services/api";

import StaffNavbar from "@/components/dashboards/staff/StaffNavbar";
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
  const [showManual, setShowManual] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [servingPatient, setServingPatient] = useState(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [queueActionLoading, setQueueActionLoading] = useState(false);
  const [capacityCollapsed, setCapacityCollapsed] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [pendingSettings, setPendingSettings] = useState(null);

  const settingsDirty = useRef(false);

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

  const fetchDailySettings = useCallback(async (signal) => {
    try {
      const data = await api.get(
        `/doctor/daily-settings?date=${clinicToday()}`, { signal },
      );
      if (signal?.aborted) return;
      if (!settingsDirty.current) {
        setAppointmentLimit(data.appointment_limit ?? 10);
        setWalkInLimit(data.walk_in_limit ?? 0);
      }
      setBookedCount(data.booked_count ?? 0);
      setWalkInCount(data.walkin_count ?? 0);
      setIsAvailable(data.is_available !== 0);
      setApprovedLeave(data.approved_leave ?? null);
    } catch (err) {
      if (import.meta.env.DEV) console.error("fetchDailySettings error:", err);
    }
  }, []);

  const persistSettings = async (apptLimit, wiLimit) => {
    setSettingsLoading(true);
    try {
      await api.put("/doctor/daily-settings", {
        date: clinicToday(),
        appointment_limit: apptLimit,
        walk_in_limit: wiLimit,
      });
      settingsDirty.current = false;
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
    settingsDirty.current = false;
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
      settingsDirty.current = false;
      setIsAvailable(val);
    } catch (err) {
      alert(err.message || "Failed to update availability.");
    } finally {
      setAvailLoading(false);
    }
  };

  useLiveData(useCallback(async (signal, background) => {
    await Promise.all([fetchAllQueues(signal, background), fetchDailySettings(signal)]);
    if (!signal.aborted) setInitialLoading(false);
  }, [fetchAllQueues, fetchDailySettings]));

  useLiveData(useCallback(async (signal, background) => {
    if (!background) setHistoryLoading(true);
    try {
      const data = await api.get('/doctor/patient-history', { signal });
      if (!signal.aborted) { setHistoryVisits(data.visits ?? []); setHistoryError(''); }
    } catch (err) { if (!signal.aborted) setHistoryError(err.message); }
    finally { if (!signal.aborted) setHistoryLoading(false); }
  }, []), activeTab === "history", historyRetry);

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

      <StaffNavbar
        identity={identity}
        onHelp={() => setShowManual(true)}
        onLogout={handleLogout}
        sections={NAV_ITEMS.map((item) => ({
          ...item,
          active: activeTab === item.tab,
          onSelect: () => setActiveTab(item.tab),
        }))}
      />

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
            setAppointmentLimit={(value) => { settingsDirty.current = true; setAppointmentLimit(value); }}
            walkInLimit={walkInLimit}
            setWalkInLimit={(value) => { settingsDirty.current = true; setWalkInLimit(value); }}
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
