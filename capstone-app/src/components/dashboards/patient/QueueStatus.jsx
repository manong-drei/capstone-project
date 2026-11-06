import { Ticket } from "lucide-react";
import { formatPatientDate, getQueueDisplayName, getServiceLabels, getTicketNotice } from "@/utils/queueDisplay";

const statuses = { waiting: "Waiting", called: "It's your turn!", serving: "Receiving care", missed: "Missed call", no_show: "No-show", done: "Completed", cancelled: "Cancelled" };

export default function QueueStatus({ queue, onCancel }) {
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
  return (
    <article className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white text-center shadow-sm" aria-label="My queue ticket">
      <header className="flex flex-col items-center gap-2 border-b border-slate-200 px-4 py-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-blue-950"><Ticket size={20} aria-hidden="true" />My Queue</h2>
        <span data-status={queue.status} className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-900 data-[status=missed]:bg-red-100 data-[status=missed]:text-red-900 data-[status=no_show]:bg-red-100 data-[status=no_show]:text-red-900 data-[status=called]:bg-emerald-100 data-[status=called]:text-emerald-900 data-[status=serving]:bg-emerald-100 data-[status=serving]:text-emerald-900">{status}</span>
      </header>
      <div className="space-y-5 p-4 sm:p-6">
        <div className={`flex flex-col items-center gap-2 rounded-2xl border p-4 ${priority ? "border-orange-200 bg-orange-50 text-orange-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
          <p className="text-sm font-semibold sm:text-base">Your Queue Number</p>
          <strong className="max-w-full text-4xl leading-tight font-extrabold tracking-tight wrap-anywhere tabular-nums sm:text-6xl">{queue.queue_number}</strong>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold tracking-wider ring-1 ring-current/15">{priority ? "PRIORITY" : "REGULAR"}</span>
        </div>
        <dl className="grid gap-4 text-base text-slate-900 min-[480px]:grid-cols-2 [&_dd]:font-semibold [&_dd]:wrap-anywhere [&_dt]:mb-1 [&_dt]:text-sm [&_dt]:font-medium [&_dt]:text-slate-600">
          {fields.map(([label, value]) => <div key={label} className="min-w-0 first:col-span-full">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>)}
          <div className="col-span-full min-w-0">
            <dt>Services queued</dt>
            <dd>{services.length ? (
              <ul className="flex flex-wrap justify-center gap-2">
                {services.map((service, i) => <li key={`${service}-${i}`} className="max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium">{service}</li>)}
              </ul>
            ) : "Not recorded"}</dd>
          </div>
        </dl>
        {notice && <p role="status" data-status={queue.status} className="border-t border-slate-200 pt-4 text-sm leading-6 text-slate-700 data-[status=missed]:text-red-800 data-[status=no_show]:text-red-800 data-[status=called]:font-semibold data-[status=called]:text-emerald-800">{notice}</p>}
      </div>
      {canCancel && (
        <footer className="flex justify-center rounded-b-3xl border-t border-slate-200 bg-slate-50 px-4 py-4">
          <button type="button" className="min-h-11 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-50" onClick={onCancel}>Cancel Queue</button>
        </footer>
      )}
    </article>
  );
}
