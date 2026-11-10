import { useEffect, useRef, useState } from "react";
import { ClipboardList, LoaderCircle, X } from "lucide-react";
import { getQueueDisplayName } from "@/utils/queueDisplay";

const inputClass =
  "mt-2 block w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-2 focus:outline-blue-600 sm:text-sm";

export default function ConsultationModal({
  isOpen,
  onClose,
  onSubmit,
  patient,
  draft,
  loading = false,
}) {
  const dialogRef = useRef(null);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [loadedKey, setLoadedKey] = useState(null);
  const openKey = isOpen ? String(patient?.id ?? "") : null;
  if (openKey !== loadedKey) {
    setLoadedKey(openKey);
    if (isOpen) {
      setNotes(draft?.notes ?? "");
      setDiagnosis(draft?.diagnosis ?? "");
      setPrescription(draft?.prescription ?? "");
    }
  }

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!notes.trim() || loading) return;
    onSubmit({ notes, diagnosis, prescription });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="consultation-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/55 sm:rounded-[20px]"
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden rounded-xl bg-blue-50 p-3 text-blue-700 sm:block">
              <ClipboardList size={24} aria-hidden="true" />
            </span>
            <h2
              id="consultation-title"
              className="text-lg font-bold text-[#1a3a8f] sm:text-xl"
            >
              Consultation Remarks
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close consultation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        {patient && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <span className="max-w-full break-words rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-bold text-white">
              {patient.queue_number}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold text-slate-900">
                {getQueueDisplayName(patient)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Dental services</p>
            </div>
            {patient.type === "priority" && (
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                Priority
              </span>
            )}
          </div>
        )}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="consultation-notes"
              className="text-sm font-semibold text-slate-700"
            >
              Consultation Remarks <span className="text-red-600">*</span>
            </label>
            <textarea
              id="consultation-notes"
              rows={4}
              required
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Chief complaint, history, physical examination findings..."
              aria-describedby="consultation-required"
              className={inputClass}
            />
            <p
              id="consultation-required"
              className="mt-1 text-xs text-slate-500"
            >
              Required
            </p>
          </div>
          <div>
            <label
              htmlFor="consultation-diagnosis"
              className="text-sm font-semibold text-slate-700"
            >
              Diagnosis
            </label>
            <textarea
              id="consultation-diagnosis"
              rows={2}
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Assessment / Diagnosis..."
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="consultation-prescription"
              className="text-sm font-semibold text-slate-700"
            >
              Prescription / Recommendations
            </label>
            <textarea
              id="consultation-prescription"
              rows={3}
              value={prescription}
              onChange={(event) => setPrescription(event.target.value)}
              placeholder="Medications, dosage, follow-up instructions..."
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!notes.trim() || loading}
              className="inline-flex min-h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-[#1e4db7] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {loading && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {loading ? "Saving..." : "Save Consultation"}
            </button>
          </div>
          {!notes.trim() && (
            <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
              Add remarks to enable saving.
            </p>
          )}
        </div>
      </form>
    </dialog>
  );
}
