import {
  generatePath,
  Link,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Search,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import StatusBadge from "@/components/common/StatusBadge";
import ConsultationNotesDialog from "./ConsultationNotesDialog";

const VISITS_PER_PAGE = 10;
const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const formatVisitDate = (value) =>
  new Date(value).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function VisitTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${type === "walk_in" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}
    >
      {type === "walk_in" ? "Walk-in" : "Appointment"}
    </span>
  );
}

const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch {
    /* fall through */
  }
  return (
    appt?.status_reason ||
    (appt?.reason === "Same-day queue registration" ? "—" : appt?.reason) ||
    "—"
  );
};

// Midnight clinic dates arrive from MySQL as the previous day in UTC.
const getDateKey = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
    : "";
};

/**
 * DoctorAppointmentsTab
 * Sortable, filterable patient history for the logged-in doctor.
 */
export default function DoctorAppointmentsTab({
  visits,
  loading,
  error,
  onRetry,
  onBack,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("filter") === "all" ? "all" : "today";
  const sortField = ["name", "services"].includes(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "date";
  const sortDir = searchParams.get("order") === "asc" ? "asc" : "desc";
  const consultationId = useMatch(ROUTES.DOCTOR_CONSULTATION)?.params.id;
  const navigate = useNavigate();
  const { search: historySearch } = useLocation();
  const selectedVisit = visits.find(
    (visit) => String(visit.consultation_id) === consultationId,
  );
  const setSelectedVisit = (visit) =>
    navigate(
      `${visit ? generatePath(ROUTES.DOCTOR_CONSULTATION, { id: visit.consultation_id }) : ROUTES.DOCTOR_PATIENT_HISTORY}${historySearch}`,
    );
  const visitType = ["appointment", "walk_in"].includes(
    searchParams.get("type"),
  )
    ? searchParams.get("type")
    : "all";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const updateQuery = (values, options) => {
    // Rapid filter changes must build on the latest navigation, not a previous render.
    const current = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value === "" || (key === "page" && value === 1)) current.delete(key);
      else current.set(key, value);
    }
    setSearchParams(current, options);
  };
  const setPage = (next) => updateQuery({ page: next });

  const handleSort = (field) => {
    updateQuery({
      page: 1,
      sort: field,
      order: field === sortField ? (sortDir === "asc" ? "desc" : "asc") : "asc",
    });
  };

  const today = getDateKey(new Date());
  const query = search.trim().toLowerCase();
  const filtered = visits.filter(
    (visit) =>
      (filter === "all" || getDateKey(visit.visit_date) === today) &&
      (visitType === "all" || visit.visit_type === visitType) &&
      (!query ||
        `${visit.patient_full_name ?? ""} ${visit.queue_number ?? ""}`
          .toLowerCase()
          .includes(query)),
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date")
      cmp =
        getDateKey(a.visit_date).localeCompare(getDateKey(b.visit_date)) ||
        (a.visit_time ?? "").localeCompare(b.visit_time ?? "");
    else if (sortField === "name")
      cmp = (a.patient_full_name ?? "")
        .toLowerCase()
        .localeCompare((b.patient_full_name ?? "").toLowerCase());
    else
      cmp = formatServices(a)
        .toLowerCase()
        .localeCompare(formatServices(b).toLowerCase());
    return sortDir === "asc" ? cmp : -cmp;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / VISITS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const firstVisitIndex = (currentPage - 1) * VISITS_PER_PAGE;
  const pageVisits = sorted.slice(
    firstVisitIndex,
    firstVisitIndex + VISITS_PER_PAGE,
  );

  return (
    <>
      {consultationId && (
        <ConsultationNotesDialog
          key={consultationId}
          consultationId={consultationId}
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
        />
      )}
      <main className="w-full min-w-0 flex-1 space-y-4 px-3 py-5 sm:px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              Patient records
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1a3a8f] sm:text-3xl">
              Patient History
            </h1>
          </div>
          <button
            className={`${SECONDARY_BUTTON} shrink-0 self-start px-4`}
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back to dashboard
          </button>
        </div>

        <section
          aria-label="Patient history filters"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="History period"
              className="grid w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:w-60"
            >
              {[
                { key: "today", label: "Today" },
                { key: "all", label: "All" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => updateQuery({ filter: key, page: 1 })}
                  className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${filter === key ? "bg-[#1e4db7] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_16rem]">
            <label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-1">
              <span className="mb-1.5 block">Search patients or tickets</span>
              <span className="relative block">
                <Search
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    // Commit the search before another filter can reuse the previous query.
                    updateQuery(
                      { search: event.target.value, page: 1 },
                      { replace: true, flushSync: true },
                    );
                  }}
                  placeholder="Patient name or ticket number"
                  className="block min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-base font-normal text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-blue-600"
                />
              </span>
            </label>
            <label className="min-w-0 text-xs font-semibold text-slate-600">
              <span className="mb-1.5 block">Visit type</span>
              <select
                value={visitType}
                onChange={(event) =>
                  updateQuery({ type: event.target.value, page: 1 })
                }
                className="block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-normal text-slate-800 focus:outline-blue-600"
              >
                <option value="all">All visit types</option>
                <option value="appointment">Appointments</option>
                <option value="walk_in">Walk-ins</option>
              </select>
            </label>
            <div className="min-w-0">
              <label
                htmlFor="history-sort"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Sort by
              </label>
              <div className="flex gap-2">
                <select
                  id="history-sort"
                  value={sortField}
                  onChange={(event) =>
                    updateQuery({ sort: event.target.value, page: 1 })
                  }
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-800 focus:outline-blue-600"
                >
                  <option value="date">Date</option>
                  <option value="name">Patient name</option>
                  <option value="services">Services</option>
                </select>
                <button
                  type="button"
                  aria-label={
                    sortDir === "asc" ? "Sort descending" : "Sort ascending"
                  }
                  onClick={() =>
                    updateQuery({
                      order: sortDir === "asc" ? "desc" : "asc",
                      page: 1,
                    })
                  }
                  className={`${SECONDARY_BUTTON} w-11 shrink-0 px-0`}
                >
                  {sortDir === "asc" ? (
                    <ArrowUp size={18} aria-hidden="true" />
                  ) : (
                    <ArrowDown size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="visit-history-title"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ClipboardList size={20} aria-hidden="true" />
              </span>
              <h2
                id="visit-history-title"
                className="text-base font-bold text-[#1a3a8f]"
              >
                Visit history
              </h2>
              {!loading && !error && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {sorted.length} {sorted.length === 1 ? "visit" : "visits"}
                </span>
              )}
            </div>
            {!loading && !error && sorted.length > 0 && (
              <p className="text-xs text-slate-500">Up to 10 visits per page</p>
            )}
          </div>

          {loading ? (
            <p
              role="status"
              className="px-4 py-12 text-center text-sm text-slate-500"
            >
              Loading patient history...
            </p>
          ) : error ? (
            <div className="px-4 py-10 text-center">
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className={`${SECONDARY_BUTTON} mt-4 px-4`}
              >
                Retry
              </button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <Search size={28} aria-hidden="true" className="text-slate-400" />
              <p className="text-sm text-slate-500">
                {search.trim() || visitType !== "all"
                  ? "No visits match these filters."
                  : filter === "today"
                    ? "No patient visits for today."
                    : "No patient history yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="dd-hide-on-mobile hidden xl:block">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[15%]" />
                    <col className="w-[22%]" />
                    <col className="w-[24%]" />
                    <col className="w-[13%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                    <tr>
                      {[
                        { label: "Date", field: "date" },
                        { label: "Patient Name", field: "name" },
                        { label: "Services", field: "services" },
                      ].map(({ label, field }) => (
                        <th
                          key={field}
                          scope="col"
                          aria-sort={
                            sortField === field
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          className="px-4 py-1 font-semibold"
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(field)}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600 ${sortField === field ? "text-blue-700" : "hover:text-blue-700"}`}
                          >
                            {label}
                            {sortField !== field ? (
                              <ArrowUpDown
                                size={14}
                                aria-hidden="true"
                                className="text-slate-400"
                              />
                            ) : sortDir === "asc" ? (
                              <ArrowUp size={14} aria-hidden="true" />
                            ) : (
                              <ArrowDown size={14} aria-hidden="true" />
                            )}
                          </button>
                        </th>
                      ))}
                      {["Ticket Type", "Status", "Notes"].map((label) => (
                        <th
                          key={label}
                          scope="col"
                          className="px-4 py-3 font-semibold"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageVisits.map((appt) => (
                      <tr
                        key={appt.visit_id}
                        className="transition hover:bg-blue-50/40"
                      >
                        <td className="px-4 py-4 align-top text-slate-700">
                          <p>{formatVisitDate(appt.visit_date)}</p>
                          {appt.visit_time && (
                            <p className="mt-1 text-xs text-slate-500">
                              {appt.visit_time}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top [overflow-wrap:anywhere]">
                          <p className="font-semibold text-slate-900">
                            {appt.patient_id ? (
                              <Link
                                to={generatePath(
                                  ROUTES.DOCTOR_PATIENT_PROFILE,
                                  { id: String(appt.patient_id) },
                                )}
                                className="text-blue-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                              >
                                {appt.patient_full_name || "—"}
                              </Link>
                            ) : (
                              appt.patient_full_name || "—"
                            )}
                          </p>
                          {appt.queue_number && (
                            <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              {appt.queue_number}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                          {formatServices(appt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <VisitTypeBadge type={appt.visit_type} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusBadge status={appt.status} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          {appt.consultation_id ? (
                            <button
                              type="button"
                              onClick={() => setSelectedVisit(appt)}
                              className={`${SECONDARY_BUTTON} px-3 text-xs`}
                            >
                              <FileText size={16} aria-hidden="true" />
                              View Notes
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              No notes recorded
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dd-show-on-mobile grid gap-3 bg-slate-50/60 p-3 sm:grid-cols-2 sm:p-4 xl:hidden">
                {pageVisits.map((appt) => (
                  <div
                    key={appt.visit_id}
                    className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">
                          {appt.patient_id ? (
                            <Link
                              to={generatePath(ROUTES.DOCTOR_PATIENT_PROFILE, {
                                id: String(appt.patient_id),
                              })}
                              className="text-blue-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                            >
                              {appt.patient_full_name || "—"}
                            </Link>
                          ) : (
                            appt.patient_full_name || "—"
                          )}
                        </h3>
                        {appt.queue_number && (
                          <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 [overflow-wrap:anywhere]">
                            {appt.queue_number}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <CalendarDays size={14} aria-hidden="true" />
                      <span>{formatVisitDate(appt.visit_date)}</span>
                      {appt.visit_time && (
                        <span className="border-l border-slate-200 pl-2">
                          {appt.visit_time}
                        </span>
                      )}
                    </p>
                    <div className="mb-4 mt-4 min-w-0">
                      <p className="text-xs font-semibold text-slate-500">
                        Services
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
                        {formatServices(appt)}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <VisitTypeBadge type={appt.visit_type} />
                      {appt.consultation_id ? (
                        <button
                          type="button"
                          onClick={() => setSelectedVisit(appt)}
                          className={`${SECONDARY_BUTTON} px-3 text-xs`}
                        >
                          <FileText size={16} aria-hidden="true" />
                          View Notes
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No notes recorded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <nav
                aria-label="Patient history pagination"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs"
              >
                <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:gap-4">
                  <p aria-live="polite" className="text-slate-500">
                    Showing {firstVisitIndex + 1}–
                    {Math.min(firstVisitIndex + VISITS_PER_PAGE, sorted.length)}{" "}
                    of {sorted.length}
                  </p>
                  <span className="text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    className={`${SECONDARY_BUTTON} px-4`}
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    className={`${SECONDARY_BUTTON} px-4`}
                  >
                    Next
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            </>
          )}
        </section>
      </main>
    </>
  );
}
