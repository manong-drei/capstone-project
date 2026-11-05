import { useEffect, useState } from "react";
import { ArrowRight, Clock3, MapPin, Radio, Ticket } from "lucide-react";
import QueueStatus from "./QueueStatus";
import PatientQueueLine from "./PatientQueueLine";
import { QUEUE_STATUS } from "@/constants/queue";

const CHO_MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2564.558871295493!2d122.83512719999999!3d10.538003599034457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aec71e206eb71d%3A0xfbcc4df1333ed49a!2sCity%20Health%20Office%20of%20Bago!5e0!3m2!1sen!2sph!4v1791246126385!5m2!1sen!2sph";

function getWaitDisplay(queue, hasActiveQueue, doctorAvailability, queueError) {
  if (queueError)
    return {
      value: "Unavailable",
      detail: "Queue updates failed. Retrying automatically.",
    };
  if (!hasActiveQueue)
    return { value: "—", detail: "Join the queue to see your estimate" };
  if (queue.status === QUEUE_STATUS.CALLED)
    return { value: "Your turn", detail: "Please report to staff now" };
  if (queue.status === QUEUE_STATUS.SERVING)
    return { value: "In progress", detail: "You are receiving care" };
  if (queue.status === QUEUE_STATUS.MISSED)
    return { value: "On hold", detail: "Report to staff to rejoin the queue" };
  if (doctorAvailability === 0)
    return {
      value: "Paused",
      detail: "The dentist is unavailable. Please check with staff.",
    };
  if (doctorAvailability === null)
    return { value: "Checking…", detail: "Checking doctor availability" };
  const estimate = queue.wait_estimate;
  if (!estimate || !Number.isFinite(estimate.minutes))
    return {
      value: "Updating…",
      detail: "Waiting for the latest queue estimate",
    };
  if (estimate.minutes === 0)
    return {
      value: "You’re next",
      detail: "No patients ahead. Please stay nearby.",
    };
  const basis =
    estimate.sample_count > 0
      ? "Based on today’s completed visits."
      : "Using 15 min per patient until visits are completed.";
  return {
    value: `~${estimate.minutes} min`,
    detail: `${estimate.patients_ahead} patient${estimate.patients_ahead === 1 ? "" : "s"} ahead. ${basis} Times may change.`,
  };
}

export default function PatientHomeTab({
  queueStatus = {},
  doctorAvailability,
  doctorLeaveEnd,
  hasActiveQueue,
  registrationMessage,
  queue,
  queueError,
  queueStatusError,
  queueStatusLoaded = true,
  lastUpdated,
  onGetQueue,
  onCancelQueue,
  onGoQueue,
}) {
  const [showMap, setShowMap] = useState(false);
  const estimatedWait = getWaitDisplay(
    queue,
    hasActiveQueue,
    doctorAvailability,
    queueError,
  );
  return (
    <div className="@container/patient-home font-[Poppins,sans-serif] text-slate-800 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_:is(button,a,summary):focus-visible]:outline-2 [&_:is(button,a,summary):focus-visible]:outline-offset-4 [&_:is(button,a,summary):focus-visible]:outline-blue-600">
      <div
        className="grid items-start gap-5 @min-[900px]/patient-home:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
        role="region"
        aria-label="Patient information"
      >
        <section
          className="order-2 grid grid-cols-2 gap-3 @min-[600px]/patient-home:order-0 @min-[600px]/patient-home:grid-cols-3 @min-[900px]/patient-home:col-span-2"
          aria-label="Live queue status"
        >
          {[
            {
              label:
                queueStatus.current_status === "called"
                  ? "Called — report to staff"
                  : "Now serving",
              value: queueStatusError
                ? "Unavailable"
                : queueStatus.now_serving || "—",
              icon: Radio,
            },
            {
              label: "Next in queue",
              value: queueStatusError
                ? "Unavailable"
                : queueStatus.next_queuing || "—",
              icon: ArrowRight,
            },
            {
              label: "Estimated wait",
              value: estimatedWait.value,
              detail: estimatedWait.detail,
              icon: Clock3,
            },
          ].map((item) => (
            <div
              className={`min-w-0 rounded-2xl border bg-white p-4 shadow-xs sm:p-5 ${item.detail ? "col-span-2 border-slate-200 @min-[600px]/patient-home:col-span-1" : "border-orange-200/70"}`}
              key={item.label}
            >
              <div>
                <p className="flex items-center justify-between gap-2 text-md font-medium text-slate-800">
                  {item.label}
                  <item.icon
                    size={16}
                    className={
                      item.detail
                        ? "shrink-0 text-blue-700"
                        : "shrink-0 text-orange-700"
                    }
                    aria-hidden="true"
                  />
                </p>
                <strong
                  className={`mt-2 block text-2xl leading-tight font-bold tracking-tight wrap-anywhere tabular-nums sm:text-3xl ${item.detail ? "text-blue-950" : "text-orange-700"}`}
                >
                  {item.value}
                </strong>
                {item.detail && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
        <section
          className="order-1 min-w-0 [&>section:not(:first-child)]:mt-5"
          aria-label="My Queue"
        >
          {(hasActiveQueue || queue?.status === "no_show") && (
            <QueueStatus
              queue={queue}
              onCancel={hasActiveQueue ? onCancelQueue : undefined}
              onViewQueue={onGoQueue}
              lastUpdated={lastUpdated}
              updatesUnavailable={!!queueError}
            />
          )}
          {!hasActiveQueue && (
            <section
              className="flex min-w-0 flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-xs sm:px-8"
              aria-label="Quick actions"
            >
              <span className="grid size-16 place-items-center rounded-2xl bg-orange-50 text-orange-700">
                <Ticket size={30} aria-hidden="true" />
              </span>
              <h2 className="text-lg font-semibold text-blue-950">
                No active queue number
              </h2>

              {registrationMessage && (
                <p role="status" className="text-sm leading-6 text-red-700">
                  {registrationMessage}
                </p>
              )}
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                onClick={onGetQueue}
                disabled={!!registrationMessage || !!doctorLeaveEnd}
              >
                Get queue ticket
              </button>
            </section>
          )}
          {queueError && (
            <p
              role="alert"
              className="my-3 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700"
            >
              {queueError} Displayed ticket information may be outdated.
            </p>
          )}
        </section>
        <div className="order-3 min-w-0">
          <PatientQueueLine
            queueStatus={queueStatus}
            queue={queue}
            hasActiveQueue={hasActiveQueue}
            error={queueStatusError}
            loaded={queueStatusLoaded}
          />
          <button
            type="button"
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium text-blue-800 hover:bg-blue-50"
            onClick={() => setShowMap(true)}
          >
            <MapPin size={16} aria-hidden="true" />
            Clinic location
          </button>
        </div>
      </div>
      {showMap && <LocationMapModal onClose={() => setShowMap(false)} />}
    </div>
  );
}

function LocationMapModal({ onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="City Health Office of Bago location map"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              Location
            </p>
            <p className="truncate text-lg font-extrabold text-[#111827]">
              City Health Office of Bago
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d1d5db] text-lg font-bold leading-none text-[#374151] transition hover:border-[#1e4db7] hover:bg-[#eff6ff] focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            ×
          </button>
        </div>

        <iframe
          title="City Health Office of Bago map"
          src={CHO_MAP_EMBED_SRC}
          className="h-[45dvh] max-h-[380px] min-h-0 w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        <div className="flex justify-end px-5 py-4">
          <a
            href="https://www.google.com/maps/search/?api=1&query=City%20Health%20Office%20of%20Bago"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#1e4db7] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a429b] focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
