import useLiveData from "@/hooks/useLiveData";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { generatePath, useMatch, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import StatusBadge from "@/components/common/StatusBadge";
import api from "@/services/api";

function formatDate(value, includeTime = false) {
  if (!value) return "Not recorded";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+08:00` : value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" } : {}),
  });
}

function DoctorRecordsDialog({ doctorId, onClose }) {
  const dialogRef = useRef(null);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

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
      const response = await api.get('/doctor/' + doctorId + '/records', { signal });
      if (!signal.aborted) { setRecords(response.data); setError(''); }
    } catch (err) { if (!signal.aborted) setError(err.message); }
  }, [doctorId]), true, attempt);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="doctor-records-title"
      aria-modal="true"
      onCancel={onClose}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl rounded-2xl border-0 bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/50"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5 sm:p-6">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold text-slate-500">Doctor records</p>
          <h2 id="doctor-records-title" className="break-words text-lg font-bold">{records ? `Dr. ${[records.doctor.first_name, records.doctor.middle_name, records.doctor.last_name, records.doctor.suffix].filter(Boolean).join(" ")}` : "Doctor records"}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close doctor records" autoFocus className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-700">
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div className="p-5 sm:p-6">
        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            <button type="button" className="mt-3 rounded-lg border border-red-300 px-3 py-2 font-semibold hover:bg-red-100" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Try again</button>
          </div>
        ) : !records ? (
          <p role="status" className="text-sm text-slate-500">Loading doctor records…</p>
        ) : (
          <>
            <section aria-labelledby="doctor-profile-heading">
              <h3 id="doctor-profile-heading" className="mb-4 text-sm font-bold">Doctor information</h3>
              <dl className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["First name", records.doctor.first_name],
                  ["Middle name", records.doctor.middle_name],
                  ["Last name", records.doctor.last_name],
                  ["Suffix", records.doctor.suffix],
                  ["Contact number", records.doctor.contact_number],
                  ["Specialization", records.doctor.specialization_name],
                  ["License number", records.doctor.license_number],
                  ["Date added", formatDate(records.doctor.date_added, true)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="mb-1 text-xs text-slate-500">{label}</dt>
                    <dd className="break-words font-medium">{value || "Not recorded"}</dd>
                  </div>
                ))}
                <div>
                  <dt className="mb-1 text-xs text-slate-500">Today’s availability</dt>
                  <dd><StatusBadge status={records.doctor.leave_end ? "on_leave" : records.doctor.is_available ? "available" : "unavailable"} />{records.doctor.leave_end && <p className="mt-1 text-xs text-slate-500">Through {formatDate(records.doctor.leave_end)}</p>}</dd>
                </div>
              </dl>
            </section>
            <section aria-labelledby="doctor-availability-heading" className="mt-6">
              <h3 id="doctor-availability-heading" className="text-sm font-bold">Availability history</h3>
              <p className="mb-4 mt-1 text-xs leading-relaxed text-slate-500">Latest saved settings for each date, newest first. Dates without saved settings are not listed.</p>
              {records.availability.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">No availability records saved for this doctor yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200" role="region" aria-label="Doctor availability records" tabIndex={0}>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th scope="col" className="whitespace-nowrap px-4 py-3">Date</th>
                        <th scope="col" className="px-4 py-3">Availability</th>
                        <th scope="col" className="px-4 py-3">Appointment limit</th>
                        <th scope="col" className="px-4 py-3">Walk-in limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.availability.map((record) => (
                        <tr key={record.date}>
                          <td className="whitespace-nowrap px-4 py-3">{formatDate(record.date)}</td>
                          <td className="px-4 py-3"><StatusBadge status={record.is_available ? "available" : "unavailable"} /></td>
                          <td className="px-4 py-3">{record.appointment_limit}</td>
                          <td className="whitespace-nowrap px-4 py-3">{record.walk_in_limit === 0 ? "Not set" : record.walk_in_limit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </dialog>
  );
}

/**
 * AdminDoctorsTab
 * Doctor availability grid with admin-only profiles and saved daily records.
 *
 * Props:
 *   doctors — array of doctor objects from /doctor
 */
export default function AdminDoctorsTab({ doctors }) {
  const selectedDoctorId = useMatch(ROUTES.ADMIN_DOCTOR_RECORDS)?.params.id;
  const navigate = useNavigate();

  return (
    <div className="ad-tab-pad rounded-2xl border border-slate-200 bg-white shadow-sm">
      {selectedDoctorId && <DoctorRecordsDialog key={selectedDoctorId} doctorId={selectedDoctorId} onClose={() => navigate(ROUTES.ADMIN_DOCTORS)} />}
      <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
        Doctor Availability
      </h3>
      {doctors.length === 0 ? (
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>No doctors registered yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div
              key={d.doctor_id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                background: "#fff",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="break-words" style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  Dr. {[d.first_name, d.middle_name, d.last_name, d.suffix].filter(Boolean).join(" ")}
                </p>
                {d.specialization_name && (
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#64748b" }}>
                    {d.specialization_name}
                  </p>
                )}
                <StatusBadge status={d.leave_end ? "on_leave" : d.is_available ? "available" : "unavailable"} />
                {d.leave_end && <p className="mt-1 text-xs text-slate-500">Through {formatDate(d.leave_end)}</p>}
                <button
                  type="button"
                  onClick={() => navigate(generatePath(ROUTES.ADMIN_DOCTOR_RECORDS, { id: d.doctor_id }))}
                  aria-label={`View records for Dr. ${[d.first_name, d.middle_name, d.last_name, d.suffix].filter(Boolean).join(" ")}`}
                  className="mt-4 block rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
                >
                  View records
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
