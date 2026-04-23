/**
 * GeneralQueueMonitor.jsx — Waiting-area TV/monitor display for the
 * General Consultation queue. Meant to be opened in kiosk/full-screen mode.
 *
 * Layout: left 70% queue info, right 30% placeholder image.
 * Polls /queue?category=general every 10 seconds (matches backend ordering:
 * priority first, then arrival).
 */

import { useEffect, useState } from "react";
import { getAllQueues } from "../services/queueService";
import { getQueueDisplayName } from "../utils/queueDisplay";

const NAVY = "#1e2d6b";
const INDIGO = "#2d3a8c";
const ORANGE = "#f97316";

const POLL_INTERVAL_MS = 10_000;
const UPCOMING_LIMIT = 10;

const STYLES = `
  @keyframes gqm-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.4; transform: scale(1.6); }
  }
  .gqm-pulse { animation: gqm-pulse 1.8s ease-in-out infinite; }
  .gqm-upcoming-row + .gqm-upcoming-row { border-top: 1px solid rgba(255,255,255,0.08); }
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

  useEffect(() => {
    let cancelled = false;

    const fetchQueue = async () => {
      try {
        const data = await getAllQueues("general");
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.data ?? [];
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
    queues.find((q) => q.status === "serving") ?? null;
  const waitingList = queues.filter((q) => q.status === "waiting");
  const nextServing = waitingList[0] ?? null;
  const upcoming = waitingList.slice(1, 1 + UPCOMING_LIMIT);
  const remaining = Math.max(
    waitingList.length - 1 - upcoming.length,
    0,
  );

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
            "'Segoe UI', system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Left column — queue info (70%) */}
        <div
          style={{
            flex: "0 0 70%",
            padding: "36px 44px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            background: `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 100%)`,
          }}
        >
          <Header now={now} />

          <PanelPair
            current={currentServing}
            next={nextServing}
          />

          <UpcomingList upcoming={upcoming} remaining={remaining} />
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(15,26,74,0.1) 0%, rgba(15,26,74,0.45) 100%)",
            }}
          />
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Header({ now }) {
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
            marginBottom: "6px",
          }}
        >
          <span
            className="gqm-pulse"
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
              boxShadow: "0 0 0 3px rgba(34,197,94,0.25)",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Live
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 3.2vw, 42px)",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          General Consultation Queue
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "14px",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Please wait for your queue number to be called.
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "clamp(26px, 2.6vw, 36px)",
            fontWeight: 800,
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {formatTime(now)}
        </div>
        <div
          style={{
            marginTop: "6px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.65)",
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
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}
    >
      <QueueCard
        label="Now Serving"
        entry={current}
        emptyText="No patient being served"
        primary
      />
      <QueueCard
        label="Next Serving"
        entry={next}
        emptyText="No one in line"
      />
    </div>
  );
}

function QueueCard({ label, entry, emptyText, primary }) {
  const background = primary ? ORANGE : "rgba(255,255,255,0.08)";
  const border = primary
    ? "none"
    : "1.5px solid rgba(255,255,255,0.14)";
  const boxShadow = primary
    ? "0 12px 40px rgba(249,115,22,0.35)"
    : "none";

  return (
    <div
      style={{
        background,
        border,
        borderRadius: "20px",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: "230px",
        boxShadow,
      }}
    >
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: primary
            ? "rgba(255,255,255,0.85)"
            : "rgba(255,255,255,0.55)",
        }}
      >
        {label}
      </span>

      {entry ? (
        <>
          <span
            style={{
              fontSize: "clamp(60px, 7vw, 112px)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
              color: "#ffffff",
            }}
          >
            {entry.queue_number}
          </span>
          <span
            style={{
              fontSize: "clamp(18px, 1.8vw, 24px)",
              fontWeight: 600,
              color: "#ffffff",
              marginTop: "2px",
            }}
          >
            {getQueueDisplayName(entry)}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              marginTop: "4px",
              fontSize: "12px",
              fontWeight: 700,
              padding: "3px 12px",
              borderRadius: "999px",
              background: primary
                ? "rgba(255,255,255,0.22)"
                : entry.type === "priority"
                ? "rgba(249,115,22,0.22)"
                : "rgba(255,255,255,0.14)",
              color: primary
                ? "#ffffff"
                : entry.type === "priority"
                ? "#fdba74"
                : "rgba(255,255,255,0.75)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {entry.type === "priority" ? "Priority" : "General"}
          </span>
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "clamp(18px, 2vw, 26px)",
            fontWeight: 600,
            color: primary
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.5)",
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
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "18px",
        padding: "18px 24px",
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Upcoming
        </span>
        <span
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
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
            padding: "28px 0",
            textAlign: "center",
            color: "rgba(255,255,255,0.45)",
            fontSize: "15px",
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
                padding: "10px 2px",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    minWidth: "86px",
                    color: "#ffffff",
                  }}
                >
                  {q.queue_number}
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {getQueueDisplayName(q)}
                </span>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "999px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background:
                    q.type === "priority"
                      ? "rgba(249,115,22,0.22)"
                      : "rgba(255,255,255,0.1)",
                  color:
                    q.type === "priority"
                      ? "#fdba74"
                      : "rgba(255,255,255,0.7)",
                }}
              >
                {q.type === "priority" ? "Priority" : "General"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
