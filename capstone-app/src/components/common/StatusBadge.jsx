/**
 * StatusBadge
 * Small coloured pill that maps a status string to a readable label + colour.
 *
 * Prop:
 *   status — "available" | "on_leave" | "done" | "completed" | "confirmed" | "pending" | any
 */
export default function StatusBadge({ status }) {
  const normalized = String(status ?? "").toLowerCase();
  const ok      = normalized === "available" || normalized === "done" || normalized === "completed" || normalized === "confirmed";
  const warning = normalized === "pending";

  const label =
    normalized === "available" ? "Available"
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
