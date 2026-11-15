import { useEffect, useState } from "react";
import { ChevronDown, Info, ListOrdered } from "lucide-react";

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
      className="group min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 hover:bg-slate-50 group-open:rounded-b-none group-open:border-b group-open:border-slate-100 sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-900">
            <ListOrdered size={20} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold text-blue-950">
            Current dental queue line
          </h2>
        </div>
        <ChevronDown
          size={18}
          className="shrink-0 text-slate-600 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-4 p-4 sm:p-5">
        {error ? (
          <p
            role="alert"
            className="my-3 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700"
          >
            {error}
          </p>
        ) : !loaded ? (
          <p role="status" className="py-4 text-sm text-slate-700">
            Loading queue line…
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid min-w-0 content-start gap-2 rounded-2xl bg-orange-500 px-3 py-4 text-white shadow-md sm:py-5">
                <span className="text-sm font-bold tracking-wide uppercase">
                  {queueStatus.current_status === "called"
                    ? "Now calling"
                    : "Now serving"}
                </span>
                <strong className="queue-display-number text-4xl leading-tight font-extrabold wrap-anywhere tabular-nums sm:text-5xl lg:text-6xl">
                  {queueStatus.now_serving || "—"}
                </strong>
              </div>
              <div className="grid min-w-0 content-start gap-2 rounded-2xl bg-[#2d3a8c] px-3 py-4 text-white shadow-md sm:py-5">
                <span className="text-sm font-bold tracking-wide uppercase">
                  Next in queue
                </span>
                <strong className="queue-display-number text-4xl leading-tight font-extrabold wrap-anywhere tabular-nums sm:text-5xl lg:text-6xl">
                  {queueStatus.next_queuing || "—"}
                </strong>
              </div>
            </div>
            {queueStatus.line?.length ? (
              <ol className="space-y-2" aria-label="Current queue line">
                {queueStatus.line.map((ticket, index) => {
                  const mine =
                    hasActiveQueue &&
                    ticket.queue_number === queue?.queue_number;
                  return (
                    <li
                      key={ticket.queue_number}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-sm ${mine ? "border-blue-200 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-800"}`}
                      aria-current={mine ? "true" : undefined}
                    >
                      <span className="flex min-w-0 flex-wrap items-center gap-2 wrap-anywhere">
                        <small className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                          {index + 1}
                        </small>
                        <strong className="font-semibold tabular-nums">
                          {ticket.queue_number}
                        </strong>
                        {mine && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-900">
                            Your ticket
                          </span>
                        )}
                      </span>
                      <span
                        className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 data-[status=called]:bg-emerald-100 data-[status=called]:text-emerald-900 data-[status=serving]:bg-emerald-100 data-[status=serving]:text-emerald-900"
                        data-status={ticket.status}
                      >
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
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm leading-6 text-slate-600">
                No active tickets in the queue.
              </p>
            )}
          </>
        )}
      </div>
    </details>
  );
}
