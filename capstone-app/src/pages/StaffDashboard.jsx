import useLiveData from "@/hooks/useLiveData";
import { useState, useCallback } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Monitor,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { ROUTES } from "@/constants/routes";
import { CANCELLATION_REASONS } from "@/constants/queueReasons";
import api from "@/services/api";
import { callNextQueue, updateQueueStatus } from "@/services/queueService";
import StaffNavbar from "@/components/dashboards/staff/StaffNavbar";
import StaffHeroBanner from "@/components/dashboards/staff/StaffHeroBanner";
import QueuePanel from "@/components/dashboards/staff/QueuePanel";
import QueueReasonModal from "@/components/common/QueueReasonModal";
import { DashboardSkeleton } from "@/components/common/LoadingState";
import UserManual from "@/components/common/LazyUserManual";
import WalkInForm from "@/components/dashboards/staff/WalkInForm";
import AccountRecoverySearch from "@/components/dashboards/staff/AccountRecoverySearch";
import ToastNotifications from "@/components/common/ToastNotifications";
import useSmsToasts from "@/hooks/useSmsToasts";


const ALLOWED_ROUTES = [
  ROUTES.STAFF_DASHBOARD,
  ROUTES.STAFF_ACCOUNT_RECOVERY,
  ROUTES.STAFF_WALK_IN,
];

const PAGE_HEADINGS = {
  [ROUTES.STAFF_ACCOUNT_RECOVERY]: "Account recovery",
  [ROUTES.STAFF_WALK_IN]: "Walk-in registration",
  [ROUTES.STAFF_DASHBOARD]: "Dental queue management",
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState("");
  const [queueReasonRequest, setQueueReasonRequest] = useState(null);
  const [doctorAvailable, setDoctorAvailable] = useState(null);
  const [doctorLeaveEnd, setDoctorLeaveEnd] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const { toasts, dismissToast, trackSmsStatuses } = useSmsToasts();

  const recoveryPage = pathname === ROUTES.STAFF_ACCOUNT_RECOVERY;
  const walkInPage = pathname === ROUTES.STAFF_WALK_IN;

  const fetchQueue = useCallback(async (signal) => {
    try {
      const data = await api.get("/queue?category=dental", { signal });
      if (signal?.aborted) return;
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      const dentalQueues = list.filter((queue) => queue.category === "dental");
      setQueues(dentalQueues);
      trackSmsStatuses(
        dentalQueues.map((queue) => ({
          // Track the ticket so replacing its SMS job still reports the new status.
          id: queue.id,
          state: queue.sms_state,
          provider_status: queue.sms_provider_status,
          label: `Queue alert SMS for ${queue.queue_number}`,
        })),
      );
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      if (signal?.aborted) return;
      setError(
        err.message || "Unable to refresh the dental queue. Please try again.",
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [trackSmsStatuses]);

  const fetchDoctorAvailability = useCallback(async (signal) => {
    try {
      const data = await api.get("/doctor", { signal });
      if (signal?.aborted) return;
      // Registration uses the active dentist with the lowest ID.
      const dentist = [...(data?.data ?? [])].sort(
        (a, b) => a.doctor_id - b.doctor_id,
      )[0];
      setDoctorAvailable(
        dentist ? Boolean(Number(dentist.is_available)) : null,
      );
      setDoctorLeaveEnd(dentist?.leave_end ?? null);
    } catch {
      if (signal?.aborted) return;
      setDoctorAvailable(null);
      setDoctorLeaveEnd(null);
    }
  }, []);

  const refresh = useCallback(
    (signal) => Promise.all([fetchQueue(signal), fetchDoctorAvailability(signal)]),
    [fetchQueue, fetchDoctorAvailability],
  );

  useLiveData(refresh);

  const currentServing =
    queues.find((queue) => ["called", "serving"].includes(queue.status)) ??
    null;
  const waiting = queues.filter((queue) => queue.status === "waiting");

  const handleCallNext = async () => {
    if (
      loading ||
      calling ||
      currentServing?.status === "called" ||
      (!currentServing && !waiting.length)
    ) {
      return;
    }
    setCalling(true);
    setError("");
    try {
      if (currentServing?.status === "serving") {
        const completed = await updateQueueStatus(currentServing.id, "done");
        setQueues((previous) =>
          previous.map((queue) =>
            queue.id === completed.id ? completed : queue,
          ),
        );
      }
      if (waiting.length) {
        const patient = await callNextQueue("dental");
        setQueues((previous) => [
          patient,
          ...previous.filter((queue) => queue.id !== patient.id),
        ]);
      }
      await fetchQueue();
    } catch (err) {
      await fetchQueue();
      setError(err.message || "Failed to call the next patient.");
    } finally {
      setCalling(false);
    }
  };

  const submitQueueReason = async (reason) => {
    const { id, status } = queueReasonRequest;
    setCalling(true);
    try {
      await api.patch(`/queue/${id}/status`, { status, reason });
      await fetchQueue();
    } catch (err) {
      await fetchQueue();
      setError(err.message || "Failed to update the queue.");
    } finally {
      setCalling(false);
    }
  };

  const handleQueueAction = async (id, action) => {
    setCalling(true);
    try {
      if (action === "present") {
        await api.patch(`/queue/${id}/status`, { status: "serving" });
      } else {
        await api.post(`/queue/${id}/${action}`);
      }
      await fetchQueue();
    } catch (err) {
      await fetchQueue();
      setError(err.message || "Unable to update this ticket.");
    } finally {
      setCalling(false);
    }
  };

  const stats = [
    {
      label: "Waiting patients",
      value: waiting.length,
      icon: Users,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Priority waiting",
      value: waiting.filter((queue) => queue.type === "priority").length,
      icon: ShieldCheck,
      color: "bg-orange-50 text-orange-700",
    },
    {
      label: "Walk-ins today",
      value: queues.filter((queue) => queue.is_walk_in).length,
      icon: Clock3,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Completed today",
      value: queues.filter((queue) => queue.status === "done").length,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  if (!ALLOWED_ROUTES.includes(pathname)) {
    return <Navigate to={ROUTES.STAFF_DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-[Poppins,sans-serif] text-slate-800">
      <ToastNotifications toasts={toasts} onDismiss={dismissToast} />
      <UserManual
        role="staff"
        isOpen={showManual}
        onClose={() => setShowManual(false)}
      />
      <StaffNavbar
        identity={identity}
        onHelp={() => setShowManual(true)}
        onLogout={() => {
          logout();
          navigate(ROUTES.LOGIN);
        }}
      />
      <QueueReasonModal
        request={queueReasonRequest}
        onClose={() => setQueueReasonRequest(null)}
        onSubmit={submitQueueReason}
      />
      <main className="mx-auto w-full max-w-[1800px] space-y-3 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4 lg:space-y-5 lg:px-5 lg:py-5 2xl:px-8">
        <StaffHeroBanner
          identity={identity}
          doctorAvailable={doctorAvailable}
          doctorLeaveEnd={doctorLeaveEnd}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {walkInPage && (
              <Link
                to={ROUTES.STAFF_DASHBOARD}
                className="mb-1 block text-sm text-blue-700"
              >
                ← Back to queue management
              </Link>
            )}
            <h2 className="text-base font-bold text-[#1a3a8f] sm:text-lg">
              {PAGE_HEADINGS[pathname] ?? "Dental queue management"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {!recoveryPage && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.STAFF_ACCOUNT_RECOVERY)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:gap-2 sm:px-4"
              >
                <ShieldCheck size={16} aria-hidden="true" />
                Account recovery
              </button>
            )}
            {recoveryPage ? (
              <button
                type="button"
                onClick={() => navigate(ROUTES.STAFF_DASHBOARD)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 sm:gap-2 sm:px-4"
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Back to queue management
              </button>
            ) : (
              <a
                href={ROUTES.GENERAL_QUEUE_MONITOR}
                target="_blank"
                rel="opener"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:gap-2 sm:px-4"
              >
                <Monitor size={16} aria-hidden="true" />
                Open dental monitor
                <span className="sr-only"> (new tab)</span>
              </a>
            )}
          </div>
        </div>
        {recoveryPage ? (
          <AccountRecoverySearch />
        ) : walkInPage ? (
          <WalkInForm onSuccess={fetchQueue} doctorLeaveEnd={doctorLeaveEnd} />
        ) : loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section
              aria-label="Today's dental queue summary"
              className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm sm:gap-3 sm:p-3 lg:p-4"
                >
                  <span className={`rounded-xl p-2 sm:p-2.5 ${stat.color}`}>
                    <stat.icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                      {loading ? "—" : stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </section>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <p>{error} Displayed queue information may be outdated.</p>
              </div>
            )}
            <div className="grid grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <QueuePanel
                currentServing={currentServing}
                nextQueue={waiting}
                onCallNext={handleCallNext}
                missedQueues={queues.filter(
                  (queue) => queue.status === "missed",
                )}
                onQueueAction={handleQueueAction}
                onCancelQueue={(id) =>
                  setQueueReasonRequest({
                    title: "Reason for cancellation",
                    reasons: CANCELLATION_REASONS,
                    id,
                    status: "cancelled",
                  })
                }
                loading={loading || calling}
              />
              <WalkInForm
                onSuccess={fetchQueue}
                doctorLeaveEnd={doctorLeaveEnd}
              />
            </div>
          </>
        )}
        <p className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
          <span
            className={`h-2 w-2 rounded-full ${error ? "bg-amber-500" : "bg-emerald-500"}`}
            aria-hidden="true"
          />
          {error ? "Refresh unavailable" : "Auto-refresh every 5 seconds"}
          {lastUpdated && (
            <span>
              · Last updated{" "}
              {lastUpdated.toLocaleTimeString("en-PH", {
                timeZone: "Asia/Manila",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </p>
      </main>
    </div>
  );
}
