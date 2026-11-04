import { useEffect, useRef } from "react";

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
          Lower Appointment Limit?
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          You currently have <strong>{bookedCount}</strong> appointment{bookedCount !== 1 ? "s" : ""} booked today. Lowering the limit below this number will prevent new bookings but will <strong>not</strong> cancel existing appointments. Continue?
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
