/**
 * GeneralQueueMonitor.jsx — Waiting-area TV/monitor display for the
 * Dental Check-up queue. Meant to be opened in kiosk/full-screen mode.
 *
 * Layout: left 70% queue info, right 30% placeholder image.
 * Polls /queue?category=dental every 10 seconds and keeps backend serving order.
 */

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getAllQueues } from "@/services/queueService";
import { formatQueueTime } from '@/utils/queueDisplay';

const NAVY = "#1e2d6b";
const INDIGO = "#2d3a8c";
const ORANGE = "#f97316";

const POLL_INTERVAL_MS = 10_000;
const UPCOMING_LIMIT = 10;

const STYLES = `
  @keyframes gqm-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.35; transform: scale(1.8); }
  }
  @keyframes gqm-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .gqm-pulse { animation: gqm-pulse 1.8s ease-in-out infinite; }
  .gqm-fade-up { animation: gqm-fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .gqm-upcoming-row + .gqm-upcoming-row { border-top: 1px solid rgba(255,255,255,0.07); }

  .gqm-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.08);
    color: #ffffff;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }
  .gqm-icon-btn:hover { background: rgba(255,255,255,0.16); }
  .gqm-icon-btn[data-on="true"] {
    background: ${ORANGE};
    border-color: ${ORANGE};
    color: #ffffff;
  }
  .gqm-icon-btn:focus-visible { outline: 2px solid #ffffff; outline-offset: 2px; }
`;

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
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

  const currentServing = queues.find((q) => ['called', 'serving'].includes(q.status)) ?? null;
  const waitingList = queues.filter((q) => q.status === "waiting");
  const nextServing = waitingList[0] ?? null;
  const upcoming = waitingList.slice(1, 1 + UPCOMING_LIMIT);
  const remaining = Math.max(waitingList.length - 1 - upcoming.length, 0);
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
  }, [announcementsEnabled, speechSupported, servingId, servingNumber, lastCalledAt]);

  return (
    <>
      <style>{STYLES}</style>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          background: NAVY,
          color: "#ffffff",
          fontFamily:
            "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Left column — queue info (70%) */}
        <div
          style={{
            flex: "0 0 70%",
            padding: "40px 48px",
            display: "flex",
            flexDirection: "column",
            gap: "26px",
            background: NAVY,
          }}
        >
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

          <UpcomingList upcoming={upcoming} remaining={remaining} />
          {queues.some(q => q.status === 'missed') && <section aria-label="Missed calls" className="rounded-2xl border border-amber-300/50 bg-amber-500/15 p-5">
            <h2 className="mb-3 text-lg font-bold text-amber-200">Missed calls</h2>
            {queues.filter(q => q.status === 'missed').map(q => <p key={q.id} className="mb-2 text-base"><strong>{q.queue_number}</strong> — You missed your call. Report to staff before {formatQueueTime(q.grace_expires_at)} to keep this ticket.</p>)}
          </section>}
        </div>

        {/* Right column — placeholder image (30%) */}
        <div
          style={{
            flex: "0 0 30%",
            minHeight: "100vh",
            overflow: "hidden",
            position: "relative",
            background: "#0f1a4a",
          }}
        >
          <img
            src="/assets/BGHero.png"
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Header({
  now,
  speechSupported,
  announcementsEnabled,
  announcementError,
  onToggleAnnouncements,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "24px",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              padding: "5px 14px 5px 11px",
              borderRadius: "999px",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.35)",
            }}
          >
            <span
              className="gqm-pulse"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#86efac",
              }}
            >
              Live
            </span>
          </div>

          {speechSupported && (
            <button
              type="button"
              className="gqm-icon-btn"
              data-on={announcementsEnabled}
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
            >
              {announcementsEnabled ? (
                <Volume2 size={16} strokeWidth={2.2} />
              ) : (
                <VolumeX size={16} strokeWidth={2.2} />
              )}
            </button>
          )}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(30px, 3.4vw, 46px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.08,
            color: "#ffffff",
          }}
        >
          Dental Check-up Queue
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "14px",
            letterSpacing: "0.01em",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          Please wait for your queue number to be called.
        </p>

        {announcementError ? (
          <p
            role="status"
            style={{
              margin: "10px 0 0",
              maxWidth: "560px",
              fontSize: "13px",
              lineHeight: 1.45,
              color: "#fca5a5",
            }}
          >
            {announcementError}
          </p>
        ) : !speechSupported ? (
          <p
            role="status"
            style={{
              margin: "10px 0 0",
              fontSize: "13px",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Voice announcements are unavailable in this browser.
          </p>
        ) : null}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "clamp(28px, 2.8vw, 40px)",
            fontWeight: 800,
            letterSpacing: "0.01em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {formatTime(now)}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "13px",
            letterSpacing: "0.02em",
            color: "rgba(255,255,255,0.58)",
          }}
        >
          {formatDate(now)}
        </div>
      </div>
    </div>
  );
}

function PanelPair({ current, next }) {
  return (
    <div
      className="gqm-fade-up"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}
    >
      <QueueCard
        label={current?.status === 'called' ? 'Called — please report to staff' : 'Now Serving'}
        entry={current}
        emptyText="No patient being served"
        primary
      />
      <QueueCard label="Next Serving" entry={next} emptyText="No one in line" />
    </div>
  );
}

function QueueCard({ label, entry, emptyText, primary }) {
  return (
    <div
      style={{
        background: primary ? ORANGE : "rgba(255,255,255,0.06)",
        border: primary
          ? "1px solid rgba(255,255,255,0.22)"
          : "1px solid rgba(255,255,255,0.12)",
        borderRadius: "20px",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: "240px",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: primary ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: primary ? "#ffffff" : "rgba(255,255,255,0.35)",
            display: "inline-block",
          }}
        />
        {label}
      </span>

      {entry ? (
        <>
          <span
            style={{
              fontSize: "clamp(58px, 6.6vw, 108px)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              color: "#ffffff",
            }}
          >
            {entry.queue_number}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              marginTop: "auto",
              fontSize: "11px",
              fontWeight: 700,
              padding: "5px 13px",
              borderRadius: "999px",
              background: primary
                ? "rgba(255,255,255,0.24)"
                : entry.type === "priority"
                  ? "rgba(249,115,22,0.18)"
                  : "rgba(255,255,255,0.1)",
              border: primary
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(255,255,255,0.12)",
              color: primary
                ? "#ffffff"
                : entry.type === "priority"
                  ? "#fdba74"
                  : "rgba(255,255,255,0.72)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {entry.type === "priority" ? "Priority" : "Regular"}
          </span>
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "clamp(17px, 1.9vw, 24px)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: primary
              ? "rgba(255,255,255,0.88)"
              : "rgba(255,255,255,0.42)",
            textAlign: "center",
          }}
        >
          {emptyText}
        </div>
      )}
    </div>
  );
}

function UpcomingList({ upcoming, remaining }) {
  return (
    <div
      className="gqm-fade-up"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "18px",
        padding: "20px 26px",
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          gap: "12px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
              display: "inline-block",
            }}
          />
          Upcoming
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {upcoming.length === 0
            ? "Queue is empty"
            : `${upcoming.length} waiting${
                remaining > 0 ? ` (+${remaining} more)` : ""
              }`}
        </span>
      </div>

      {upcoming.length === 0 ? (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "15px",
            letterSpacing: "0.01em",
          }}
        >
          No patients waiting.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {upcoming.map((q) => (
            <div
              key={q.id}
              className="gqm-upcoming-row"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 2px",
                gap: "12px",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "96px",
                  padding: "7px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                  color: "#ffffff",
                }}
              >
                {q.queue_number}
              </span>

              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  padding: "4px 11px",
                  borderRadius: "999px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background:
                    q.type === "priority"
                      ? "rgba(249,115,22,0.18)"
                      : "rgba(255,255,255,0.08)",
                  border:
                    q.type === "priority"
                      ? "1px solid rgba(249,115,22,0.32)"
                      : "1px solid rgba(255,255,255,0.1)",
                  color:
                    q.type === "priority"
                      ? "#fdba74"
                      : "rgba(255,255,255,0.62)",
                }}
              >
                {q.type === "priority" ? "Priority" : "Regular"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
