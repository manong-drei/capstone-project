const notificationsPlaceholder = [
  { id: 1, title: "New appointment request", body: "Juan Dela Cruz booked for Apr 22.",     time: "2 min ago" },
  { id: 2, title: "Doctor went on leave",    body: "Dr. Santos marked absent today.",       time: "15 min ago" },
  { id: 3, title: "Queue threshold reached", body: "Queue exceeded 30 patients today.",     time: "1 hr ago" },
  { id: 4, title: "Monthly report ready",    body: "March analytics are now available.",    time: "1 day ago" },
];

/**
 * AdminNotificationsTab
 * Full-page notifications list (placeholder data).
 */
export default function AdminNotificationsTab() {
  return (
    <div className="ad-tab-pad" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
        Notifications
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {notificationsPlaceholder.map((n) => (
          <div key={n.id} style={{ display: "flex", gap: "12px", padding: "14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>
              🔔
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{n.title}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{n.body}</p>
            </div>
            <span style={{ fontSize: "12px", color: "#94a3b8", flexShrink: 0, alignSelf: "flex-start" }}>{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
