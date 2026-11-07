import { useEffect, useState } from "react";
import { Skeleton } from "@/components/common/LoadingState";
import DentalQueueGuide from "./DentalQueueGuide";
import { QUEUE_STATUS } from "@/constants/queue";
import { formatPatientDate } from "@/utils/queueDisplay";

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
  doctorError,
  doctorLoaded = true,
  hasActiveQueue,
  registrationMessage,
  queue,
  queueError,
  queueStatusError,
  queueStatusLoaded = true,
  ticketLoading = false,
  canRequestQueue = true,
  onGetQueue,
  onGoAppointments,
  onGoQueue,
}) {
  const [showMap, setShowMap] = useState(false);
  const [showQueueGuide, setShowQueueGuide] = useState(false);
  const estimatedWait = getWaitDisplay(
    queue,
    hasActiveQueue,
    doctorAvailability,
    queueError,
  );
  const availability =
    doctorAvailability === null
      ? {
          value: "Availability unknown",
          detail: "Please check with clinic staff.",
          color: "border-l-slate-500",
        }
      : doctorLeaveEnd
        ? {
            value: "On leave",
            detail: `Through ${formatPatientDate(doctorLeaveEnd)}`,
            color: "border-l-red-600 bg-red-50! [&>strong]:text-red-800",
          }
        : doctorAvailability === 0
          ? {
              value: "Unavailable today",
              detail: "Please check again later.",
              color: "border-l-red-600 bg-red-50! [&>strong]:text-red-800",
            }
          : {
              value: "Available today",
              detail: "Ready to receive patients.",
              color: "border-l-emerald-600",
            };

  return (
    <>
      <section
        data-testid="patient-hero"
        className="relative isolate grid min-h-64 place-items-center bg-[url('/assets/BGHero.webp')] bg-cover bg-center px-4 py-10 text-center sm:min-h-[360px] sm:px-6"
      >
        <div className="absolute inset-0 -z-10 bg-neutral-950/75" />
        <div>
          <p className="inline-block rounded-full bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-neutral-900 shadow-sm sm:text-sm">
            E-KALUSUGAN PATIENT PORTAL
          </p>
          <h1 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
            Your Health, Schedule.
            <span className="mt-1 block text-orange-300">
              No More Long Waits.
            </span>
          </h1>
        </div>
      </section>

      <div className="patient-home-content mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8">
        <section
          aria-label="Live queue status"
          aria-busy={!queueStatusLoaded}
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          <QueueBanner
            label={
              queueStatus.current_status === QUEUE_STATUS.CALLED
                ? "Called — report to staff"
                : "Now serving"
            }
            value={
              !queueStatusLoaded
                ? "Checking…"
                : queueStatusError
                  ? "Unavailable"
                  : queueStatus.now_serving || "—"
            }
            color="bg-orange-500 text-slate-950"
          />
          <QueueBanner
            label="Next in queue"
            value={
              !queueStatusLoaded
                ? "Checking…"
                : queueStatusError
                  ? "Unavailable"
                  : queueStatus.next_queuing || "—"
            }
            color="bg-[#2d3a8c] text-white"
          />
        </section>
        {queueStatusError && (
          <p role="alert" className="text-sm font-medium text-red-800">
            {queueStatusError}
          </p>
        )}

        <section aria-label="Quick actions" className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onGetQueue}
            disabled={!canRequestQueue}
            className="min-h-20 min-w-0 rounded-2xl bg-orange-500 px-3 py-4 text-left text-slate-950 shadow-sm enabled:hover:bg-orange-400 disabled:bg-orange-200 sm:px-6"
          >
            <span className="block text-base text-white leading-snug font-bold sm:text-lg">
              Get queue ticket
            </span>
            <span className="mt-1 block text-sm text-white">
              {hasActiveQueue
                ? "You already have an active queue"
                : registrationMessage
                  ? "Registration closed"
                  : canRequestQueue
                    ? "Join the dental queue"
                    : "Queue registration pending"}
            </span>
          </button>
          <button
            type="button"
            onClick={onGoAppointments}
            className="min-h-20 min-w-0 rounded-2xl border border-slate-300 bg-white px-3 py-4 text-left shadow-sm hover:bg-blue-50 sm:px-6"
          >
            <span className="block text-base leading-snug font-bold text-blue-950 sm:text-lg">
              Appointment history
            </span>
            <span className="mt-1 block text-sm text-slate-700">
              Review your consultations
            </span>
          </button>
        </section>

        {!hasActiveQueue && registrationMessage && (
          <p
            role="status"
            className="rounded-xl bg-orange-50 p-4 text-sm text-orange-950"
          >
            {registrationMessage}
          </p>
        )}
        {queueError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
          >
            {queueError} Displayed ticket information may be outdated.
          </p>
        )}

        <section
          aria-label="Patient information"
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
        >
          <InfoCard
            title="My queue number"
            value={
              ticketLoading ? (
                <span role="status" aria-label="Loading your queue ticket">
                  <Skeleton className="mt-2 h-5 w-24" />
                </span>
              ) : hasActiveQueue ? (
                queue.queue_number
              ) : queueError ? (
                "Unavailable"
              ) : (
                "No active queue number"
              )
            }
            color="border-l-orange-500"
          >
            {onGoQueue && (
              <button
                type="button"
                onClick={onGoQueue}
                className="min-h-11 rounded-sm text-sm font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-950"
              >
                View queue line
              </button>
            )}
          </InfoCard>
          <InfoCard
            title="Estimated wait"
            value={ticketLoading ? "Checking…" : estimatedWait.value}
          >
            <p>
              {ticketLoading
                ? "Loading your queue ticket."
                : estimatedWait.detail}
            </p>
          </InfoCard>
          <InfoCard
            title="Doctor availability"
            value={doctorLoaded ? availability.value : "Checking…"}
            color={doctorLoaded ? availability.color : undefined}
          >
            <p>
              {doctorLoaded
                ? availability.detail
                : "Checking dentist availability."}
            </p>
            {doctorError && (
              <p role="alert" className="text-red-800">
                {doctorError}
              </p>
            )}
          </InfoCard>
          <InfoCard
            value="How the dental queue works"
            onClick={() => setShowQueueGuide(true)}
          />
          <InfoCard
            title="Location"
            value="City Health Office"
            color="border-l-indigo-900"
            onClick={() => setShowMap(true)}
          />
          <InfoCard
            title="CHO services"
            value="Explore available care"
            color="border-l-orange-500"
          />
        </section>
      </div>

      {showMap && <LocationMapModal onClose={() => setShowMap(false)} />}
      {showQueueGuide && (
        <DentalQueueGuide onClose={() => setShowQueueGuide(false)} />
      )}
    </>
  );
}

function QueueBanner({ label, value, color }) {
  return (
    <div
      className={`min-w-0 rounded-2xl px-3 py-4 shadow-md sm:px-6 sm:py-5 ${color}`}
    >
      <p className="text-xs text-white font-bold tracking-wide uppercase sm:text-sm">
        {label}
      </p>
      <strong className="mt-2 block text-2xl text-white leading-tight font-extrabold wrap-anywhere tabular-nums sm:text-4xl">
        {value}
      </strong>
    </div>
  );
}

function InfoCard({
  title,
  value,
  color = "border-l-blue-700",
  onClick,
  children,
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      className={`min-w-0 rounded-2xl border border-slate-200 border-l-4 bg-white p-3 text-left text-sm leading-relaxed text-slate-700 shadow-sm sm:p-5 ${color} ${onClick ? "hover:bg-blue-50" : ""}`}
    >
      {title && <span className="block font-bold text-slate-600">{title}</span>}
      <strong className="mt-1 block text-base leading-snug font-bold wrap-anywhere text-blue-950 sm:text-lg">
        {value}
      </strong>
      {children}
    </Tag>
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
