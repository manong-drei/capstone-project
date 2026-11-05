import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function PatientQueueLine({
  queueStatus = {},
  queue,
  hasActiveQueue,
  error,
  loaded,
  expanded = false,
}) {
  const [open, setOpen] = useState(
    () => expanded || window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const resize = (event) => setOpen(expanded || event.matches);
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, [expanded]);

  return (
    <details
      className="group min-w-0 rounded-2xl border border-slate-200 bg-white shadow-xs"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 rounded-t-2xl px-5 py-4 group-open:border-b group-open:border-slate-100 [&::-webkit-details-marker]:hidden">
        <h2 className="text-md font-semibold text-blue-950">
          Current dental queue line
        </h2>
        <ChevronDown
          size={18}
          className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="p-5 pt-3">
        {error ? (
          <p
            role="alert"
            className="my-3 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700"
          >
            {error}
          </p>
        ) : !loaded ? (
          <p role="status" className="py-4 text-sm text-slate-500">
            Loading queue line…
          </p>
        ) : (
          <>
            <div className="my-4 grid grid-cols-2 gap-3">
              <div className="grid min-w-0 gap-1 rounded-xl bg-orange-50 p-3 text-orange-800">
                <span className="text-xs">
                  {queueStatus.current_status === "called"
                    ? "Now calling"
                    : "Now serving"}
                </span>
                <strong className="text-xl font-bold wrap-anywhere tabular-nums">
                  {queueStatus.now_serving || "—"}
                </strong>
              </div>
              <div className="grid min-w-0 gap-1 rounded-xl bg-orange-50 p-3 text-orange-800">
                <span className="text-xs">Next in queue</span>
                <strong className="text-xl font-bold wrap-anywhere tabular-nums">
                  {queueStatus.next_queuing || "—"}
                </strong>
              </div>
            </div>
            {queueStatus.line?.length ? (
              <ol className="space-y-1" aria-label="Current queue line">
                {queueStatus.line.map((ticket, index) => {
                  const mine =
                    hasActiveQueue &&
                    ticket.queue_number === queue?.queue_number;
                  return (
                    <li
                      key={ticket.queue_number}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-3 text-xs ${mine ? "bg-blue-50 text-blue-800" : "border-b border-slate-100 text-slate-700"}`}
                      aria-current={mine ? "true" : undefined}
                    >
                      <span className="flex min-w-0 flex-wrap items-center gap-2 wrap-anywhere">
                        <small className="text-xs text-slate-400">
                          {index + 1}.
                        </small>
                        <strong className="font-semibold tabular-nums">
                          {ticket.queue_number}
                        </strong>
                        {mine && <span>Your ticket</span>}
                      </span>
                      <span className="text-slate-500">
                        {ticket.status === "called"
                          ? "Now calling"
                          : ticket.status === "serving"
                            ? "Now serving"
                            : "Waiting"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-xs leading-5 text-slate-500">
                No active tickets in the queue.
              </p>
            )}
            <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
              Priority patients may be called first. Follow the displayed order
              rather than comparing ticket numbers.
            </p>
          </>
        )}
      </div>
    </details>
  );
}
