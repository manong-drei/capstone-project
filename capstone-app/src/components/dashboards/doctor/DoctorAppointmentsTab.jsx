import { useState } from "react";
import Footer from "@/components/landing/Footer";

const INDIGO = "#4f46e5";

const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch { /* fall through */ }
  return appt?.reason || "—";
};

const TODAY = new Date().toISOString().split("T")[0];

/**
 * DoctorAppointmentsTab
 * Sortable, filterable appointment history for the logged-in doctor.
 *
 * Props:
 *   appointments — full appointments array from the API
 *   apptLoading  — boolean
 *   onBack       — callback to return to home tab
 */
export default function DoctorAppointmentsTab({ appointments, apptLoading, onBack }) {
  const [filter, setFilter]     = useState("today");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir]   = useState("desc");

  const handleSort = (field) => {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const getDateKey = (value) => String(value ?? "").split("T")[0];
  const filtered = filter === "today"
    ? appointments.filter((a) => getDateKey(a.appointment_date) === TODAY)
    : appointments;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date")     cmp = (a.appointment_date ?? "").localeCompare(b.appointment_date ?? "");
    else if (sortField === "name") cmp = (a.patient_full_name ?? "").toLowerCase().localeCompare((b.patient_full_name ?? "").toLowerCase());
    else                           cmp = formatServices(a).toLowerCase().localeCompare(formatServices(b).toLowerCase());
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <>
      <div className="dd-tab-pad" style={{ flex: 1, maxWidth: "960px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "10px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>Appointment History</h2>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", padding: "3px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#f9fafb", gap: "4px" }}>
            {[{ key: "today", label: "Today" }, { key: "all", label: "All" }].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{ border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer", background: filter === key ? INDIGO : "transparent", color: filter === key ? "#ffffff" : "#374151" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {apptLoading ? (
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading appointments...</p>
        ) : sorted.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>
            {filter === "today" ? "No appointments for today." : "No appointments yet."}
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="dd-hide-on-mobile" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    {[{ label: "Date", field: "date" }, { label: "Patient Name", field: "name" }, { label: "Services", field: "services" }].map(({ label, field }) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        style={{ padding: "10px 14px", textAlign: "left", color: sortField === field ? INDIGO : "#374151", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                      >
                        {label}{" "}
                        <span style={{ fontSize: 11, opacity: sortField === field ? 1 : 0.35 }}>
                          {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((appt) => (
                    <tr key={appt.appointment_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px", color: "#111827" }}>
                        {new Date(appt.appointment_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        {appt.appointment_time ? ` · ${appt.appointment_time}` : ""}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#111827" }}>{appt.patient_full_name || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#374151" }}>{formatServices(appt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="dd-show-on-mobile" style={{ flexDirection: "column", gap: 10 }}>
              {sorted.map((appt) => (
                <div key={appt.appointment_id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "#111827" }}>{appt.patient_full_name || "—"}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                      {new Date(appt.appointment_date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: "#374151" }}>{formatServices(appt)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
