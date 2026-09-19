import QueueStatus from "./QueueStatus";
import { Footer } from "@/pages/LandingPage";

const ORANGE = "#f97316";
const NAVY = "#2d3a8c";
const BLUE = "#1e4db7";

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
        <div className="mx-auto max-w-6xl space-y-6">
          <section
            className="grid gap-4 sm:grid-cols-2"
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
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Quick actions"
          >
            <button
              type="button"
              onClick={onGetQueue}
              disabled={hasActiveQueue}
              className="flex min-h-16 items-center justify-between rounded-2xl bg-[#f97316] px-5 py-4 text-left text-white shadow-md shadow-orange-500/30 transition hover:bg-[#ea6d10] focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-65 sm:px-6"
            >
              <span>
                <span className="block text-base font-extrabold">
                  Get queue number
                </span>
                <span className="mt-0.5 block text-xs text-white/80">
                  {hasActiveQueue
                    ? "You already have an active queue"
                    : "Join the dental queue"}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={onGoAppointments}
              className="flex min-h-16 items-center justify-between rounded-2xl border border-[#d1d5db] bg-white px-5 py-4 text-left text-[#374151] shadow-sm transition hover:border-[#1e4db7] hover:bg-[#eff6ff] focus:outline-none focus:ring-4 focus:ring-blue-100 sm:px-6"
            >
              <span>
                <span className="block text-base font-extrabold">
                  Appointment history
                </span>
                <span className="mt-0.5 block text-xs text-[#6b7280]">
                  Review your consultations
                </span>
              </span>
            </button>
          </section>

          {hasActiveQueue && (
            <QueueStatus queue={queue} onCancel={onCancelQueue} />
          )}

          <section
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
      <Footer />
    </>
  );
}

function QueueBanner({ label, value, color }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl px-5 py-5 text-white shadow-lg sm:px-6"
      style={{ backgroundColor: color }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
        {value ?? "—"}
      </p>
    </div>
  );
}

function InfoCard({ title, value, detail, accent, onClick }) {
  const content = (
    <span className="min-w-0 flex-1">
      <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
        {title}
      </span>
      <span className="mt-1 block truncate text-lg font-extrabold text-[#111827]">
        {value}
      </span>
      {detail && (
        <span className="mt-0.5 block truncate text-xs text-[#6b7280]">
          {detail}
        </span>
      )}
    </span>
  );

  const classes =
    "flex min-h-32 flex-col justify-center rounded-2xl border border-[#e5e7eb] border-l-4 bg-white p-5 text-left shadow-sm";

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
