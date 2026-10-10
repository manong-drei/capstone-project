/**
 * StatusBadge
 * Small coloured pill that maps a status string to a readable label + colour.
 *
 * Prop:
 *   status — "available" | "on_leave" | "done" | "completed" | "confirmed" | "pending" | any
 */
export default function StatusBadge({ status }) {
  const normalized = String(status ?? "").trim().toLowerCase().replace(/[ -]+/g, "_");
  const ok = ["available", "done", "completed", "confirmed"].includes(normalized);
  const warning = ["pending", "waiting", "called", "serving", "missed"].includes(normalized);
  const cancelled = ["cancelled", "canceled"].includes(normalized);

  const label =
    cancelled ? "Cancelled"
    : normalized === 'no_show' ? 'No-show'
    : normalized === 'missed' ? 'Missed call'
    : normalized === "available" ? "Available"
    : normalized === "on_leave" ? "On Leave"
    : normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "—";

  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: "99px",
        fontSize: "11px",
        fontWeight: 600,
        background: ok ? "#dcfce7" : warning ? "#fef9c3" : "#fee2e2",
        color:      ok ? "#15803d" : warning ? "#92400e" : "#b91c1c",
      }}
    >
      {label}
    </span>
  );
}
