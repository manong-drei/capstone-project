/**
 * GeneralQueueMonitor.jsx — Waiting-area TV/monitor display for the
 * Dental Check-up queue. Meant to be opened in kiosk/full-screen mode.
 *
 * Layout: left 70% queue info and skipped tickets, right 30% clinic image.
 * Polls /queue?category=dental every 10 seconds and keeps backend serving order.
 */

import { useEffect, useState } from "react";
import { Stethoscope, Volume2, VolumeX } from "lucide-react";
import { getAllQueues } from "@/services/queueService";
import { formatQueueTime } from "@/utils/queueDisplay";

const POLL_INTERVAL_MS = 10_000;
const UPCOMING_LIMIT = 10;

const KEYFRAMES = `
  @keyframes gqm-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.35; transform: scale(1.8); }
  }
  @keyframes gqm-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const FONT_STACK =
  "font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif]";
const PULSE = "[animation:gqm-pulse_1.8s_ease-in-out_infinite]";
const FADE_UP =
  "[animation:gqm-fade-up_0.55s_cubic-bezier(0.22,1,0.36,1)_both]";

function formatTime(date) {
  return date.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date) {
  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GeneralQueueMonitor() {
  const [queues, setQueues] = useState([]);
  const [now, setNow] = useState(new Date());
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const speechSupported =
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance === "function";

  useEffect(() => {
    // The browser copied the opening tab's session; disconnect the monitor from its dashboard.
    window.opener = null;
    let cancelled = false;

    const fetchQueue = async () => {
      try {
        const data = await getAllQueues("dental");
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setQueues(list);
      } catch {
        // Silent on polling — keep last-known good state visible.
      }
    };

    fetchQueue();
    const pollId = setInterval(fetchQueue, POLL_INTERVAL_MS);
    const clockId = setInterval(() => setNow(new Date()), 1000);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      clearInterval(clockId);
    };
  }, []);

  const currentServing =
    queues.find((q) => ["called", "serving"].includes(q.status)) ?? null;
  const waitingList = queues.filter((q) => q.status === "waiting");
  const nextServing = waitingList[0] ?? null;
  const upcoming = waitingList.slice(1, 1 + UPCOMING_LIMIT);
  const remaining = Math.max(waitingList.length - 1 - upcoming.length, 0);
  const recoverableTickets = queues
    .filter(
      (queue) =>
        queue.status === "missed" &&
        new Date(queue.grace_expires_at).getTime() > now.getTime(),
    )
    .sort(
      (a, b) => new Date(a.grace_expires_at) - new Date(b.grace_expires_at),
    );

  const servingId = currentServing?.id;
  const servingNumber = currentServing?.queue_number;
  const lastCalledAt = currentServing?.last_called_at;

  useEffect(() => {
    if (
      !announcementsEnabled ||
      !speechSupported ||
      !servingId ||
      !servingNumber
    )
      return;

    const spokenNumber = servingNumber.replace(/-/g, "").split("").join(" ");
    const synth = window.speechSynthesis;
    const utterances = [];
    const onError = (event) => {
      if (["canceled", "interrupted"].includes(event.error)) return;
      setAnnouncementsEnabled(false);
      setAnnouncementError(
        "Announcement could not play. Check this device's sound and enable announcements again.",
      );
    };
    const announce = () => {
      const voices = synth.getVoices();
      if (!voices.length) return;
      synth.removeEventListener("voiceschanged", announce);
      // shortcut: Web Speech has no gender field; expand known female names when supporting other device voices.
      const femaleVoices = voices.filter(
        (voice) =>
          /^en\b/i.test(voice.lang) &&
          /\b(female|zira|hazel|susan|jenny|aria|rosa|samantha)\b/i.test(
            voice.name,
          ),
      );
      const voice =
        femaleVoices.find((voice) => voice.lang.toLowerCase() === "en-ph") ||
        femaleVoices[0];
      if (!voice) {
        setAnnouncementsEnabled(false);
        setAnnouncementError(
          "No recognized female English voice is available. Install Microsoft Zira or another supported female English voice, then enable announcements again.",
        );
        return;
      }
      for (let repeat = 0; repeat < 2; repeat++) {
        const utterance = new window.SpeechSynthesisUtterance(
          `Now serving. Queue number ${spokenNumber}. Please proceed to the dentist.`,
        );
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.onerror = onError;
        utterances.push(utterance);
        synth.speak(utterance);
      }
    };
    synth.cancel();
    synth.addEventListener("voiceschanged", announce);
    announce();

    return () => {
      synth.removeEventListener("voiceschanged", announce);
      for (const utterance of utterances) utterance.onerror = null;
      synth.cancel();
    };
  }, [
    announcementsEnabled,
    speechSupported,
    servingId,
    servingNumber,
    lastCalledAt,
  ]);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        className={`min-h-screen w-full flex bg-[#1e2d6b] text-white ${FONT_STACK} overflow-hidden`}
      >
        {/* Left column — queue info (70%) */}
        <div className="basis-[70%] shrink-0 grow-0 min-w-0 h-screen grid grid-rows-[auto_minmax(0,1.3fr)_minmax(0,1fr)] gap-4 p-6 xl:gap-5 xl:p-8 bg-[#1e2d6b]">
          <Header
            now={now}
            speechSupported={speechSupported}
            announcementsEnabled={announcementsEnabled}
            announcementError={announcementError}
            onToggleAnnouncements={() => {
              setAnnouncementError("");
              setAnnouncementsEnabled((enabled) => !enabled);
            }}
          />

          <PanelPair current={currentServing} next={nextServing} />

          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 xl:gap-5 min-h-0">
            <UpcomingList upcoming={upcoming} remaining={remaining} />
            <SkippedTickets tickets={recoverableTickets} />
          </div>
        </div>

        {/* Right column — clinic image (30%) */}
        <div className="basis-[30%] shrink-0 grow-0 min-w-0 min-h-screen overflow-hidden relative bg-[#0f1a4a]">
          <img
            src="/assets/BGHero.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover block"
          />
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SkippedTickets({ tickets }) {
  return (
    <section
      aria-labelledby="skipped-tickets-title"
      className={`min-w-0 min-h-0 flex flex-col rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4 xl:p-5 ${FADE_UP}`}
    >
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h2 id="skipped-tickets-title" className="text-[clamp(12px,1.1vw,22px)] font-bold tracking-wide uppercase text-amber-200">Skipped tickets</h2>
        <span className="text-[clamp(10px,0.9vw,16px)] text-amber-200/70">Grace period</span>
      </div>
      {tickets.length ? (
        <ul className="grid grid-cols-2 gap-2.5 min-h-0 overflow-y-auto">
          {tickets.map((queue) => (
            <li
              key={queue.id}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-amber-300/20 bg-amber-300/10 px-1 py-3 xl:py-4"
            >
              <strong className="break-all text-[clamp(18px,1.8vw,34px)] font-extrabold tracking-tight tabular-nums text-amber-100">
                {queue.queue_number}
              </strong>
              <time dateTime={queue.grace_expires_at} className="text-[clamp(10px,0.8vw,15px)] tabular-nums text-amber-100/70">
                {formatQueueTime(queue.grace_expires_at)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p aria-label="No skipped tickets" className="flex-1 grid place-items-center py-4 text-white/40">
          —
        </p>
      )}
      <p className="mt-auto pt-3 text-[clamp(10px,0.9vw,16px)] leading-relaxed text-amber-100/75">
        Report to staff before the deadline to keep your ticket.
      </p>
    </section>
  );
}

function Header({
  now,
  speechSupported,
  announcementsEnabled,
  announcementError,
  onToggleAnnouncements,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-center gap-3">
        <img src="/assets/Logo.jpg" alt="" className="h-[clamp(44px,4vw,76px)] w-[clamp(44px,4vw,76px)] shrink-0 rounded-full border border-white/30 object-cover" />
        <div className="min-w-0">
          <h1 className="text-[clamp(18px,2.1vw,40px)] font-extrabold leading-tight tracking-tight">Dental Check-up Queue</h1>
          <p className="mt-1 flex items-center gap-2 text-[clamp(10px,1vw,18px)] text-white/60">
            <span aria-label="Live queue" className={`h-1.5 w-1.5 shrink-0 rounded-full bg-green-400 ${PULSE}`} />
            E-KALUSUGAN · Bago City Health Center
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
          {speechSupported && (
            <button
              type="button"
              aria-pressed={announcementsEnabled}
              aria-label={
                announcementsEnabled
                  ? "Mute announcements"
                  : "Enable announcements"
              }
              title={
                announcementsEnabled
                  ? "Mute announcements"
                  : "Enable announcements"
              }
              onClick={onToggleAnnouncements}
              className={`inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-[9px] border cursor-pointer transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 ${
                announcementsEnabled
                  ? "bg-[#f97316] border-[#f97316] text-white"
                  : "bg-white/[0.08] border-white/[0.22] text-white hover:bg-white/[0.16]"
              }`}
            >
              {announcementsEnabled ? (
                <Volume2 size={16} strokeWidth={2.2} />
              ) : (
                <VolumeX size={16} strokeWidth={2.2} />
              )}
            </button>
          )}
        <div className="text-right shrink-0">
          <p className="mb-1 text-[clamp(10px,1vw,18px)] text-white/65">{formatDate(now)}</p>
          <p className="text-[clamp(24px,2.4vw,42px)] font-extrabold leading-none tracking-tight tabular-nums">{formatTime(now)}</p>
        </div>
      </div>
      {announcementError ? (
          <p
            role="status"
            className="basis-full text-xs leading-relaxed text-red-300"
          >
            {announcementError}
          </p>
        ) : !speechSupported ? (
          <p role="status" className="basis-full text-xs text-white/55">
            Voice announcements are unavailable in this browser.
          </p>
        ) : null}
    </header>
  );
}

function PanelPair({ current, next }) {
  return (
    <div className={`grid min-h-0 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4 xl:gap-5 ${FADE_UP}`}>
      <QueueCard
        label={
          current?.status === "called"
            ? "Called — report to staff"
            : "Now Serving"
        }
        entry={current}
        emptyText="No patient being served"
        primary
      />
      <QueueCard label="Next Serving" entry={next} emptyText="No one in line" />
    </div>
  );
}

function QueueCard({ label, entry, emptyText, primary }) {
  const cardCls = primary
    ? "bg-linear-to-br from-[#f97316] to-[#ea580c] border-white/20"
    : "bg-[#2d3a8c]/80 border-white/10";

  return (
    <section
      aria-label={primary ? "Current ticket" : "Next ticket"}
      className={`min-w-0 min-h-0 rounded-2xl border p-5 xl:p-6 flex flex-col gap-3 ${cardCls}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[clamp(14px,1.6vw,30px)] font-bold tracking-[0.06em] uppercase text-white/90">{label}</h2>
        {entry?.type === "priority" && <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[clamp(9px,0.8vw,14px)] font-semibold uppercase tracking-wide">Priority</span>}
      </div>

      {entry ? (
        <>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <strong className={`break-all text-center font-black leading-none tracking-[-0.04em] tabular-nums ${primary ? "text-[clamp(64px,9.8vw,168px)]" : "text-[clamp(48px,6.7vw,116px)]"}`}>{entry.queue_number}</strong>
          </div>
          <p className="flex items-center gap-2 text-[clamp(12px,1.6vw,28px)] font-medium text-white/90"><Stethoscope size={20} className="h-[1.15em] w-[1.15em] shrink-0" aria-hidden="true" />Dental Check-up</p>
        </>
      ) : (
        <div
          className="flex-1 flex items-center justify-center text-[clamp(16px,1.7vw,24px)] font-semibold text-center text-white/65"
        >
          {emptyText}
        </div>
      )}
    </section>
  );
}

function UpcomingList({ upcoming, remaining }) {
  return (
    <section
      aria-label="Upcoming"
      className={`min-w-0 min-h-0 flex flex-col bg-white/[0.04] border border-white/10 rounded-2xl p-4 xl:p-5 ${FADE_UP}`}
    >
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-[clamp(12px,1.1vw,22px)] font-bold tracking-wide uppercase text-white/80">Upcoming</h2>
        {remaining > 0 && <span className="text-[clamp(10px,0.9vw,16px)] text-white/50">+{remaining} more</span>}
      </div>

      {upcoming.length === 0 ? (
        <div className="flex-1 grid place-items-center text-center text-white/40 text-sm">
          No patients waiting.
        </div>
      ) : (
        <ol className="grid min-h-0 grid-cols-4 gap-2.5 overflow-y-auto">
          {upcoming.map((queue) => (
            <li key={queue.id} className="min-w-0 rounded-xl border border-white/10 bg-[#2d3a8c] px-1 py-[clamp(8px,1.2vh,16px)] text-center text-[clamp(18px,3.2vh,34px)] font-extrabold leading-none tracking-tight tabular-nums text-white">
              {queue.queue_number}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
