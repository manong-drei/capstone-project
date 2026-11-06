import useLiveData from "@/hooks/useLiveData";
import { useCallback, useState } from "react";
import { generatePath, Link, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import StatusBadge from "@/components/common/StatusBadge";
import { getAllAppointments } from "@/services/appointmentService";

const BLUE = "#1a3a8f";

const formatAppointmentDate = (value, withYear = true) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
};
const formatAppointmentTime = (value) => {
  if (!value) return "—";
  return new Date(`2000-01-01T${value}`).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
const formatDoctorName = (appt) => {
  const name =
    `Dr. ${[appt?.doctor_first_name, appt?.doctor_middle_name, appt?.doctor_last_name, appt?.doctor_suffix].filter(Boolean).join(" ")}`.trim();
  return name === "Dr." ? "—" : name;
};
const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch {
    /* fall through */
  }
  return appt?.cancellation_reason || (appt?.reason === "Same-day queue registration" ? "—" : appt?.reason) || "—";
};

function HistoryPatient({ visit }) {
  const name = visit.patient_full_name || "—";
  return visit.patient_id ? (
    <Link to={generatePath(ROUTES.ADMIN_PATIENT_PROFILE, { id: String(visit.patient_id) })} className="font-semibold text-blue-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">
      {name}
    </Link>
  ) : name;
}

function TicketType({ visit }) {
  const walkIn = visit.visit_type === "walk_in";
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${walkIn ? "bg-orange-50 text-orange-800" : "bg-blue-50 text-blue-800"}`}>
      {walkIn ? "Walk-in" : "Appointment"}{visit.queue_number ? ` · ${visit.queue_number}` : ""}
    </span>
  );
}

export default function AdminPatientsHistoryTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const setCurrentPage = useCallback((page, options) => setSearchParams((current) => {
    if (page === 1) current.delete("page"); else current.set("page", page);
    return current;
  }, options), [setSearchParams]);
  const [result, setResult] = useState({ data: [], summary: {}, pagination: {} });
  const [apptLoading, setApptLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const pageSize = 10;
  useLiveData(useCallback(async (signal) => {
    try {
      const response = await getAllAppointments({ page: currentPage, limit: pageSize, includeWalkIns: true }, signal);
      if (!signal.aborted) {
        setResult(response); setError('');
        if (response.pagination.page !== currentPage) setCurrentPage(response.pagination.page, { replace: true });
      }
    } catch (err) { if (!signal.aborted) setError(err.message); }
    finally { if (!signal.aborted) setApptLoading(false); }
  }, [currentPage, setCurrentPage]), true, retry);

  const appointments = result.data;
  const totalPages = result.pagination.totalPages ?? 1;
  const totalRecords = result.pagination.total ?? 0;
  const changePage = (page) => {
    setApptLoading(true);
    setError("");
    setCurrentPage(page);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Hero header */}
      <div
        className="ad-tab-pad"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Patient Records
        </p>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "20px",
            fontWeight: 800,
            color: "#1e293b",
          }}
        >
          Patients History
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Review appointments and walk-in visits, including services, doctor, and status.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Records",
            value: totalRecords,
            color: BLUE,
            bg: "#dbeafe",
          },
          {
            label: "Completed",
            value: result.summary.completed ?? 0,
            color: "#059669",
            bg: "#dcfce7",
          },
          {
            label: "Cancelled / No-shows",
            value: result.summary.cancelledOrNoShow ?? 0,
            color: "#b91c1c",
            bg: "#fee2e2",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {item.label}
            </p>
            <span
              style={{ fontSize: "28px", fontWeight: 800, color: item.color }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Appointment table */}
      <div
        className="ad-tab-pad"
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: "16px",
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          Visit History
        </h3>

        {error ? (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => {
              setApptLoading(true);
              setError("");
              setRetry((value) => value + 1);
            }}>Retry</button>
          </div>
        ) : apptLoading ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            Loading visits...
          </p>
        ) : appointments.length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            No visits recorded yet.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="ad-hide-on-mobile" style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #e2e8f0",
                      textAlign: "left",
                      color: "#475569",
                    }}
                  >
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Time</th>
                    <th style={{ padding: "10px 12px" }}>Patient</th>
                    <th style={{ padding: "10px 12px" }}>Ticket Type</th>
                    <th style={{ padding: "10px 12px" }}>Doctor</th>
                    <th style={{ padding: "10px 12px" }}>Services</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr
                      key={appt.queue_id ? `queue-${appt.queue_id}` : `appointment-${appt.appointment_id}`}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          color: "#1e293b",
                          fontWeight: 600,
                        }}
                      >
                        {formatAppointmentDate(appt.appointment_date)}
                      </td>
                      <td style={{ padding: "12px", color: "#475569" }}>
                        {formatAppointmentTime(appt.appointment_time)}
                      </td>
                      <td style={{ padding: "12px", color: "#1e293b" }}>
                        <HistoryPatient visit={appt} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <TicketType visit={appt} />
                      </td>
                      <td style={{ padding: "12px", color: "#475569" }}>
                        {formatDoctorName(appt)}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          color: "#475569",
                          maxWidth: "280px",
                        }}
                      >
                        {formatServices(appt)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div
              className="ad-show-on-mobile"
            >
              {appointments.map((appt) => (
                <div
                  key={appt.queue_id ? `queue-${appt.queue_id}` : `appointment-${appt.appointment_id}`}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#1e293b",
                        fontSize: "13px",
                      }}
                    >
                      <HistoryPatient visit={appt} />
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {formatAppointmentDate(appt.appointment_date, false)}
                    </span>
                  </div>
                  <TicketType visit={appt} />
                  <span className="text-xs text-slate-600">Doctor: {formatDoctorName(appt)}</span>
                  <span style={{ fontSize: "12px", color: "#475569" }}>
                    {formatServices(appt)}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>

            {/* Pagination controls (new design) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
                padding: "12px 20px",
                borderTop: "1px solid #f3f4f6",
                background: "#f9fafb",
              }}
            >
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, totalRecords)} of{" "}
                {totalRecords}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <button
                  onClick={() => changePage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "7px",
                    border: "1px solid #e5e7eb",
                    background: currentPage <= 1 ? "#f3f4f6" : "#ffffff",
                    color: currentPage <= 1 ? "#9ca3af" : "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#374151",
                    padding: "0 4px",
                  }}
                >
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    changePage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "7px",
                    border: "1px solid #e5e7eb",
                    background:
                      currentPage >= totalPages ? "#f3f4f6" : "#ffffff",
                    color: currentPage >= totalPages ? "#9ca3af" : "#374151",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor:
                      currentPage >= totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
