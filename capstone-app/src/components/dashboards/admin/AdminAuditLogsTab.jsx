import useLiveData from "@/hooks/useLiveData";
import { useCallback, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import api from "@/services/api";

const ACTIONS = {
  "account.created": "Account created",
  "account.deactivated": "Account deactivated",
  "account.reactivated": "Account reactivated",
  "password.issued": "Temporary password issued",
  "password.replaced": "Temporary password replaced",
  "password.recovery_completed": "Recovery completed — password changed",
  "password.recovery_failed": "Recovery failed",
  "patient.merged": "Patient records merged",
  "patient.duplicate_override": "Duplicate warning overridden",
  "sms.threshold_changed": "SMS threshold changed",
  "auth.login": "Admin sign-in",
  "access.denied": "Access denied",
};
const EMPTY_FILTERS = {
  dateFrom: "",
  dateTo: "",
  actor: "",
  action: "",
  outcome: "",
};
const clinicDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric",
});
const clinicTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit", hour12: true,
});
const roles = { admin: "Administrator", doctor: "Doctor", staff: "Staff", patient: "Patient" };
const targetTypes = {
  user: "account", patient: "patient record", doctor: "doctor record", admin: "admin area",
  sms_settings: "SMS settings", queue: "queue ticket", appointment: "appointment", patient_history: "patient history",
};
const recoveryReasons = {
  incorrect_code: "An incorrect verification code was entered",
  attempts_exhausted: "Too many incorrect verification codes were entered",
  delivery_failed: "The verification text could not be delivered",
};
const accountStatus = { 1: "Active", 0: "Deactivated", true: "Active", false: "Deactivated" };
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-2 focus:outline-blue-600";
const buttonClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function eventSummary(event, details) {
  const actor = event.actor_name && !/^User #\d+$/.test(event.actor_name)
    ? event.actor_name
    : roles[event.actor_role] || "An unknown actor";
  const role = roles[details.assigned_role || event.target_role];
  const name = details.patient_name || event.target_name;
  const target = name
    ? `${name}${role ? ` (${role})` : ""}`
    : `the ${role && event.target_type === "user" ? `${role.toLowerCase()} account` : targetTypes[event.target_type] || "requested resource"}`;
  const succeeded = event.outcome === "success";
  const activity = {
    "account.created": ["created an account for", "create an account for", name ? target : role ? `a ${role.toLowerCase()}` : "a new user"],
    "account.deactivated": ["deactivated", "deactivate", target],
    "account.reactivated": ["reactivated", "reactivate", target],
    "password.issued": ["issued a temporary password for", "issue a temporary password for", target],
    "password.replaced": ["replaced the temporary password for", "replace the temporary password for", target],
    "patient.merged": ["merged the record for", "merge the record for", name ? name : "the patient"],
    "patient.duplicate_override": ["overrode a duplicate warning for", "override a duplicate warning for", name ? name : "the patient"],
    "sms.threshold_changed": ["changed", "change", "the SMS queue threshold"],
  }[event.action];
  if (activity) {
    const [past, verb, object] = activity;
    return `${actor} ${succeeded ? past : `could not ${verb}`} ${object}.`;
  }
  switch (event.action) {
    case "password.recovery_completed":
      return `${name || actor} reset their password via SMS.`;
    case "password.recovery_failed":
      return `An SMS password recovery attempt for ${name || "the patient"} failed.`;
    case "auth.login":
      return succeeded ? `${actor} signed in to the admin dashboard.` : `A sign-in attempt for ${target} failed.`;
    case "access.denied":
      return `${actor} was denied access to ${target}.`;
    default:
      return `${actor} performed an action involving ${target}.`;
  }
}

function EventDetails({ event, details }) {
  const status = details.changes?.is_active;
  const threshold = details.changes?.threshold;
  const fields = [
    ["Account status", status && `${accountStatus[status.from] ?? "Unavailable"} → ${accountStatus[status.to] ?? "Unavailable"}`],
    ["SMS queue threshold", threshold && `${threshold.from ?? "Unavailable"} → ${threshold.to ?? "Unavailable"}`],
    ["Credential delivery", { sms: "SMS", in_person: "In person" }[details.method]],
    ["Masked phone", details.phone],
    ["Patient record", details.patient_id && `#${details.patient_id}`],
    ["Merged from patient", details.source_patient_id && `#${details.source_patient_id}`],
    ["Merged into patient", details.target_patient_id && `#${details.target_patient_id}`],
    ["Possible duplicate records", details.possible_patient_ids?.map((id) => `#${id}`).join(", ")],
    ["Recovery reference", details.recovery_id],
    ["HTTP response", details.http_status],
    ["Recorded at (UTC)", <time dateTime={event.created_at}>{event.created_at}</time>],
  ];
  const references = [
    `Event #${event.id}`,
    event.actor_user_id && `Actor #${event.actor_user_id}`,
    event.target_id && `Target ${event.target_type === "user" ? "user" : targetTypes[event.target_type] || "record"} #${event.target_id}`,
  ].filter(Boolean);
  return (
    <details className="mt-3 border-t border-slate-100 pt-3 text-sm">
      <summary className="w-fit cursor-pointer font-semibold text-blue-800">
        View details
      </summary>
      <dl className="mt-3 space-y-2 text-xs text-slate-600">
        {fields.filter(([, value]) => value != null && value !== "").map(([label, value]) => (
          <div key={label} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <dt className="font-semibold">{label}</dt>
            <dd className="min-w-0 wrap-anywhere">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-slate-500">{references.join(" · ")}</p>
    </details>
  );
}

export default function AdminAuditLogsTab() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState({
    events: [],
    pagination: { page: 1, total: 0, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useLiveData(
    useCallback(
      async (signal) => {
        try {
          const data = await api.get("/admin/audit-logs", {
            params: { ...filters, page, limit: 10 },
            signal,
          });
          if (!signal.aborted) {
            setResult(data);
            setPage(data.pagination.page);
            setError("");
          }
        } catch (err) {
          if (!signal.aborted) setError(err.message);
        } finally {
          if (!signal.aborted) setLoading(false);
        }
      },
      [filters, page],
    ),
    true,
    refresh,
  );
  const reload = () => {
    setLoading(true);
    setError("");
    setRefresh((value) => value + 1);
  };
  const apply = (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPage(1);
    setFilters({ ...draft });
  };
  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setFilters({ ...EMPTY_FILTERS });
    setPage(1);
    setLoading(true);
    setError("");
  };
  const changePage = (next) => {
    setLoading(true);
    setError("");
    setPage(next);
  };
  return (
    <section aria-labelledby="audit-heading" className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-1 h-7 w-7 shrink-0 text-blue-800"
            aria-hidden="true"
          />
          <div>
            <h2 id="audit-heading" className="text-xl font-bold text-slate-800">
              Audit Logs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review administrator activity and patient account recovery.
              Event summaries use Philippine Standard Time (UTC+8).
            </p>
          </div>
        </div>
        <button
          type="button"
          className={`${buttonClass} inline-flex items-center gap-2`}
          onClick={reload}
          disabled={loading}
          aria-label="Refresh audit logs"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>
      <form
        onSubmit={apply}
        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["dateFrom", "dateTo"].map((key, index) => (
            <label key={key} className="text-xs font-semibold text-slate-600">
              {index ? "To date" : "From date"}
              <input
                type="date"
                className={inputClass}
                value={draft[key]}
                max={index ? undefined : draft.dateTo || undefined}
                min={index ? draft.dateFrom || undefined : undefined}
                onChange={(event) =>
                  setDraft({ ...draft, [key]: event.target.value })
                }
              />
            </label>
          ))}
          <label className="text-xs font-semibold text-slate-600">
            Admin name or ID
            <input
              type="search"
              maxLength={200}
              className={inputClass}
              value={draft.actor}
              onChange={(event) =>
                setDraft({ ...draft, actor: event.target.value })
              }
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Action
            <select
              aria-label="Action"
              className={inputClass}
              value={draft.action}
              onChange={(event) =>
                setDraft({ ...draft, action: event.target.value })
              }
            >
              <option value="">All actions</option>
              {Object.entries(ACTIONS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Outcome
            <select
              aria-label="Outcome"
              className={inputClass}
              value={draft.outcome}
              onChange={(event) =>
                setDraft({ ...draft, outcome: event.target.value })
              }
            >
              <option value="">All outcomes</option>
              {["success", "failed", "denied"].map((value) => (
                <option key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Apply filters
          </button>
          <button type="button" className={buttonClass} onClick={reset}>
            Clear filters
          </button>
        </div>
      </form>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          <button
            type="button"
            onClick={reload}
            className="ml-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <p role="status" className="p-8 text-center text-sm text-slate-500">
          Loading audit logs…
        </p>
      ) : (
        !error && (
          <>
            <p className="text-sm text-slate-500" aria-live="polite">
              {result.pagination.total} matching{" "}
              {result.pagination.total === 1 ? "event" : "events"}
            </p>
            {result.events.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
                No audit logs match these filters.
              </div>
            ) : (
              <ol aria-label="Audit events" className="space-y-3">
                {result.events.map((event) => {
                  const details =
                    (typeof event.details === "string"
                      ? JSON.parse(event.details)
                      : event.details) ?? {};
                  const reason = event.reason || recoveryReasons[details.recovery_reason];
                  const recordedAt = new Date(event.created_at);
                  return (
                    <li
                      key={event.id}
                      className="min-w-0 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-800">
                          {ACTIONS[event.action] || event.action}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${event.outcome === "success" ? "bg-emerald-50 text-emerald-800" : event.outcome === "denied" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"}`}
                        >
                          {event.outcome}
                        </span>
                      </div>
                      <p className="mt-2 break-words text-sm text-slate-600">
                        {eventSummary(event, details)}
                        {!!event.is_development && (
                          <span className="ml-2 rounded bg-violet-50 px-2 py-1 text-xs text-violet-800">
                            Development session
                          </span>
                        )}
                      </p>
                      {reason && reason !== ACTIONS[event.action] && (
                        <p className="mt-1 break-words text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">Reason:</span> {reason}
                        </p>
                      )}
                      <time className="mt-2 block text-xs text-slate-500" dateTime={event.created_at}>
                        {clinicDate.format(recordedAt)} · {clinicTime.format(recordedAt)}
                      </time>
                      <EventDetails event={event} details={details} />
                    </li>
                  );
                })}
              </ol>
            )}
            <nav
              aria-label="Audit pagination"
              className="flex flex-wrap items-center justify-between gap-3 py-2"
            >
              <p className="text-sm text-slate-500">
                Page {result.pagination.page} of {result.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  className={buttonClass}
                  disabled={result.pagination.page <= 1}
                  onClick={() => changePage(result.pagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  className={buttonClass}
                  disabled={
                    result.pagination.page >= result.pagination.totalPages
                  }
                  onClick={() => changePage(result.pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </nav>
          </>
        )
      )}
    </section>
  );
}
