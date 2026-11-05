import useLiveData from "@/hooks/useLiveData";
import { useCallback, useEffect, useRef, useState } from "react";
import { generatePath, Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, GitMerge, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import api from "@/services/api";
import AccountRecovery from "@/components/dashboards/staff/AccountRecovery";
import StaffNavbar from "@/components/dashboards/staff/StaffNavbar";
import ProfileCard from "@/components/common/ProfileCard";
import StatusBadge from "@/components/common/StatusBadge";
import UserManual from "@/components/common/UserManual";
import { Skeleton } from "@/components/common/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { ROUTES } from "@/constants/routes";
import { DENTAL_SERVICES } from "@/constants/medicalServices";

const VISITS_PER_PAGE = 10;
const SECONDARY_BUTTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" })
    : "Not recorded";
};

function formatServices(visit) {
  const raw = visit.services ?? visit.queue_services;
  let services = raw;
  try { services = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { /* Legacy services may be plain text. */ }
  if (Array.isArray(services) && services.length) {
    return services.map((service) => DENTAL_SERVICES.find(({ id }) => id === service)?.label || service).join(", ");
  }
  return (typeof services === "string" && services.trim()) || visit.reason || "Not recorded";
}

export default function StaffPatientProfile() {
  const { id } = useParams();
  return <PatientProfile key={id} id={id} />;
}

function PatientProfile({ id }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const [patient, setPatient] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const recoveryButtonRef = useRef(null);
  const [mergeSearch, setMergeSearch] = useState("");
  const [targets, setTargets] = useState([]);
  const [mergeQuery, setMergeQuery] = useState("");
  const [targetId, setTargetId] = useState("");
  const [mergeError, setMergeError] = useState("");
  const [merging, setMerging] = useState(false);
  const canManageAccount = user?.role === "staff" || user?.role === "admin";
  const profileRoute = user?.role === "doctor" ? ROUTES.DOCTOR_PATIENT_PROFILE
    : user?.role === "admin" ? ROUTES.ADMIN_PATIENT_PROFILE : ROUTES.STAFF_PATIENT_PROFILE;
  const backPath = user?.role === "doctor" ? ROUTES.DOCTOR_PATIENT_HISTORY
    : user?.role === "admin" ? ROUTES.ADMIN_DASHBOARD : ROUTES.STAFF_DASHBOARD;
  const backLabel = user?.role === "doctor" ? "Back to patient history"
    : user?.role === "admin" ? "Back to admin dashboard" : "Back to staff dashboard";

  useLiveData(useCallback(async (signal) => {
    try {
      const res = await api.get('/patients/' + id, { signal });
      if (!signal.aborted) { setPatient(res.data); setError(''); }
    } catch (err) { if (!signal.aborted) setError(err.message); }
  }, [id]), !showRecovery && !merging, retry);

  useEffect(() => {
    const term = mergeSearch.trim();
    const phone = term.replace(/\D/g, '');
    const params = /^\+?[\d\s-]+$/.test(term)
      ? new URLSearchParams({ phone: phone.length === 10 && phone.startsWith('9') ? '0' + phone : phone })
      : new URLSearchParams({ name: term });
    const timer = setTimeout(() => {
      setMergeQuery(canManageAccount && term.length >= 2 ? params.toString() : '');
      if (term.length < 2) setTargets([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [mergeSearch, canManageAccount]);
  useLiveData(useCallback(async (signal) => {
    try {
      const res = await api.get('/patients/search?' + mergeQuery, { signal });
      if (!signal.aborted) { setTargets((res.data || []).filter(patient => String(patient.patient_id) !== id)); setMergeError(''); }
    } catch (err) { if (!signal.aborted) setMergeError(err.message); }
  }, [mergeQuery, id]), canManageAccount && Boolean(mergeQuery) && !merging);

  const merge = async () => {
    if (merging || !targetId || !window.confirm("Move every queue visit to the selected patient and archive this record?")) return;
    setMerging(true);
    setMergeError("");
    try {
      await api.post(`/patients/${id}/merge`, { target_patient_id: Number(targetId), confirm: true });
      navigate(generatePath(profileRoute, { id: targetId }));
    } catch (err) { setMergeError(err.message); }
    finally { setMerging(false); }
  };

  const name = patient ? [patient.first_name, patient.middle_name, patient.last_name, patient.suffix].filter(Boolean).join(" ") || "Unnamed patient" : "";
  const initials = patient ? [patient.first_name?.[0], patient.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?" : "";
  const recoveryEligible = !!patient?.account?.is_active && !patient.archived_into_patient_id &&
    !!patient.account.phone && !!patient.date_of_birth &&
    ["first_name", "last_name", "barangay", "city"].every((key) => patient[key]?.trim());
  const visits = patient?.visits || [];
  const totalPages = Math.max(1, Math.ceil(visits.length / VISITS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const firstVisitIndex = (currentPage - 1) * VISITS_PER_PAGE;
  const pageVisits = visits.slice(firstVisitIndex, firstVisitIndex + VISITS_PER_PAGE);
  const details = patient ? [
    { label: "Date of birth", value: formatDate(patient.date_of_birth), Icon: CalendarDays },
    { label: "Gender", value: patient.gender || "Not recorded", Icon: UserRound },
    { label: "Mobile number", value: patient.contact_number || "Not recorded", Icon: Phone },
    { label: "Address", value: [patient.barangay, patient.city].filter(Boolean).join(", ") || "Not recorded", Icon: MapPin },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-100 font-[Poppins,sans-serif] text-slate-800">
      <StaffNavbar identity={identity} onHelp={() => setShowManual(true)} onLogout={() => { logout(); navigate(ROUTES.LOGIN); }} />
      <UserManual role={user?.role} isOpen={showManual} onClose={() => setShowManual(false)} />
      <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[#1a3a8f] sm:text-3xl">Patient profile</h1>
            <p className="mt-1 text-sm text-slate-500">Patient details and visit records</p>
          </div>
          <Link to={backPath} className={`${SECONDARY_BUTTON} shrink-0 self-start`}>
            <ArrowLeft size={17} aria-hidden="true" />
            {backLabel}
          </Link>
        </div>

        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="flex items-start gap-2"><AlertCircle size={18} className="shrink-0" aria-hidden="true" />{error}</p>
          <button type="button" onClick={() => { setError(""); setRetry((value) => value + 1); }} className="mt-3 min-h-11 rounded-xl border border-red-200 bg-white px-4 font-semibold hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600">Retry</button>
        </div>}

        {!patient && !error && <div role="status" aria-label="Loading patient profile" aria-busy="true" className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
          <span className="sr-only">Loading patient profile…</span>
          <div className="flex items-center gap-4"><Skeleton className="h-20 w-20 shrink-0 rounded-full" /><Skeleton className="h-8 w-2/3 sm:w-1/3" /></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((field) => <Skeleton key={field} className="h-12 w-full" />)}</div>
        </div>}

        {patient && <>
          <ProfileCard
            className="border-t-4 border-t-orange-500"
            name={name}
            initials={initials}
            eyebrow={`Patient #${patient.patient_id}`}
            badge={patient.archived_into_patient_id ? "Archived record" : patient.user_id ? "Registered patient" : "Walk-in patient"}
            action={canManageAccount && (
              <span className="group relative inline-flex shrink-0">
                <button
                  ref={recoveryButtonRef}
                  type="button"
                  aria-label="Start account recovery"
                  aria-haspopup="dialog"
                  aria-expanded={showRecovery}
                  aria-controls={showRecovery ? "account-recovery-panel" : undefined}
                  disabled={!recoveryEligible}
                  onClick={() => setShowRecovery(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-orange-500 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShieldCheck size={20} aria-hidden="true" />
                </button>
                <span role="tooltip" className="pointer-events-none invisible absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg group-hover:visible group-focus-within:visible">Account recovery</span>
              </span>
            )}
          >
            <div className="border-t border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <h3 className="mb-5 text-sm font-semibold text-[#1a3a8f]">Personal information</h3>
              <dl className="grid min-w-0 gap-x-6 gap-y-6 min-[360px]:grid-cols-2 lg:grid-cols-4">
                {details.map((detail) => <div key={detail.label} className="min-w-0">
                  <dt className="flex items-center gap-2 text-xs font-medium text-slate-500"><detail.Icon size={15} className="shrink-0" aria-hidden="true" />{detail.label}</dt>
                  <dd className={`mt-2 text-sm font-semibold leading-relaxed text-slate-800 [overflow-wrap:anywhere] ${detail.label === "Gender" ? "capitalize" : ""}`}>{detail.value}</dd>
                </div>)}
              </dl>
            </div>
            {patient.archived_into_patient_id && <p className="border-t border-orange-100 bg-orange-50 px-5 py-4 text-sm leading-relaxed text-orange-900 sm:px-7">
              This record was merged into <Link to={generatePath(profileRoute, { id: String(patient.archived_into_patient_id) })} className="font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-orange-600">patient #{patient.archived_into_patient_id}</Link>.
            </p>}
          </ProfileCard>

          {canManageAccount && showRecovery && <AccountRecovery
            patient={patient}
            eligible={recoveryEligible}
            onClose={() => { setShowRecovery(false); recoveryButtonRef.current?.focus(); }}
            onRecovered={(version) => setPatient((previous) => ({ ...previous, account: { ...previous.account, credential_version: version } }))}
          />}

          <section aria-labelledby="recent-visits-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
              <h2 id="recent-visits-title" className="flex items-center gap-2 text-lg font-bold text-[#1a3a8f]"><ClipboardList size={20} aria-hidden="true" />Recent visits</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{visits.length} {visits.length === 1 ? "visit" : "visits"}</span>
            </div>
            {!visits.length ? <div className="px-5 py-10 text-center sm:px-7"><ClipboardList size={28} className="mx-auto mb-3 text-slate-300" aria-hidden="true" /><p className="text-sm text-slate-500">No visits recorded yet.</p></div> : <>
              <div className="hidden md:block">
                <table className="w-full table-fixed text-left text-sm">
                  <caption className="sr-only">Patient visit records</caption>
                  <thead className="bg-slate-50 text-xs text-slate-500"><tr>
                    <th scope="col" className="w-[19%] px-5 py-3 font-semibold sm:pl-7">Date</th>
                    <th scope="col" className="w-[15%] px-4 py-3 font-semibold">Queue</th>
                    <th scope="col" className="w-[32%] px-4 py-3 font-semibold">Services</th>
                    <th scope="col" className="w-[16%] px-4 py-3 font-semibold">Visit type</th>
                    <th scope="col" className="w-[18%] px-4 py-3 font-semibold">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">{pageVisits.map((visit) => <tr key={visit.visit_id ?? visit.id} className="hover:bg-blue-50/30">
                    <td className="px-5 py-5 align-top text-slate-600 sm:pl-7">{formatDate(visit.visit_date ?? visit.created_at)}</td>
                    <td className="px-4 py-5 align-top font-semibold text-blue-800 [overflow-wrap:anywhere]">{visit.queue_number || "—"}</td>
                    <td className="px-4 py-5 align-top text-slate-700 [overflow-wrap:anywhere]">{formatServices(visit)}{visit.status_reason && <p className="mt-1 text-xs text-slate-500">Reason: {visit.status_reason}</p>}</td>
                    <td className="px-4 py-5 align-top text-slate-600">{visit.visit_type === "walk_in" || Number(visit.is_walk_in) === 1 ? "Walk-in" : "Appointment"}</td>
                    <td className="px-4 py-5 align-top"><StatusBadge status={visit.status} /></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-100 md:hidden">{pageVisits.map((visit) => <article key={visit.visit_id ?? visit.id} className="space-y-3 px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold text-blue-800 [overflow-wrap:anywhere]">{visit.queue_number || "Appointment"}</span><StatusBadge status={visit.status} /></div>
                <p className="text-sm font-medium leading-relaxed text-slate-800 [overflow-wrap:anywhere]">{formatServices(visit)}</p>
                <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500"><span>{formatDate(visit.visit_date ?? visit.created_at)}</span><span aria-hidden="true">·</span><span>{visit.visit_type === "walk_in" || Number(visit.is_walk_in) === 1 ? "Walk-in" : "Appointment"}</span></p>
                {visit.status_reason && <p className="text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere]">Reason: {visit.status_reason}</p>}
              </article>)}</div>
              <nav aria-label="Recent visits pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs sm:px-7">
                <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:gap-4">
                  <p aria-live="polite" className="text-slate-500">Showing {firstVisitIndex + 1}–{Math.min(firstVisitIndex + VISITS_PER_PAGE, visits.length)} of {visits.length}</p>
                  <span className="text-slate-600">Page {currentPage} of {totalPages}</span>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                  <button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className={SECONDARY_BUTTON}>
                    <ChevronLeft size={17} aria-hidden="true" />Previous
                  </button>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className={SECONDARY_BUTTON}>
                    Next<ChevronRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            </>}
          </section>

          {canManageAccount && !patient.user_id && !patient.archived_into_patient_id && <section aria-labelledby="merge-title" className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-7">
            <h2 id="merge-title" className="flex items-center gap-2 text-lg font-bold text-orange-900"><GitMerge size={20} aria-hidden="true" />Merge duplicate record</h2>
            <p className="mt-2 text-sm leading-relaxed text-orange-900">All queue visits will move to the selected patient. This record will be archived.</p>
            <fieldset disabled={merging} className="mt-5 min-w-0">
              <legend className="sr-only">Choose the correct patient record</legend>
              <label htmlFor="merge-search" className="text-sm font-semibold text-slate-700">Find the correct patient</label>
              <input id="merge-search" value={mergeSearch} onChange={(e) => { setMergeSearch(e.target.value); setTargetId(""); setTargets([]); setMergeError(""); }} placeholder="Name or mobile number" className="mt-2 block min-h-11 w-full max-w-lg rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-600" />
              <div className="mt-3 space-y-2">{targets.map((p) => <label key={p.patient_id} className="flex min-h-11 items-start gap-3 rounded-xl border border-orange-200 bg-white p-3 text-sm text-slate-700">
                <input type="radio" name="merge-target" value={p.patient_id} checked={targetId === String(p.patient_id)} onChange={() => setTargetId(String(p.patient_id))} className="mt-1 shrink-0 accent-blue-700" />
                <span className="min-w-0 [overflow-wrap:anywhere]">{[p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(" ")} · {formatDate(p.date_of_birth)} · {p.masked_contact || "No mobile number"}</span>
              </label>)}</div>
              <button type="button" onClick={merge} disabled={!targetId || merging} className="mt-4 min-h-11 rounded-xl bg-[#1e4db7] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{merging ? "Merging…" : "Merge into selected patient"}</button>
            </fieldset>
            {mergeError && <p role="alert" className="mt-3 text-sm text-red-700">{mergeError}</p>}
          </section>}
        </>}
      </main>
    </div>
  );
}
