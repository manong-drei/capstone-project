import { useState } from "react";

export default function QueueReasonModal({ request, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  if (!request) return null;

  const close = () => {
    setReason("");
    onClose();
  };

  return (
    <div
      onMouseDown={(event) => event.target === event.currentTarget && close()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: "16px",
        background: "rgba(15,23,42,.55)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-reason-title"
        style={{
          width: "min(100%, 440px)",
          padding: "24px",
          borderRadius: "16px",
          background: "#fff",
          boxShadow: "0 20px 60px rgba(15,23,42,.25)",
        }}
      >
        <h2
          id="queue-reason-title"
          style={{ margin: "0 0 16px", fontSize: "18px", color: "#1e293b" }}
        >
          {request.title}
        </h2>
        <div style={{ display: "grid", gap: "8px" }}>
          {request.reasons.map((option) => {
            const selected = reason === option;
            return (
              <label
                key={option}
                className={[
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer text-sm text-slate-700 transition-all",
                  selected
                    ? "border-2 border-red-500 bg-red-50 ring-2 ring-red-200 outline-none"
                    : "border border-slate-200 bg-white hover:border-slate-300",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="queue-reason"
                  value={option}
                  checked={selected}
                  onChange={() => setReason(option)}
                  className="accent-red-500"
                />
                <span className={selected ? "font-semibold text-red-700" : ""}>
                  {option}
                </span>
              </label>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={close}
            style={{
              padding: "9px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "9px",
              background: "#fff",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            disabled={!reason}
            onClick={() => {
              const selected = reason;
              close();
              onSubmit(selected);
            }}
            style={{
              padding: "9px 14px",
              border: 0,
              borderRadius: "9px",
              background: reason ? "#2d3a8c" : "#cbd5e1",
              color: "#fff",
              cursor: reason ? "pointer" : "not-allowed",
            }}
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
