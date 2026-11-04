import { useEffect, useRef, useState } from "react";
import { CalendarDays, ClipboardList, X } from "lucide-react";
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

  const details = {
    ...visit,
    ...consultation,
    patient_full_name: consultation?.patient_full_name || visit?.patient_full_name,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="saved-consultation-title"
      onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl backdrop:bg-slate-900/55 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <h2 id="saved-consultation-title" className="text-xl font-bold tracking-tight text-[#1a3a8f]">Consultation Notes</h2>
          <p className="mt-1 text-xs text-slate-500">Saved consultation · Read only</p>
        </div>
        <button type="button" autoFocus onClick={onClose} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <X size={16} aria-hidden="true" /> Close
        </button>
      </div>
      {(details.patient_full_name || details.visit_date || details.queue_number) && (
        <div className="mb-4 min-w-0 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          {details.patient_full_name && <p className="font-semibold text-[#1a3a8f] [overflow-wrap:anywhere]">{details.patient_full_name}</p>}
          {details.visit_date && <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <CalendarDays size={14} aria-hidden="true" />
            <span>{new Date(details.visit_date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" })}</span>
            {details.visit_time && <span className="border-l border-blue-200 pl-2">{details.visit_time}</span>}
          </p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-blue-700">
            {details.visit_type && <span>{details.visit_type === "walk_in" ? "Walk-in" : "Appointment"}</span>}
            {details.queue_number && <span className="rounded-md bg-white px-2 py-1 [overflow-wrap:anywhere]">{details.queue_number}</span>}
          </div>
        </div>
      )}
      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => { setError(""); setRetry((value) => value + 1); }} className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">Retry</button>
        </div>
      ) : !consultation ? (
        <p role="status" className="py-6 text-center text-sm text-slate-500">Loading consultation notes…</p>
      ) : (
        <div className="space-y-3">
          {[
            ["Consultation Notes", consultation.notes],
            ["Diagnosis", consultation.diagnosis],
            ["Prescription / Recommendations", consultation.prescriptions?.join("\n\n")],
          ].map(([label, value]) => (
            <section key={label} className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#1a3a8f]">{label}</h3>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{value || "Not recorded"}</p>
            </section>
          ))}
        </div>
      )}
    </dialog>
  );
}
