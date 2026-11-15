import { useEffect, useRef } from "react";

export default function LimitWarningModal({ bookedCount, walkInCount, appointmentLimit, walkInLimit, onConfirm, onCancel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby="capacity-warning-title" onCancel={onCancel} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl backdrop:bg-slate-900/55 sm:p-7">
        <h3 id="capacity-warning-title" className="mb-3 text-base font-bold text-slate-900">
          Lower daily limits?
        </h3>
        <div className="mb-4 space-y-2 text-sm leading-relaxed text-slate-700">
          {appointmentLimit < bookedCount && (
            <p>You have <strong>{bookedCount}</strong> appointment{bookedCount !== 1 ? "s" : ""} booked today. The new daily total limit is <strong>{appointmentLimit}</strong>.</p>
          )}
          {walkInLimit < walkInCount && (
            <p>You have <strong>{walkInCount}</strong> walk-in slot{walkInCount !== 1 ? "s" : ""} used today. The new daily total limit is <strong>{walkInLimit}</strong>.</p>
          )}
        </div>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          New registrations for each affected category will be blocked until capacity is available. Existing appointments and queue tickets will remain valid. Save these limits?
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="min-h-11 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Continue
          </button>
        </div>
    </dialog>
  );
}
