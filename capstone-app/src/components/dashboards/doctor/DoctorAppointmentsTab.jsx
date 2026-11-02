import { generatePath, useLocation, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Footer } from "@/pages/LandingPage";
import StatusBadge from "@/components/common/StatusBadge";
import ConsultationNotesDialog from "./ConsultationNotesDialog";

const INDIGO = "#4f46e5";
const VISITS_PER_PAGE = 10;

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
  const sortField = ["name", "services"].includes(searchParams.get("sort")) ? searchParams.get("sort") : "date";
  const sortDir = searchParams.get("order") === "asc" ? "asc" : "desc";
  const consultationId = useMatch(ROUTES.DOCTOR_CONSULTATION)?.params.id;
  const navigate = useNavigate();
  const { search: historySearch } = useLocation();
  const selectedVisit = visits.find((visit) => String(visit.consultation_id) === consultationId);
  const setSelectedVisit = (visit) => navigate(`${visit ? generatePath(ROUTES.DOCTOR_CONSULTATION, { id: visit.consultation_id }) : ROUTES.DOCTOR_PATIENT_HISTORY}${historySearch}`);
  const visitType = ["appointment", "walk_in"].includes(searchParams.get("type")) ? searchParams.get("type") : "all";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const updateQuery = (values, options) => setSearchParams((current) => {
    for (const [key, value] of Object.entries(values)) {
      if (value === "" || (key === "page" && value === 1)) current.delete(key);
      else current.set(key, value);
    }
    return current;
  }, options);
  const setPage = (next) => updateQuery({ page: next });

  const handleSort = (field) => {
    updateQuery({ page: 1, sort: field, order: field === sortField ? (sortDir === "asc" ? "desc" : "asc") : "asc" });
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
      <div
        className="dd-tab-pad"
        style={{ flex: 1, maxWidth: "1100px", margin: "0 auto", width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            rowGap: "10px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              ← Back
            </button>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Patient History
            </h2>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              gap: "4px",
            }}
          >
            {[
              { key: "today", label: "Today" },
              { key: "all", label: "All" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => {
                  updateQuery({ filter: key, page: 1 });
                }}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: filter === key ? INDIGO : "transparent",
                  color: filter === key ? "#ffffff" : "#374151",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Appointments and dental queue visits, including walk-ins. Open a visit
          to read your saved consultation notes.
        </p>

        <div className="mb-5 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_11rem_16rem]">
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            <span className="mb-1 block truncate">
              Search patients or tickets
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                updateQuery({ search: event.target.value, page: 1 }, { replace: true });
              }}
              placeholder="Patient name or ticket number"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-indigo-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            <span className="mb-1 block">Visit type</span>
            <select
              value={visitType}
              onChange={(event) => {
                updateQuery({ type: event.target.value, page: 1 });
              }}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 focus:outline-indigo-500"
            >
              <option value="all">All visit types</option>
              <option value="appointment">Appointments</option>
              <option value="walk_in">Walk-ins</option>
            </select>
          </label>

          <div>
            <label
              htmlFor="history-sort"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Sort by
            </label>
            <div className="flex gap-2">
              <select
                id="history-sort"
                value={sortField}
                onChange={(event) => {
                  updateQuery({ sort: event.target.value, page: 1 });
                }}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-indigo-500"
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
                onClick={() => {
                  updateQuery({ order: sortDir === "asc" ? "desc" : "asc", page: 1 });
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p role="status" style={{ color: "#9ca3af", fontSize: "14px" }}>
            Loading patient history...
          </p>
        ) : error ? (
          <div>
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-indigo-200 px-3 py-2 text-sm text-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>
            {search.trim() || visitType !== "all"
              ? "No visits match these filters."
              : filter === "today"
                ? "No patient visits for today."
                : "No patient history yet."}
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div
              className="dd-hide-on-mobile"
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    {[
                      { label: "Date", field: "date" },
                      { label: "Patient Name", field: "name" },
                      { label: "Services", field: "services" },
                    ].map(({ label, field }) => (
                      <th
                        key={field}
                        aria-sort={
                          sortField === field
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          color: sortField === field ? INDIGO : "#374151",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(field)}
                          className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-indigo-600"
                        >
                          {label}{" "}
                          <span
                            aria-hidden="true"
                            style={{
                              fontSize: 11,
                              opacity: sortField === field ? 1 : 0.35,
                            }}
                          >
                            {sortField === field
                              ? sortDir === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>
                    ))}
                    {["Visit Type", "Status", "Notes"].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap px-3.5 py-2.5 text-left text-slate-700"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageVisits.map((appt) => (
                    <tr
                      key={appt.visit_id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td style={{ padding: "10px 14px", color: "#111827" }}>
                        {new Date(appt.visit_date).toLocaleDateString("en-PH", {
                          timeZone: "Asia/Manila",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {appt.visit_time ? ` · ${appt.visit_time}` : ""}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#111827" }}>
                        {appt.patient_full_name || "—"}
                        {appt.queue_number && (
                          <span className="mt-1 block text-xs text-slate-500">
                            {appt.queue_number}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#374151" }}>
                        {formatServices(appt)}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${appt.visit_type === "walk_in" ? "bg-orange-50 text-orange-700" : "bg-indigo-50 text-indigo-700"}`}
                        >
                          {appt.visit_type === "walk_in"
                            ? "Walk-in"
                            : "Appointment"}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <StatusBadge status={appt.status} />
                      </td>
                      <td className="px-3.5 py-2.5">
                        {appt.consultation_id ? (
                          <button
                            type="button"
                            onClick={() => setSelectedVisit(appt)}
                            className="whitespace-nowrap rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                          >
                            View Notes
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">
                            No notes recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div
              className="dd-show-on-mobile"
              style={{ flexDirection: "column", gap: 10 }}
            >
              {pageVisits.map((appt) => (
                <div
                  key={appt.visit_id}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {appt.patient_full_name || "—"}
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      {new Date(appt.visit_date).toLocaleDateString("en-PH", {
                        timeZone: "Asia/Manila",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    {formatServices(appt)}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-1 font-medium ${appt.visit_type === "walk_in" ? "bg-orange-50 text-orange-700" : "bg-indigo-50 text-indigo-700"}`}
                    >
                      {appt.visit_type === "walk_in"
                        ? "Walk-in"
                        : "Appointment"}
                    </span>
                    {appt.queue_number && (
                      <span className="text-slate-500">
                        {appt.queue_number}
                      </span>
                    )}
                    <StatusBadge status={appt.status} />
                  </div>
                  {appt.consultation_id ? (
                    <button
                      type="button"
                      onClick={() => setSelectedVisit(appt)}
                      className="mt-1 self-start rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      View Notes
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">
                      No notes recorded
                    </span>
                  )}
                </div>
              ))}
            </div>
            <nav
              aria-label="Patient history pagination"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs"
            >
              <p aria-live="polite" className="text-slate-500">
                Showing {firstVisitIndex + 1}–
                {Math.min(firstVisitIndex + VISITS_PER_PAGE, sorted.length)} of{" "}
                {sorted.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Previous
                </button>
                <span className="whitespace-nowrap text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  Next
                </button>
              </div>
            </nav>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
