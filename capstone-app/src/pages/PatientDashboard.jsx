import useLiveData from "@/hooks/useLiveData";
import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { History, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { useQueue } from "@/hooks/useQueue";
import { ROUTES } from "@/constants/routes";
import { CANCELLATION_REASONS } from "@/constants/queueReasons";
import api from "@/services/api";
import * as appointmentService from "@/services/appointmentService";
import * as queueService from "@/services/queueService";
import * as patientService from "@/services/patientService";
import StaffNavbar from "@/components/dashboards/staff/StaffNavbar";
import UserManual from "@/components/common/UserManual";
import GetQueueModal from "@/components/dashboards/patient/GetQueueModal";
import QueueReasonModal from "@/components/common/QueueReasonModal";
import PatientHomeTab from "@/components/dashboards/patient/PatientHomeTab";
import PatientQueueTab from "@/components/dashboards/patient/PatientQueueTab";
import PatientAppointmentsTab from "@/components/dashboards/patient/PatientAppointmentsTab";
import {
  formatQueueTime,
  hasActivePatientPriority,
} from "@/utils/queueDisplay";

const pages = {
  home: ROUTES.PATIENT_DASHBOARD,
  appointments: ROUTES.PATIENT_APPOINTMENT_HISTORY,
  queue: ROUTES.PATIENT_MY_QUEUE,
};

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const { queue, loading, error, lastUpdated, fetchMyQueue, submitQueue } =
    useQueue();
  const activeTab = Object.keys(pages).find((key) => pages[key] === pathname);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueReasonRequest, setQueueReasonRequest] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [queueStatus, setQueueStatus] = useState({});
  const [queueStatusError, setQueueStatusError] = useState("");
  const [queueStatusLoaded, setQueueStatusLoaded] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [doctorLeaveEnd, setDoctorLeaveEnd] = useState(null);
  const [doctorError, setDoctorError] = useState("");
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const fetchQueueStatus = useCallback(async (signal) => {
    try {
      const data = await queueService.getQueueStatus("dental", { signal });
      if (signal?.aborted) return;
      setQueueStatus(data || {});
      setQueueStatusError("");
    } catch {
      if (signal?.aborted) return;
      setQueueStatusError(
        "Unable to refresh the current queue line. Retrying automatically.",
      );
    } finally {
      if (!signal?.aborted) setQueueStatusLoaded(true);
    }
  }, []);
  const fetchDoctorAvailability = useCallback(async (signal) => {
    try {
      const doctors = (await api.get("/doctor", { signal }))?.data ?? [];
      if (signal?.aborted) return;
      const dentist = [...doctors].sort((a, b) => a.doctor_id - b.doctor_id)[0];
      setDoctorAvailability(
        dentist ? (Number(dentist.is_available ?? 1) !== 0 ? 1 : 0) : null,
      );
      setDoctorLeaveEnd(dentist?.leave_end ?? null);
      setDoctorError("");
    } catch {
      if (signal?.aborted) return;
      setDoctorError(
        "Unable to refresh dentist availability. Please check with staff.",
      );
    }
  }, []);
  const fetchProfile = useCallback(async (signal) => {
    try {
      const response = await patientService.getMyProfile({ signal });
      if (!signal?.aborted) setProfile(response?.data ?? null);
    } catch {
      /* Keep the last known profile while the connection recovers. */
    }
  }, []);
  const loadAppointments = useCallback(async (signal, background = false) => {
    if (!background) setApptLoading(true);
    try {
      const response = await appointmentService.getMyAppointments({ signal });
      if (signal?.aborted) return;
      setAppointments(response?.appointments ?? []);
      setAppointmentsError("");
    } catch (err) {
      if (signal?.aborted) return;
      setAppointmentsError(
        err.message || "Unable to load appointment history.",
      );
    } finally {
      if (!signal?.aborted) setApptLoading(false);
    }
  }, []);

  useLiveData(
    useCallback(
      async (signal, background) => {
        await Promise.all([
          fetchMyQueue(signal, background),
          fetchQueueStatus(signal),
          fetchDoctorAvailability(signal),
          fetchProfile(signal),
        ]);
        if (!signal.aborted) setInitialLoading(false);
      },
      [fetchMyQueue, fetchQueueStatus, fetchDoctorAvailability, fetchProfile],
    ),
  );
  useLiveData(loadAppointments, activeTab === "appointments");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const hasActiveQueue =
    queue && ["waiting", "called", "serving", "missed"].includes(queue.status);
  const registrationMessage =
    queueStatus.registration_message ||
    (doctorLeaveEnd
      ? "The dentist is on leave. Please approach clinic staff for assistance."
      : null);
  const priorityEligible = hasActivePatientPriority(profile);
  const go = (tab) => {
    navigate(pages[tab]);
  };
  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };
  const handleGetQueue = async (payload) => {
    try {
      await submitQueue(payload);
      setShowQueueModal(false);
      fetchMyQueue();
      fetchQueueStatus();
    } catch (err) {
      alert(err.message || "Failed to get queue number.");
      await fetchQueueStatus();
    }
  };
  const cancelQueue = async (reason) => {
    try {
      await queueService.cancelQueue(queue.id, reason);
      fetchMyQueue();
      fetchQueueStatus();
    } catch (err) {
      alert(err.message);
    }
  };
  if (!activeTab) return <Navigate to={ROUTES.PATIENT_DASHBOARD} replace />;
  return (
    <div className="min-h-dvh bg-gray-100 font-[Poppins,sans-serif] text-slate-800 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_:is(button,a,input,summary):focus-visible]:outline-2 [&_:is(button,a,input,summary):focus-visible]:outline-offset-4 [&_:is(button,a,input,summary):focus-visible]:outline-blue-600">
      <UserManual
        role="patient"
        isOpen={showManual}
        onClose={() => setShowManual(false)}
      />
      <a
        href="#patient-main"
        className="sr-only z-50 rounded-xl bg-white p-3 text-blue-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <StaffNavbar
        identity={identity}
        onHelp={() => setShowManual(true)}
        onLogout={handleLogout}
      />
      <main
        id="patient-main"
        className={
          activeTab === "home"
            ? "scroll-mt-16 pb-8"
            : "mx-auto w-full max-w-360 scroll-mt-16 px-4 py-6 sm:px-6 md:py-8 lg:px-8"
        }
      >
        {activeTab === "home" && (
          <PatientHomeTab
            queueStatus={queueStatus}
            doctorAvailability={
              doctorError ? null : doctorLeaveEnd ? 0 : doctorAvailability
            }
            doctorLeaveEnd={doctorLeaveEnd}
            doctorError={doctorError}
            hasActiveQueue={hasActiveQueue}
            registrationMessage={registrationMessage}
            queue={queue}
            queueError={error}
            queueStatusError={queueStatusError}
            loading={initialLoading}
            onGetQueue={() => setShowQueueModal(true)}
            onCancelQueue={() =>
              setQueueReasonRequest({
                title: "Why are you cancelling your queue?",
                reasons: CANCELLATION_REASONS,
              })
            }
            onGoAppointments={() => go("appointments")}
            onGoQueue={() => go("queue")}
          />
        )}
        {activeTab === "queue" && (
          <PatientQueueTab
            hasActiveQueue={hasActiveQueue}
            registrationMessage={registrationMessage}
            queue={queue}
            loading={loading}
            error={error}
            queueStatus={queueStatus}
            queueStatusError={queueStatusError}
            queueStatusLoaded={queueStatusLoaded}
            onGetQueue={() => setShowQueueModal(true)}
            onCancelQueue={() =>
              setQueueReasonRequest({
                title: "Why are you cancelling your queue?",
                reasons: CANCELLATION_REASONS,
              })
            }
            onBack={() => go("home")}
          />
        )}
        {activeTab === "appointments" && (
          <PatientAppointmentsTab
            appointments={appointments}
            apptLoading={apptLoading}
            error={appointmentsError}
            onRetry={() => loadAppointments()}
            onBack={() => go("home")}
          />
        )}
        {lastUpdated && (
          <p className="mt-4 flex flex-wrap items-center justify-center gap-2 px-4 text-center text-sm leading-5 text-slate-600">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${error || queueStatusError ? "bg-red-500" : "bg-emerald-500"}`}
            />
            {error || queueStatusError
              ? "Refresh unavailable"
              : "Queue auto-refresh every 5 seconds"}{" "}
            · Last updated {formatQueueTime(lastUpdated)} PHT
          </p>
        )}
      </main>
      <GetQueueModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        onSubmit={handleGetQueue}
        loading={loading}
        priorityEligible={priorityEligible}
        registrationMessage={registrationMessage}
      />
      <QueueReasonModal
        request={queueReasonRequest}
        onClose={() => setQueueReasonRequest(null)}
        onSubmit={cancelQueue}
      />
    </div>
  );
}
