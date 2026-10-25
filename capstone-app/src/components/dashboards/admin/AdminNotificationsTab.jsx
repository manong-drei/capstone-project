import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Clock,
  Inbox,
  Info,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import api from "@/services/api";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const STATUS_TONES = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};
const JOBS_PER_PAGE = 10;

function toneFor(status) {
  const s = String(status).toLowerCase();
  if (["sent", "delivered", "success", "accepted"].includes(s))
    return "emerald";
  if (["failed", "error", "undelivered", "rejected"].includes(s)) return "rose";
  if (["unknown", "queued", "pending", "submitted", "submitting", "sending"].includes(s))
    return "amber";
  return "slate";
}

const purposeLabel = (job) =>
  job.purpose === "queue_alert"
    ? `Queue alert #${job.queue_id}`
    : `Account activation #${job.user_id}`;

const detailText = (job) =>
  job.state === "unknown"
    ? "Submission uncertain; check Semaphore before replacing."
    : job.last_error || "—";

const formatDate = (value) =>
  new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" });

function StatusBadge({ job }) {
  const label = job.state === "cancelled" ? job.state : job.provider_status || job.state || "unknown";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${
        STATUS_TONES[toneFor(label)]
      }`}
    >
      {label}
    </span>
  );
}

function JobDetails({ job }) {
  return (
    <div className="space-y-1 text-xs leading-relaxed text-slate-500">
      <p>Job #{job.id} · Attempts: {job.attempts}</p>
      {job.provider_message_id && (
        <p className="break-all">Provider ref: {job.provider_message_id}</p>
      )}
      {(job.state === "unknown" || job.last_error) && <p>{detailText(job)}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */

export default function AdminNotificationsTab() {
  const [threshold, setThreshold] = useState("5");
  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [message, setMessage] = useState(null); // { text, tone: 'ok' | 'error' }
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadJobs = useCallback(async (showSpinner = false) => {
    if (showSpinner && mounted.current) setRefreshing(true);
    try {
      const result = await api.get("/admin/sms-jobs");
      if (mounted.current) {
        const nextJobs = result.jobs ?? [];
        setJobs(nextJobs);
        setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(nextJobs.length / JOBS_PER_PAGE))));
        setJobsError(null);
      }
    } catch (err) {
      if (mounted.current) setJobsError(err.message);
    } finally {
      if (mounted.current) {
        setJobsLoaded(true);
        if (showSpinner) setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    api
      .get("/admin/sms-settings")
      .then((result) => {
        if (active) {
          setThreshold(String(result.data.threshold));
          setLoaded(true);
        }
      })
      .catch((err) => {
        if (active) setMessage({ text: err.message, tone: "error" });
      });

    loadJobs();
    const interval = setInterval(() => loadJobs(), 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadJobs]);

  const save = async (event) => {
    event.preventDefault();
    const value = Number(threshold);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      setMessage({
        text: "Choose a whole number from 1 to 100.",
        tone: "error",
      });
      return;
    }
    setBusy(true);
    try {
      await api.put("/admin/sms-settings", { threshold: value });
      setMessage({
        text: "SMS threshold saved. Existing suppressed tickets stay suppressed.",
        tone: "ok",
      });
    } catch (err) {
      setMessage({ text: err.message, tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const disabled = !loaded || busy;
  const totalPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE));
  const firstJobIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const pageJobs = jobs.slice(firstJobIndex, firstJobIndex + JOBS_PER_PAGE);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* ---------------- settings card ---------------- */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <BellRing className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 sm:text-lg">
              SMS notifications
            </h3>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Queue alerts and account activation messages.
            </p>
          </div>
        </div>

        <form
          onSubmit={save}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="sms-threshold"
              className="block text-sm font-medium text-slate-700"
            >
              Notify within the next
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="sms-threshold"
                type="number"
                min="1"
                max="100"
                step="1"
                inputMode="numeric"
                required
                value={threshold}
                onChange={(event) => setThreshold(event.target.value)}
                disabled={disabled}
                className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />
                patients
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:w-auto"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {busy ? "Saving…" : "Save"}
          </button>
        </form>

        {/* info note */}
        <div className="mt-4 flex gap-2.5 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-[13px] leading-relaxed text-slate-600">
            One alert per eligible ticket. Patients joining within this range
            receive no queue SMS. This setting applies to{" "}
            <span className="font-medium">dental</span> and{" "}
            <span className="font-medium">general</span> queues.
          </p>
        </div>

        {/* status message */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-3 flex items-start gap-2.5 rounded-xl p-3 text-[13px] ring-1 ring-inset ${
              message.tone === "ok"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-rose-50 text-rose-800 ring-rose-200"
            }`}
          >
            {message.tone === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="break-words">{message.text}</span>
          </div>
        )}
      </section>

      {/* ---------------- activity card ---------------- */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-800">
              Recent SMS activity
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-slate-400 sm:inline">
              Auto-refreshes every 15s
            </span>
            <button
              type="button"
              onClick={() => loadJobs(true)}
              disabled={refreshing}
              aria-label="Refresh SMS activity"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Latest 100 queue alerts and account activation jobs. 10 per page.
        </p>

        {jobsError && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            {jobsError}
          </p>
        )}

        {!jobsLoaded ? (
          <div role="status" className="mt-4 flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading SMS activity…
          </div>
        ) : !jobs.length ? (
          !jobsError && <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
            <Inbox className="h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No SMS jobs yet
            </p>
            <p className="mt-0.5 text-[12px] text-slate-400">
              Queue alerts and account activation messages will appear here once they are triggered.
            </p>
          </div>
        ) : (
          <>
            {/* mobile: cards */}
            <ul className="mt-3 divide-y divide-slate-100 md:hidden">
              {pageJobs.map((job) => (
                <li key={job.id} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                      {purposeLabel(job)}
                    </p>
                    <StatusBadge job={job} />
                  </div>

                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="tabular-nums">{job.masked_recipient}</span>
                  </p>

                  <div className="mt-1.5">
                    <JobDetails job={job} />
                  </div>

                  <div className="mt-1.5 space-y-1 text-[11px] text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Created: {formatDate(job.created_at)}
                    </p>
                    <p>Updated: {formatDate(job.updated_at)}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* desktop: table */}
            <div className="mt-4 hidden overflow-hidden rounded-xl ring-1 ring-slate-200 md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Purpose
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Recipient
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Details
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pageJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {purposeLabel(job)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">
                          {job.masked_recipient}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge job={job} />
                        </td>
                        <td className="max-w-[22rem] px-4 py-3 text-slate-600">
                          <JobDetails job={job} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          <p>{formatDate(job.created_at)}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Updated: {formatDate(job.updated_at)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <nav aria-label="SMS activity pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
              <p aria-live="polite" className="text-slate-500">
                Showing {firstJobIndex + 1}–{Math.min(firstJobIndex + JOBS_PER_PAGE, jobs.length)} of {jobs.length}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400">
                  Previous
                </button>
                <span className="whitespace-nowrap text-slate-600">Page {currentPage} of {totalPages}</span>
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400">
                  Next
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}
