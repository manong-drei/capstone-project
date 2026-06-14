/**
 * LimitWarningModal
 * Shown when the doctor tries to lower the appointment limit below the current booked count.
 *
 * Props:
 *   bookedCount          — number of already-booked appointments today
 *   onConfirm            — called when user clicks "Continue"
 *   onCancel             — called when user clicks "Cancel"
 */
export default function LimitWarningModal({ bookedCount, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px 28px 24px", maxWidth: "420px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, color: "#111827" }}>
          Lower Appointment Limit?
        </h3>
        <p style={{ margin: "0 0 22px", fontSize: "14px", color: "#4b5563", lineHeight: 1.6 }}>
          You currently have <strong>{bookedCount}</strong> appointment{bookedCount !== 1 ? "s" : ""} booked today. Lowering the limit below this number will prevent new bookings but will <strong>not</strong> cancel existing appointments. Continue?
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 18px", borderRadius: "8px", border: "1.5px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
