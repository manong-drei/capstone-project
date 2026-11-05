import { useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import {
  formatPatientDate,
  formatQueueTime,
  getServiceLabels,
} from "@/utils/queueDisplay";

const PAGE_SIZE = 5;
const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export default function PatientAppointmentsTab({
  appointments,
  apptLoading,
  error,
  onRetry,
  onBack,
}) {
  const [page, setPage] = useState(1);
  const topRef = useRef(null);

  const totalItems = appointments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  // Clamp so a refetch that shrinks the list never leaves us on an empty page
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageAppointments = appointments.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );
  const showingFrom = totalItems ? startIndex + 1 : 0;
  const showingTo = startIndex + pageAppointments.length;

  function goToPage(next) {
    setPage(Math.min(Math.max(next, 1), totalPages));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      ref={topRef}
      className="grid scroll-mt-4 gap-6"
      aria-labelledby="patient-history-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1
            id="patient-history-title"
            className="text-2xl font-bold tracking-tight text-blue-950"
          >
            Appointment History
          </h1>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to dashboard
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700"
        >
          {error}
          <button
            type="button"
            className="ml-2 min-h-11 rounded-lg px-2 font-medium text-blue-800 hover:bg-blue-50"
            onClick={onRetry}
          >
            Retry history
          </button>
        </div>
      )}
      {apptLoading && !appointments.length ? (
        <p role="status">Loading appointments…</p>
      ) : !error && !appointments.length ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-xs">
          <h2 className="text-lg font-semibold text-blue-950">
            No appointments found.
          </h2>
          <p className="text-sm text-slate-500">
            Your recorded visits will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pageAppointments.map((appt) => {
            const doctor = [
              appt.doctor_first_name,
              appt.doctor_middle_name,
              appt.doctor_last_name,
              appt.doctor_suffix,
            ]
              .filter(Boolean)
              .join(" ");
            const services = getServiceLabels(appt.queue_services);
            let recommendations = appt.recommendations;
            if (typeof recommendations === "string") {
              try {
                recommendations = JSON.parse(recommendations);
              } catch {
                recommendations = [recommendations];
              }
            }
            const time = /^\d{2}:\d{2}(:\d{2})?$/.test(
              appt.appointment_time || "",
            )
              ? `${formatQueueTime(`2000-01-01T${appt.appointment_time}+08:00`)} PHT`
              : "Not recorded";
            return (
              <details
                key={appt.appointment_id}
                className="group min-w-0 rounded-2xl border border-slate-200 bg-white shadow-xs"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 rounded-2xl p-5 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-40 flex-1">
                    <h2 className="text-sm font-semibold text-blue-950">
                      {doctor ? `Dr. ${doctor}` : "Dentist not recorded"}
                    </h2>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      {formatPatientDate(appt.appointment_date)} · {time}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      {services.join(", ") ||
                        (appt.reason !== "Same-day queue registration" &&
                          appt.reason) ||
                        "Services not recorded"}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                  <span className="flex items-center gap-2 text-xs font-medium text-blue-800">
                    View details
                    <ChevronDown
                      size={16}
                      className="transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <dl className="grid gap-5 border-t border-slate-100 p-5 sm:grid-cols-2 [&_dt]:mb-1 [&_dt]:text-xs [&_dt]:text-slate-500 [&_dd]:text-sm [&_dd]:leading-6 [&_dd]:whitespace-pre-wrap [&_dd]:wrap-anywhere">
                  <div>
                    <dt>Visit reference</dt>
                    <dd>#{appt.appointment_id}</dd>
                  </div>
                  <div>
                    <dt>Services</dt>
                    <dd>{services.join(", ") || "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Visit notes</dt>
                    <dd>{appt.notes || "No visit notes recorded."}</dd>
                  </div>
                  <div>
                    <dt>Diagnosis</dt>
                    <dd>
                      {appt.diagnosis ||
                        "No diagnosis available for this visit."}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt>Prescription / Recommendations</dt>
                    <dd>
                      {Array.isArray(recommendations) && recommendations.length
                        ? recommendations.map((text, i) => (
                            <p key={i}>{String(text)}</p>
                          ))
                        : "No recommendations available for this visit."}
                    </dd>
                  </div>
                  {appt.cancellation_reason && (
                    <div className="sm:col-span-2">
                      <dt>Cancellation reason</dt>
                      <dd>{appt.cancellation_reason}</dd>
                    </div>
                  )}
                </dl>
              </details>
            );
          })}
        </div>
      )}

      {totalItems > 0 && (
        <nav
          aria-label="Appointment history pagination"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xs"
        >
          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:gap-4">
            <p aria-live="polite" className="text-slate-500">
              Showing {showingFrom}–{showingTo} of {totalItems}
            </p>
            <span className="text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
              className={`${SECONDARY_BUTTON} px-4`}
            >
              <ChevronLeft size={17} aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className={`${SECONDARY_BUTTON} px-4`}
            >
              Next
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
