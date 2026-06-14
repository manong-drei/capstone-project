import StatusBadge from "@/components/common/StatusBadge";

/**
 * AdminDoctorsTab
 * Doctor availability grid.
 *
 * Props:
 *   doctors — array of doctor objects from /doctor
 */
export default function AdminDoctorsTab({ doctors }) {
  return (
    <div className="ad-tab-pad" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
        Doctor Availability
      </h3>
      {doctors.length === 0 ? (
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>No doctors registered yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div
              key={d.doctor_id}
              style={{
                border: `1.5px solid ${d.is_available ? "#bbf7d0" : "#fecaca"}`,
                borderRadius: "14px",
                padding: "18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                background: d.is_available ? "#f0fdf4" : "#fef2f2",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Dr. {d.first_name} {d.last_name}
                </p>
                {d.specialization_name && (
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#64748b" }}>
                    {d.specialization_name}
                  </p>
                )}
                <StatusBadge status={d.is_available ? "available" : "on_leave"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
