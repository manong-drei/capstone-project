import { useEffect, useState } from "react";
import QueueStatus from "./QueueStatus";
import { Footer } from "@/pages/LandingPage";

const ORANGE = "#f97316";
const NAVY = "#2d3a8c";
const BLUE = "#1e4db7";

const CHO_MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2564.558871295493!2d122.83512719999999!3d10.538003599034457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33aec71e206eb71d%3A0xfbcc4df1333ed49a!2sCity%20Health%20Office%20of%20Bago!5e0!3m2!1sen!2sph!4v1791246126385!5m2!1sen!2sph";

export default function PatientHomeTab({
  queueStatus,
  doctorAvailability,
  hasActiveQueue,
  queue,
  myQueueSubtitle,
  onGetQueue,
  onCancelQueue,
  onGoAppointments,
}) {
  const [showMap, setShowMap] = useState(false);

  const doctorAvailable = doctorAvailability !== 0;
  const availabilityLabel =
    doctorAvailability === null
      ? "Checking availability"
      : doctorAvailable
        ? "Available today"
        : "Unavailable today";

  const quickLinks = [
    {
      label: "Appointment history",
      detail: "View past visits",
      onClick: onGoAppointments,
      accent: BLUE,
    },
    {
      label: "Location",
      detail: "City Health Office",
      onClick: () => setShowMap(true),
      accent: "#1e1b4b",
    },
    {
      label: "CHO services",
      detail: "Explore available care",
      accent: ORANGE,
    },
  ];

  return (
    <>
      <section
        className="relative isolate flex min-h-[320px] items-center overflow-hidden bg-cover bg-center px-4 py-14 text-center sm:min-h-[360px] sm:px-6"
        style={{ backgroundImage: "url('/assets/BGHero.webp')" }}
      >
        <div className="absolute inset-0 -z-10 bg-white/45" />
        <div className="mx-auto max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold tracking-wide text-[#2d3a8c] shadow-sm">
            E-KALUSUGAN PATIENT PORTAL
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-4xl">
            Your Health, Schedule.
            <span className="block text-[#1e4db7]">No More Long Waits.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#374151] sm:text-base">
            Get your queue number online, check doctor availability, and track
            your wait time from your phone.
          </p>
        </div>
      </section>

      <main className="bg-[#f3f4f6] px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
          <section
            className="grid grid-cols-2 gap-3 sm:gap-4"
            aria-label="Live queue status"
          >
            <QueueBanner
              label="Now serving"
              value={queueStatus.now_serving}
              color={ORANGE}
            />
            <QueueBanner
              label="Next in queue"
              value={queueStatus.next_queuing}
              color={NAVY}
            />
          </section>

          <section
            className="grid grid-cols-2 gap-3"
            aria-label="Quick actions"
          >
            <button
              type="button"
              onClick={onGetQueue}
              disabled={hasActiveQueue}
              className="flex min-h-20 min-w-0 items-center rounded-2xl bg-[#f97316] px-3 py-4 text-left text-white shadow-md shadow-orange-500/30 transition hover:bg-[#ea6d10] focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-16 sm:px-6"
            >
              <span className="min-w-0">
                <span className="block text-sm font-extrabold leading-snug sm:text-base">
                  Get queue number
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-white/80 sm:text-xs">
                  {hasActiveQueue
                    ? "You already have an active queue"
                    : "Join the dental queue"}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={onGoAppointments}
              className="flex min-h-20 min-w-0 items-center rounded-2xl border border-[#d1d5db] bg-white px-3 py-4 text-left text-[#374151] shadow-sm transition hover:border-[#1e4db7] hover:bg-[#eff6ff] focus:outline-none focus:ring-4 focus:ring-blue-100 sm:min-h-16 sm:px-6"
            >
              <span className="min-w-0">
                <span className="block text-sm font-extrabold leading-snug sm:text-base">
                  Appointment history
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-[#6b7280] sm:text-xs">
                  Review your consultations
                </span>
              </span>
            </button>
          </section>

          {hasActiveQueue && (
            <QueueStatus queue={queue} onCancel={onCancelQueue} />
          )}

          <section
            className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
            aria-label="Patient information"
          >
            <InfoCard
              title="My queue number"
              value={hasActiveQueue ? queue.queue_number : "—"}
              detail={myQueueSubtitle}
              accent={ORANGE}
            />
            <InfoCard
              title="Estimated wait"
              value="~15 min"
              detail="Based on the current queue"
              accent={BLUE}
            />
            <InfoCard
              title="Doctor availability"
              value={availabilityLabel}
              detail={
                doctorAvailability === null
                  ? "Please wait a moment"
                  : doctorAvailable
                    ? "Ready to receive patients"
                    : "Please check again later"
              }
              accent={
                doctorAvailability === null
                  ? "#9ca3af"
                  : doctorAvailable
                    ? "#059669"
                    : "#dc2626"
              }
            />
            {quickLinks.map(({ label, detail, onClick, accent }) => (
              <InfoCard
                key={label}
                title={label}
                value={detail}
                accent={accent}
                onClick={onClick}
              />
            ))}
          </section>
        </div>
      </main>

      {showMap && <LocationMapModal onClose={() => setShowMap(false)} />}

      <Footer />
    </>
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
          className="h-[45dvh] max-h-[380px] min-h-0 w-full"
          style={{ border: 0 }}
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

function QueueBanner({ label, value, color }) {
  return (
    <div
      className="relative min-w-0 overflow-hidden rounded-2xl px-3 py-4 text-white shadow-lg sm:px-6 sm:py-5"
      style={{ backgroundColor: color }}
    >
      <p className="text-[10px] font-bold uppercase leading-snug tracking-[0.1em] text-white/75 sm:text-xs sm:tracking-[0.14em]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
        {value ?? "—"}
      </p>
    </div>
  );
}

function InfoCard({ title, value, detail, accent, onClick }) {
  const content = (
    <span className="min-w-0 flex-1">
      <span className="block text-[10px] font-bold uppercase leading-snug tracking-[0.08em] text-[#9ca3af] sm:text-[11px] sm:tracking-[0.12em]">
        {title}
      </span>
      <span className="mt-1 block break-words text-base font-extrabold leading-snug text-[#111827] sm:text-lg">
        {value}
      </span>
      {detail && (
        <span className="mt-1 block break-words text-[11px] leading-snug text-[#6b7280] sm:text-xs">
          {detail}
        </span>
      )}
    </span>
  );

  const classes =
    "flex min-h-28 min-w-0 flex-col justify-center rounded-2xl border border-[#e5e7eb] border-l-4 bg-white p-3 text-left shadow-sm sm:min-h-32 sm:p-5";

  if (!onClick)
    return (
      <div className={classes} style={{ borderLeftColor: accent }}>
        {content}
      </div>
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${classes} cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100`}
      style={{ borderLeftColor: accent }}
    >
      {content}
    </button>
  );
}
