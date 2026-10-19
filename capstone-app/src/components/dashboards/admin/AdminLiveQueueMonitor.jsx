import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Inbox,
  Loader2,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import QueueReasonModal from "@/components/common/QueueReasonModal";
import StatusBadge from "@/components/common/StatusBadge";
import { QUEUE_STATUS } from "@/constants/queue";
import { CANCELLATION_REASONS } from "@/constants/queueReasons";
import { getAllQueues, updateQueueStatus } from "@/services/queueService";
import { formatQueueTime, getQueueDisplayName } from "@/utils/queueDisplay";

const SERVICE_CATEGORY = "dental";
const POLL_INTERVAL_MS = 15_000;
const ACTIVE_STATUSES = [
  QUEUE_STATUS.WAITING,
  QUEUE_STATUS.CALLED,
  QUEUE_STATUS.SERVING,
  QUEUE_STATUS.MISSED,
];
const SERVING_STATUSES = [QUEUE_STATUS.CALLED, QUEUE_STATUS.SERVING];

function LiveIndicator({ error, connecting }) {
  const label = error ? "Update needed" : connecting ? "Connecting" : "Live";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${error ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${error ? "bg-amber-500" : "bg-emerald-500"}`}
      />
      {label}
    </span>
  );
}

function QueueSummary({ queues }) {
  const serving = queues.find((queue) =>
    SERVING_STATUSES.includes(queue.status),
  );
  // Keep the server's projected waiting order, including priority and confirmed returns.
  const waiting = queues.filter(
    (queue) => queue.status === QUEUE_STATUS.WAITING,
  );
  const next = waiting[0];

  return (
    <section
      aria-label="Dental live queue"
      className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Stethoscope className="h-4 w-4 text-blue-700" aria-hidden="true" />
          Dental
        </h4>
        <span className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
          {waiting.length} waiting
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0 border-r border-slate-200 pr-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
            Now serving
          </p>
          <p className="mt-1 break-words text-2xl font-bold tracking-tight text-blue-900 sm:text-3xl">
            {serving?.queue_number ?? "—"}
          </p>
          <p className="mt-1 break-words text-xs text-slate-600">
            {serving ? getQueueDisplayName(serving) : "No patient being served"}
          </p>
          {serving && (
            <div className="mt-2">
              <StatusBadge status={serving.status} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Up next <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </p>
          <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            {next?.queue_number ?? "—"}
          </p>
          <p className="mt-1 break-words text-xs text-slate-600">
            {next ? getQueueDisplayName(next) : "No patients waiting"}
          </p>
        </div>
      </div>
    </section>
  );
}

function TicketRow({ queue, cancelDisabled, onCancel }) {
  const isPriority = queue.type === "priority";

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 py-4 transition hover:bg-slate-50/70 sm:px-5 md:grid-cols-[6rem_minmax(0,1fr)_9rem_4rem] md:gap-4">
      <p className="break-words text-sm font-bold text-blue-900">
        {queue.queue_number ?? "—"}
      </p>
      <div className="col-start-1 row-start-2 min-w-0 md:col-auto md:row-auto">
        <p className="break-words text-sm font-medium text-slate-800">
          {getQueueDisplayName(queue)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span>{queue.is_walk_in ? "Walk-in" : "Appointment"}</span>
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${isPriority ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}
          >
            {isPriority ? "Priority" : "Regular"}
          </span>
        </div>
        {queue.status_reason && (
          <p className="mt-1.5 break-words text-xs text-slate-500">
            Reason: {queue.status_reason}
          </p>
        )}
      </div>
      <div className="col-start-2 row-start-1 flex flex-col items-end gap-2 md:col-auto md:row-auto md:items-start">
        <StatusBadge status={queue.status} />
        {queue.status === QUEUE_STATUS.MISSED && (
          <p className="max-w-36 text-right text-[11px] text-amber-800 md:text-left">
            Return before {formatQueueTime(queue.grace_expires_at)}
          </p>
        )}
      </div>
      <div className="col-start-2 row-start-2 text-right md:col-auto md:row-auto">
        {ACTIVE_STATUSES.includes(queue.status) && (
          <button
            type="button"
            disabled={cancelDisabled}
            aria-label={`Cancel ticket ${queue.queue_number}`}
            onClick={() => onCancel(queue.id)}
            className="min-h-8 rounded-lg px-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </li>
  );
}

export default function AdminLiveQueueMonitor() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState(null);
  const [reasonRequest, setReasonRequest] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadQueues = useCallback(async (signal) => {
    setLoading(true);
    try {
      const data = await getAllQueues(undefined, { signal });
      if (signal?.aborted) return;
      const list = Array.isArray(data) ? data : [];
      // The API may still return legacy non-dental tickets; only dental is in scope.
      setQueues(list.filter((queue) => queue.category === SERVICE_CATEGORY));
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      if (!signal?.aborted) setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadQueues(controller.signal);
    const interval = setInterval(
      () => loadQueues(controller.signal),
      POLL_INTERVAL_MS,
    );
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadQueues]);

  const requestCancel = useCallback((id) => {
    setReasonRequest({
      id,
      title: "Reason for cancellation",
      reasons: CANCELLATION_REASONS,
    });
  }, []);

  const cancelTicket = async (reason) => {
    setCancelling(true);
    try {
      await updateQueueStatus(reasonRequest.id, QUEUE_STATUS.CANCELLED, reason);
      await loadQueues();
    } catch (err) {
      setError(err.message || "Could not cancel this ticket.");
    } finally {
      setCancelling(false);
    }
  };

  const initialLoading = loading && !updatedAt;

  return (
    <section
      aria-labelledby="live-queue-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <QueueReasonModal
        request={reasonRequest}
        onClose={() => setReasonRequest(null)}
        onSubmit={cancelTicket}
      />

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id="live-queue-heading"
                className="text-base font-bold text-slate-900"
              >
                Live queue monitor
              </h3>
              <LiveIndicator error={error} connecting={initialLoading} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Today's patient flow · Refreshes every 15 seconds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-[11px] text-slate-500">
              Updated {formatQueueTime(updatedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={() => loadQueues()}
            disabled={loading || cancelling}
            aria-label="Refresh live queue"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:mx-5"
        >
          {error} {updatedAt && "Showing the last successful update."}
        </p>
      )}

      {initialLoading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{" "}
          Loading live queue…
        </div>
      ) : (
        updatedAt && (
          <>
            <div className="p-4 sm:p-5">
              <QueueSummary queues={queues} />
            </div>

            <div className="flex items-center justify-between gap-3 border-y border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
              <h4 className="text-sm font-semibold text-slate-800">
                Today's tickets{" "}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  ({queues.length})
                </span>
              </h4>
            </div>

            {!queues.length ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Inbox className="h-7 w-7 text-slate-300" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-600">
                  No dental tickets today
                </p>
                <p className="text-xs text-slate-500">
                  New registrations will appear here automatically.
                </p>
              </div>
            ) : (
              <div
                role="region"
                aria-label="Today's queue tickets"
                tabIndex={0}
                className="max-h-[440px] overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
              >
                <div
                  aria-hidden="true"
                  className="sticky top-0 z-10 hidden grid-cols-[6rem_minmax(0,1fr)_9rem_4rem] gap-4 border-b border-slate-100 bg-white px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:grid"
                >
                  <span>Ticket</span>
                  <span>Patient</span>
                  <span>Status</span>
                  <span className="text-right">Action</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {queues.map((queue) => (
                    <TicketRow
                      key={queue.id}
                      queue={queue}
                      cancelDisabled={cancelling}
                      onCancel={requestCancel}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
