import { useEffect, useRef, useState } from "react";
import { CircleOff, RotateCcw } from "lucide-react";

const DEACTIVATION_REASONS = [
  "Account holder requested deactivation",
  "Duplicate account",
  "Account no longer needed",
  "Suspected unauthorized access",
  "Policy violation",
  "Other administrative reason",
];

export default function AccountStatusDialog({ name, action, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const [reason, setReason] = useState("");
  const deactivating = action === "deactivate";
  const label = deactivating ? "Deactivate" : "Reactivate";
  const StatusIcon = deactivating ? CircleOff : RotateCcw;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="account-status-title"
      aria-describedby="account-status-description"
      onCancel={onCancel}
      onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/55"
    >
      <form className="p-6" onSubmit={(event) => { event.preventDefault(); onConfirm(reason); }}>
        <div className="mb-3 flex items-center gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${deactivating ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            <StatusIcon size={20} aria-hidden="true" />
          </span>
          <h2 id="account-status-title" className="text-lg font-bold">{label} account</h2>
        </div>
        <p id="account-status-description" className="text-sm text-slate-600">
          <strong className="wrap-anywhere text-slate-900">{name}</strong> will {deactivating ? "lose" : "regain"} access to the system.
        </p>
        {deactivating && (
          <div className="mt-4">
            <label htmlFor="account-status-reason" className="text-sm font-semibold">Reason for deactivation</label>
            <select
              id="account-status-reason"
              aria-describedby="account-status-reason-hint"
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <option value="" disabled>Select a reason</option>
              {DEACTIVATION_REASONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <p id="account-status-reason-hint" className="mt-1.5 text-xs text-slate-500">The reason will appear in Admin Audit Logs.</p>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 cursor-pointer rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600">
            Cancel
          </button>
          <button
            type="submit"
            disabled={deactivating && !reason}
            className={`min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${deactivating ? "bg-red-700 hover:bg-red-800" : "bg-emerald-700 hover:bg-emerald-800"}`}
          >
            {label}
          </button>
        </div>
      </form>
    </dialog>
  );
}
