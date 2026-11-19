import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import api from "@/services/api";
import { CircleOff, RotateCcw } from "lucide-react";

const DEACTIVATION_REASONS = [
  "Account holder requested deactivation",
  "Duplicate account",
  "Account no longer needed",
  "Suspected unauthorized access",
  "Policy violation",
  "Other administrative reason",
];

export default function AccountStatusDialog({ name, userId, action, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const [reason, setReason] = useState("");
  const [impact, setImpact] = useState(null);
  const [impactError, setImpactError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const deactivating = action === "deactivate";
  const label = deactivating ? "Deactivate" : "Reactivate";
  const StatusIcon = deactivating ? CircleOff : RotateCcw;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (!deactivating) return;
    const controller = new AbortController();
    api.get(`/admin/accounts/${userId}/deactivation-impact`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setImpact(data); })
      .catch(() => {
        if (!controller.signal.aborted) setImpactError("Affected visits could not be loaded. Check the queue and patient history.");
      });
    return () => controller.abort();
  }, [completed, deactivating, userId]);

  const submit = async (event) => {
    event.preventDefault();
    if (busy || completed || (deactivating && !reason)) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(reason);
      if (deactivating) {
        setImpact(null);
        setImpactError("");
        setCompleted(true);
      } else onCancel();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="account-status-title"
      aria-describedby="account-status-description"
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/55"
    >
      <form className="p-6" onSubmit={submit}>
        <div className="mb-3 flex items-center gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${deactivating ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            <StatusIcon size={20} aria-hidden="true" />
          </span>
          <h2 id="account-status-title" className="text-lg font-bold">{completed ? "Account deactivated" : `${label} account`}</h2>
        </div>
        <p id="account-status-description" className="text-sm text-slate-600">
          <strong className="wrap-anywhere text-slate-900">{name}</strong>{" "}
          {completed ? "no longer has access to the system." : `will ${deactivating ? "lose" : "regain"} access to the system.`}
        </p>
        {deactivating && !completed && (
          <div className="mt-4">
            <label htmlFor="account-status-reason" className="text-sm font-semibold">Reason for deactivation</label>
            <select
              id="account-status-reason"
              aria-describedby="account-status-reason-hint"
              required
              disabled={busy}
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
        {deactivating && (
          <section className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3 text-sm">
            <h3 className="font-semibold">Visits for staff follow-up</h3>
            {impactError ? <p role="status">{impactError}</p> : impact ? (
              <>
                {impact.appointments.length === 0 && impact.tickets.length === 0 && <p>No assigned open bookings or active tickets.</p>}
                {(impact.appointments.length > 0 || impact.tickets.length > 0) && (
                  <ul className="max-h-32 space-y-1 overflow-auto">
                    {impact.appointments.map((row) => (
                      <li key={`a-${row.appointment_id}`}>Booking #{row.appointment_id} · {row.date} {row.time} · {row.status}</li>
                    ))}
                    {impact.tickets.map((row) => <li key={`q-${row.id}`}>Ticket {row.queue_number} · {row.status}</li>)}
                  </ul>
                )}
                {impact.review_shared_queue && <p>Review unassigned patients in the shared dental queue.</p>}
              </>
            ) : <p role="status">Checking affected visits…</p>}
            {completed && (
              <div className="flex flex-wrap gap-3 font-medium text-blue-700">
                <Link to={ROUTES.ADMIN_QUEUE} onClick={onCancel} className="underline">Open queue</Link>
                <Link to={ROUTES.ADMIN_PATIENT_HISTORY} onClick={onCancel} className="underline">Open patient history</Link>
              </div>
            )}
          </section>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 cursor-pointer rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600">
            {completed ? "Done" : "Cancel"}
          </button>
          {!completed && <button
            type="submit"
            disabled={busy || (deactivating && !reason)}
            className={`min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${deactivating ? "bg-red-700 hover:bg-red-800" : "bg-emerald-700 hover:bg-emerald-800"}`}
          >
            {busy ? "Saving…" : label}
          </button>}
        </div>
      </form>
    </dialog>
  );
}
