import useLiveData from "@/hooks/useLiveData";
import useAppDialog from "@/hooks/useAppDialog";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, ClipboardList, X } from "lucide-react";
import api from "@/services/api";

const fields = [
  { key: "notes", label: "Consultation Notes", rows: 4 },
  { key: "diagnosis", label: "Diagnosis", rows: 2 },
  { key: "prescription", label: "Prescription / Recommendations", rows: 3 },
];
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50";
const valuesFor = (consultation) => ({
  notes: consultation?.notes ?? "",
  diagnosis: consultation?.diagnosis ?? "",
  prescription: consultation?.prescriptions?.join("\n\n") ?? "",
});

export default function ConsultationNotesDialog({ visit, consultationId, onClose }) {
  const showDialog = useAppDialog();
  const dialogRef = useRef(null);
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [status, setStatus] = useState("");
  const values = valuesFor(consultation);
  const changes = editor ? Object.fromEntries(
    Object.entries(editor.values).filter(([field, value]) => value !== editor.original[field])
  ) : {};
  const hasChanges = Object.keys(changes).length > 0;
  const confirmDiscard = useUnsavedChanges(hasChanges, saving);
  const endpoint = "/doctor/consultations/" + consultationId;

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

  useLiveData(useCallback(async (signal) => {
    try {
      const response = await api.get(endpoint, { signal });
      if (!signal.aborted) { setConsultation(response.data); setError(''); }
    } catch (err) { if (!signal.aborted) setError(err.message); }
  }, [endpoint]), !editor && !saving, retry);

  const save = async (patch, revision, message) => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    setStatus("");
    try {
      const response = await api.patch(endpoint, { ...patch, revision });
      setConsultation(response.data);
      setEditor(null);
      setStatus(message);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteNotes = async () => {
    const confirmed = await showDialog({
      title: "Delete consultation notes?",
      message: "This clears the notes for this visit. Its diagnosis and prescription stay saved.",
      confirmLabel: "Delete notes",
      destructive: true,
    });
    if (confirmed) await save({ notes: "" }, consultation.revision, "Consultation notes deleted.");
  };

  const details = {
    ...visit,
    ...consultation,
    patient_full_name: consultation?.patient_full_name || visit?.patient_full_name,
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="saved-consultation-title"
      onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl backdrop:bg-slate-900/55 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <h2 id="saved-consultation-title" className="text-xl font-bold tracking-tight text-[#1a3a8f]">Consultation Notes</h2>
          <p className="mt-1 text-xs text-slate-500">{editor ? "Editing consultation" : "Saved consultation"}</p>
        </div>
        <button type="button" autoFocus onClick={onClose} disabled={saving} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50">
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
      {status && <p role="status" className="mb-3 text-sm font-medium text-emerald-800">{status}</p>}
      {saveError && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{saveError}</p>}
      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => { setError(""); setRetry((value) => value + 1); }} className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">Retry</button>
        </div>
      ) : !consultation ? (
        <p role="status" className="py-6 text-center text-sm text-slate-500">Loading consultation notes…</p>
      ) : editor ? (
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (hasChanges) void save(changes, editor.revision, "Consultation updated.");
        }}>
          {fields.map(({ key, label, rows }) => (
            <label key={key} className="block text-sm font-semibold text-[#1a3a8f]">
              {label}
              <textarea rows={rows} value={editor.values[key]} disabled={saving}
                onChange={(event) => {
                  const value = event.target.value;
                  setEditor((current) => ({ ...current, values: { ...current.values, [key]: value } }));
                }}
                className="mt-2 block w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base font-normal text-slate-800 focus:border-blue-600 focus:outline-2 focus:outline-blue-600 sm:text-sm" />
            </label>
          ))}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" disabled={saving} className={buttonClass} onClick={async () => {
              if (!await confirmDiscard()) return;
              setEditor(null);
              setSaveError("");
            }}>Cancel edit</button>
            <button type="submit" disabled={saving || !hasChanges} className={`${buttonClass} bg-blue-800 text-white hover:bg-blue-900`}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {fields.map(({ key, label }) => (
            <section key={key} className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#1a3a8f]">{label}</h3>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{values[key] || "Not recorded"}</p>
            </section>
          ))}
          {consultation.revision && (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={deleteNotes} disabled={saving || !values.notes}
                className={`${buttonClass} text-red-700 hover:bg-red-50`}>Delete notes</button>
              <button type="button" disabled={saving} className={`${buttonClass} bg-blue-800 text-white hover:bg-blue-900`}
                onClick={() => {
                  setStatus("");
                  setSaveError("");
                  setEditor({ original: values, values, revision: consultation.revision });
                }}>Edit consultation</button>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
