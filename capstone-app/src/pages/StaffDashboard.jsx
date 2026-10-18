import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3, Monitor, RefreshCw, ShieldCheck, Users } from "lucide-react";
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
import UserManual from "@/components/common/UserManual";
import WalkInForm from "@/components/dashboards/staff/WalkInForm";
import AccountRecoverySearch from "@/components/dashboards/staff/AccountRecoverySearch";
import ToastNotifications from "@/components/common/ToastNotifications";
import useSmsToasts from "@/hooks/useSmsToasts";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState("");
  const [queueReasonRequest, setQueueReasonRequest] = useState(null);
  const [doctorAvailable, setDoctorAvailable] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showRecoverySearch, setShowRecoverySearch] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const { toasts, dismissToast, trackSmsStatuses } = useSmsToasts();

  const fetchQueue = useCallback(async () => {
    try {
      const data = await api.get("/queue?category=dental");
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      const dentalQueues = list.filter((queue) => queue.category === "dental");
      setQueues(dentalQueues);
      trackSmsStatuses(dentalQueues.map((queue) => ({
        id: queue.sms_job_id,
        state: queue.sms_state,
        provider_status: queue.sms_provider_status,
        label: `Queue alert SMS for ${queue.queue_number}`,
      })));
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.message || "Unable to refresh the dental queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [trackSmsStatuses]);

  const fetchDoctorAvailability = useCallback(async () => {
    try {
      const data = await api.get("/doctor");
      // Registration uses the dentist with the lowest ID.
      const dentist = [...(data?.data ?? [])].sort((a, b) => a.doctor_id - b.doctor_id)[0];
      setDoctorAvailable(dentist ? Boolean(Number(dentist.is_available)) : null);
    } catch {
      setDoctorAvailable(null);
    }
  }, []);

  const refresh = useCallback(() => Promise.all([fetchQueue(), fetchDoctorAvailability()]), [fetchQueue, fetchDoctorAvailability]);
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleCallNext = async () => {
    if (loading || calling || currentServing?.status === 'called' || (!currentServing && !waiting.length)) return;
    setCalling(true);
    setError("");
    try {
      if (currentServing?.status === 'serving') {
        const completed = await updateQueueStatus(currentServing.id, 'done');
        setQueues((previous) => previous.map(queue => queue.id === completed.id ? completed : queue));
      }
      if (waiting.length) {
        const patient = await callNextQueue("dental");
        setQueues((previous) => [patient, ...previous.filter((queue) => queue.id !== patient.id)]);
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
      if (action === 'present') await api.patch(`/queue/${id}/status`, { status: 'serving' });
      else await api.post(`/queue/${id}/${action}`);
      await fetchQueue();
    } catch (err) {
      await fetchQueue();
      setError(err.message || 'Unable to update this ticket.');
    } finally { setCalling(false); }
  };

  const currentServing = queues.find((queue) => ['called', 'serving'].includes(queue.status)) ?? null;
  const waiting = queues.filter((queue) => queue.status === "waiting");
  const stats = [
    { label: "Waiting patients", value: waiting.length, icon: Users, color: "bg-blue-50 text-blue-700" },
    { label: "Priority waiting", value: waiting.filter((queue) => queue.type === "priority").length, icon: ShieldCheck, color: "bg-orange-50 text-orange-700" },
    { label: "Walk-ins today", value: queues.filter((queue) => queue.is_walk_in).length, icon: Clock3, color: "bg-violet-50 text-violet-700" },
    { label: "Completed today", value: queues.filter((queue) => queue.status === "done").length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-[Poppins,sans-serif] text-slate-800">
      <ToastNotifications toasts={toasts} onDismiss={dismissToast} />
      <UserManual role="staff" isOpen={showManual} onClose={() => setShowManual(false)} />
      <StaffNavbar identity={identity} onHelp={() => setShowManual(true)} onLogout={() => { logout(); navigate(ROUTES.LOGIN); }} />
      <QueueReasonModal request={queueReasonRequest} onClose={() => setQueueReasonRequest(null)} onSubmit={submitQueueReason} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <StaffHeroBanner identity={identity} doctorAvailable={doctorAvailable} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1a3a8f]">Dental queue management</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowRecoverySearch((visible) => !visible)} aria-expanded={showRecoverySearch} aria-controls="account-recovery-search" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"><ShieldCheck size={16} aria-hidden="true" />Account recovery</button>
            <button type="button" onClick={refresh} disabled={loading || calling} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"><RefreshCw size={16} aria-hidden="true" />Refresh</button>
            <a href={ROUTES.GENERAL_QUEUE_MONITOR} target="_blank" rel="opener" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><Monitor size={16} aria-hidden="true" />Open dental monitor<span className="sr-only"> (new tab)</span></a>
          </div>
        </div>
        <section aria-label="Today's dental queue summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <span className={`rounded-xl p-3 ${stat.color}`}><stat.icon size={21} aria-hidden="true" /></span>
              <div><p className="text-xs font-medium text-slate-500">{stat.label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{loading ? "—" : stat.value}</p></div>
            </div>
          ))}
        </section>
        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><p>{error} Displayed queue information may be outdated.</p></div>}
        {showRecoverySearch && <AccountRecoverySearch />}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <QueuePanel currentServing={currentServing} nextQueue={waiting} onCallNext={handleCallNext}
            missedQueues={queues.filter(queue => queue.status === 'missed')} onQueueAction={handleQueueAction}
            onCancelQueue={(id) => setQueueReasonRequest({ title: "Reason for cancellation", reasons: CANCELLATION_REASONS, id, status: "cancelled" })}
            loading={loading || calling} />
          <WalkInForm onSuccess={fetchQueue} />
        </div>
        <p className="flex flex-wrap items-center justify-center gap-2 pb-2 text-xs text-slate-500">
          <span className={`h-2 w-2 rounded-full ${error ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
          {error ? "Refresh unavailable" : "Auto-refresh every 15 seconds"}
          {lastUpdated && <span>· Last updated {lastUpdated.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" })}</span>}
        </p>
      </main>
    </div>
  );
}
