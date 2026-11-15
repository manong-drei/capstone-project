import { useEffect, useRef, useState } from "react";

export default function QueueReasonModal({ request, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    if (!request) return;
    const previous = document.activeElement;
    dialog.current?.querySelector('input, button')?.focus();
    return () => previous?.focus();
  }, [request]);
  if (!request) return null;
  const submittedReason = reason === "Other" ? otherReason.trim() : reason;

  const close = () => {
    setReason("");
    setOtherReason("");
    onClose();
  };

  return (
    <div
      onMouseDown={(event) => event.target === event.currentTarget && close()}
      className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/55 p-4"
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-reason-title"
        aria-describedby={request.description ? "queue-reason-description" : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); close(); }
          if (event.key !== "Tab") return;
          const firstRadio = dialog.current.querySelector('input');
          const controls = [...dialog.current.querySelectorAll('input, button')].filter(control => !control.disabled
            && (control.type !== 'radio' || control.checked || (!reason && control === firstRadio)));
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-110 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2
          id="queue-reason-title"
          className="mb-4 text-lg font-semibold text-slate-800"
        >
          {request.title}
        </h2>
        {request.description && <p id="queue-reason-description" className="mb-4 text-sm leading-6 text-slate-600">{request.description}</p>}
        <div className="grid gap-2">
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
        {reason === "Other" && (
          <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
            Other reason
            <input
              type="text"
              required
              maxLength={255}
              value={otherReason}
              onChange={(event) => setOtherReason(event.target.value)}
              placeholder="Enter your cancellation reason"
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={close}
            className="min-h-11 cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={!submittedReason}
            onClick={() => {
              if (!submittedReason) return;
              const selected = submittedReason;
              close();
              onSubmit(selected);
            }}
            className="min-h-11 cursor-pointer rounded-xl bg-blue-800 px-3.5 py-2.5 text-sm text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {request.submitLabel || "Continue"}
          </button>
        </div>
      </section>
    </div>
  );
}
