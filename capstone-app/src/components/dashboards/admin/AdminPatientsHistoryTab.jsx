import { useState } from "react";
import StatusBadge from "@/components/common/StatusBadge";

const BLUE = "#1a3a8f";
const ORANGE = "#f97316";

const formatAppointmentDate = (value, withYear = true) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
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
    `Dr. ${appt?.doctor_first_name ?? ""} ${appt?.doctor_last_name ?? ""}`.trim();
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
  return appt?.reason || "—";
};

export default function AdminPatientsHistoryTab({ appointments, apptLoading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Ensure appointments is always an array
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const totalPages = Math.ceil(safeAppointments.length / pageSize);

  // Reset current page if it exceeds total pages (state adjustment during render)
  if (currentPage > totalPages) {
    setCurrentPage(Math.max(1, totalPages));
  }

  const paginatedAppointments = safeAppointments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const completed = safeAppointments.filter(
    (a) => a.status === "completed",
  ).length;
  const pending = safeAppointments.filter((a) => a.status === "pending").length;
  const confirmed = safeAppointments.filter(
    (a) => a.status === "confirmed",
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Hero header */}
      <div
        className="ad-tab-pad"
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%)",
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
          Review appointment activity, service history, assigned doctor, and
          each patient case status.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Records",
            value: safeAppointments.length,
            color: BLUE,
            bg: "#dbeafe",
          },
          {
            label: "Completed",
            value: completed,
            color: "#059669",
            bg: "#dcfce7",
          },
          {
            label: "Open Cases",
            value: pending + confirmed,
            color: ORANGE,
            bg: "#ffedd5",
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
          Appointment History
        </h3>

        {apptLoading ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            Loading appointments...
          </p>
        ) : safeAppointments.length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
            No appointments recorded yet.
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
                    <th style={{ padding: "10px 12px" }}>Doctor</th>
                    <th style={{ padding: "10px 12px" }}>Services</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map((appt) => (
                    <tr
                      key={appt.appointment_id}
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
                        {appt.patient_full_name || "—"}
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
              style={{ display: "none", flexDirection: "column", gap: "10px" }}
            >
              {paginatedAppointments.map((appt) => (
                <div
                  key={appt.appointment_id}
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
                      {appt.patient_full_name || "—"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {new Date(appt.appointment_date).toLocaleDateString(
                        "en-PH",
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
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
                {Math.min(currentPage * pageSize, safeAppointments.length)} of{" "}
                {safeAppointments.length}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
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
