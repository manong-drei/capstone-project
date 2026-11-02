import { useEffect, useRef, useState } from "react";
import api from "@/services/api";

export default function ConsultationNotesDialog({ visit, consultationId, onClose }) {
  const dialogRef = useRef(null);
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

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

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/doctor/consultations/${consultationId}`, { signal: controller.signal })
      .then((response) => { if (!controller.signal.aborted) setConsultation(response.data); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [consultationId, retry]);

  const details = consultation || visit;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="saved-consultation-title"
      onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl bg-white p-5 text-slate-800 shadow-xl backdrop:bg-black/50 sm:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 id="saved-consultation-title" className="text-lg font-bold">Consultation Notes</h2>
          <p className="mt-1 break-words text-sm font-medium">{details?.patient_full_name || visit?.patient_full_name}</p>
          {details?.visit_date && <p className="mt-1 text-xs text-slate-500">
            {new Date(details.visit_date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" })}
            {" · "}{details.visit_type === "walk_in" ? "Walk-in" : "Appointment"}
            {details.queue_number && ` · ${details.queue_number}`}
          </p>}
        </div>
        <button type="button" autoFocus onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Close</button>
      </div>
      {error ? (
        <div>
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => { setError(""); setRetry((value) => value + 1); }} className="mt-3 rounded-lg border border-indigo-200 px-3 py-2 text-sm text-indigo-700">Retry</button>
        </div>
      ) : !consultation ? (
        <p role="status" className="text-sm text-slate-500">Loading consultation notes…</p>
      ) : (
        <div className="space-y-5">
          {[
            ["Consultation Notes", consultation.notes],
            ["Diagnosis", consultation.diagnosis],
            ["Prescription / Recommendations", consultation.prescriptions?.join("\n\n")],
          ].map(([label, value]) => (
            <section key={label}>
              <h3 className="mb-1 text-sm font-semibold text-indigo-800">{label}</h3>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{value || "Not recorded"}</p>
            </section>
          ))}
          <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">Saved consultation · Read only</p>
        </div>
      )}
    </dialog>
  );
}
