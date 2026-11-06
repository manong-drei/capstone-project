import { useEffect, useRef, useState } from "react";
import { Ticket, X } from "lucide-react";
import { formatPatientDate, getQueueDisplayName, getServiceLabels, getTicketNotice } from "@/utils/queueDisplay";

const statuses = { waiting: "Waiting", called: "It's your turn!", serving: "Receiving care", missed: "Missed call", no_show: "No-show", done: "Completed", cancelled: "Cancelled" };

export default function QueueStatus({ queue, onCancel }) {
  const [open, setOpen] = useState(null);
  const focusTarget = useRef(null);
  useEffect(() => {
    if (open !== null) focusTarget.current?.focus({ preventScroll: true });
  }, [open]);

  if (!queue) return null;
  const patientName = getQueueDisplayName(queue);
  const services = getServiceLabels(queue.services);
  const status = statuses[queue.status] || queue.status || "Unknown";
  const priority = queue.type === "priority";
  const issuedDate = formatPatientDate(queue.created_at);
  const issuedTime = issuedDate === "—" ? "—" : `${new Date(queue.created_at).toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  })} PHT`;
  const notice = getTicketNotice(queue);
  const canCancel = onCancel && ["waiting", "missed"].includes(queue.status);
  const fields = [["Patient name", patientName], ["Date issued", issuedDate], ["Time issued", issuedTime]];
  if (open === false) {
    return (
      <div className="fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 sm:right-6 sm:bottom-6">
        <button ref={focusTarget} type="button" onClick={() => setOpen(true)} className="flex min-h-12 items-center gap-2 rounded-full bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg hover:bg-blue-800">
          <Ticket size={18} aria-hidden="true" />
          <span className="text-left">
            My ticket · {queue.queue_number}
            <span className="block text-xs text-blue-100">{status}</span>
          </span>
        </button>
        <p role="status" className="sr-only">{notice}</p>
      </div>
    );
  }

  return (
    <section aria-label="My Queue" className="pointer-events-none fixed inset-0 z-[60] grid overflow-y-auto p-1.5 [place-items:safe_center] sm:p-4 [@media(min-height:720px)]:p-3">
      <article className="pointer-events-auto w-full min-w-0 max-w-xl rounded-3xl border border-slate-200 bg-white text-center shadow-xl [@media(min-height:720px)]:max-w-sm" aria-label="My queue ticket">
        <header className="relative flex min-h-12 flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-slate-200 px-12 py-2 [@media(min-height:720px)]:flex-col [@media(min-height:720px)]:gap-2 [@media(min-height:720px)]:py-3">
          <h2 className="flex items-center gap-2 text-xl font-bold text-blue-950"><Ticket size={20} aria-hidden="true" />My Queue</h2>
          <button ref={focusTarget} type="button" aria-label="Close ticket" onClick={() => setOpen(false)} className="absolute top-0.5 right-0.5 grid size-11 place-items-center rounded-full text-slate-700 hover:bg-slate-100">
            <X size={20} aria-hidden="true" />
          </button>
          <span data-status={queue.status} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900 data-[status=missed]:bg-red-100 data-[status=missed]:text-red-900 data-[status=no_show]:bg-red-100 data-[status=no_show]:text-red-900 data-[status=called]:bg-emerald-100 data-[status=called]:text-emerald-900 data-[status=serving]:bg-emerald-100 data-[status=serving]:text-emerald-900 [@media(min-height:720px)]:py-1.5 [@media(min-height:720px)]:text-sm">{status}</span>
        </header>
        <div className="grid gap-1.5 px-2 py-1.5 sm:px-3 [@media(min-height:720px)]:gap-4 [@media(min-height:720px)]:p-4">
          <div className={`flex min-w-0 flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-xl border px-1.5 py-1 [@media(min-height:720px)]:flex-col [@media(min-height:720px)]:gap-2 [@media(min-height:720px)]:rounded-2xl [@media(min-height:720px)]:p-4 ${priority ? "border-orange-200 bg-orange-50 text-orange-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
            <p className="text-xs font-semibold sm:text-sm [@media(min-height:720px)]:text-sm">Your Queue Number</p>
            <strong className="max-w-full text-2xl leading-tight font-extrabold tracking-tight wrap-anywhere tabular-nums sm:text-3xl [@media(min-height:720px)]:text-4xl">{queue.queue_number}</strong>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tracking-wide ring-1 ring-current/15 [@media(min-height:720px)]:px-3 [@media(min-height:720px)]:py-1">{priority ? "PRIORITY" : "REGULAR"}</span>
          </div>
          <dl className="grid min-w-0 grid-cols-2 gap-x-2 gap-y-1 text-sm leading-tight text-slate-900 min-[480px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] [@media(min-height:720px)]:grid-cols-2 [@media(min-height:720px)]:gap-3 [@media(min-height:720px)]:text-base [@media(min-height:720px)]:leading-snug [&_dd]:font-semibold [&_dd]:wrap-anywhere [&_dt]:text-xs [&_dt]:font-medium [&_dt]:text-slate-600 [@media(min-height:720px)]:[&_dt]:mb-1 [@media(min-height:720px)]:[&_dt]:text-sm">
            {fields.map(([label, value]) => <div key={label} className="min-w-0 first:col-span-full">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>)}
            <div className="col-span-full min-w-0 min-[480px]:col-span-1 [@media(min-height:720px)]:col-span-full">
              <dt>Services queued</dt>
              <dd>{services.join(" · ") || "Not recorded"}</dd>
            </div>
          </dl>
        </div>
        {(notice || canCancel) && (
          <footer className="flex flex-col items-center justify-center gap-1.5 rounded-b-3xl border-t border-slate-200 bg-slate-50 px-2 py-1.5 min-[480px]:flex-row sm:px-3 [@media(min-height:720px)]:flex-col [@media(min-height:720px)]:gap-3 [@media(min-height:720px)]:p-4">
            {notice && <p role="status" data-status={queue.status} className="min-w-0 text-sm leading-tight wrap-anywhere text-slate-700 data-[status=missed]:text-red-800 data-[status=no_show]:text-red-800 data-[status=called]:font-semibold data-[status=called]:text-emerald-800 [@media(min-height:720px)]:leading-6">{notice}</p>}
            {canCancel && <button type="button" className="min-h-11 shrink-0 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-50" onClick={onCancel}>Cancel Queue</button>}
          </footer>
        )}
      </article>
    </section>
  );
}
