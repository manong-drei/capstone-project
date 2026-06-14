const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch { /* fall through */ }
  return appt?.reason || "—";
};

const statusStyle = (status) => {
  if (status === "confirmed")  return { bg: "#d1fae5", color: "#059669" };
  if (status === "completed")  return { bg: "#dbeafe", color: "#1d4ed8" };
  if (status === "cancelled")  return { bg: "#fee2e2", color: "#b91c1c" };
  return { bg: "#f3f4f6", color: "#6b7280" };
};

/**
 * PatientAppointmentsTab
 * List of the patient's past and upcoming appointments.
 *
 * Props:
 *   appointments — array of appointment objects
 *   apptLoading  — boolean
 *   onBack       — navigate back to home tab
 */
export default function PatientAppointmentsTab({ appointments, apptLoading, onBack }) {
  return (
    <div className="pd-tab-pad" style={{ flex: 1, maxWidth: "860px", margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", fontWeight: 500 }}>
            ← Back
          </button>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>Appointment History</h2>
        </div>

        {apptLoading ? (
          <p style={{ color: "#9ca3af" }}>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>No appointments found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {appointments.map((appt) => {
              const doctorName = `Dr. ${appt.doctor_first_name ?? ""} ${appt.doctor_last_name ?? ""}`.trim();
              const services = formatServices(appt);
              const { bg, color } = statusStyle(appt.status);
              return (
                <div key={appt.appointment_id} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#111827" }}>{doctorName || "Doctor"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
                      {new Date(appt.appointment_date).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {appt.appointment_time ? ` at ${appt.appointment_time}` : ""}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#374151" }}>{services}</p>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: bg, color }}>{appt.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
