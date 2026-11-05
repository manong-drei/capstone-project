import { useState } from "react";
import { Download, Ticket } from "lucide-react";
import { formatPatientDate, getQueueDisplayName, getServiceLabels, getTicketNotice } from "@/utils/queueDisplay";
import createQueueTicketImage from "./queueTicketImage";

const statuses = { waiting: "Waiting", called: "It's your turn!", serving: "Receiving care", missed: "Missed call", no_show: "No-show", done: "Completed", cancelled: "Cancelled" };

export default function QueueStatus({ queue, onCancel, onViewQueue, lastUpdated, updatesUnavailable = false }) {
  const [downloadError, setDownloadError] = useState("");

  if (!queue) return null;
  const patientName = getQueueDisplayName(queue);
  const services = getServiceLabels(queue.services);
  const serviceList = services.join(", ") || "Not recorded";
  const status = statuses[queue.status] || queue.status || "Unknown";
  const priority = queue.type === "priority";
  const issuedDate = formatPatientDate(queue.created_at);
  const issuedTime = issuedDate === "—" ? "—" : `${new Date(queue.created_at).toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  })} PHT`;
  const notice = getTicketNotice(queue);
  const fields = [["Patient name", patientName], ["Date issued", issuedDate], ["Time issued", issuedTime], ["Services queued", serviceList]];
  const downloadTicket = () => {
    const link = document.createElement('a');
    setDownloadError('');
    try {
      link.href = createQueueTicketImage({
        number: queue.queue_number,
        type: priority ? 'Priority' : 'Regular',
        status,
        details: [
          ['Patient name', patientName],
          ['Services queued', serviceList],
          ['Issued', issuedDate === "—" ? issuedDate : issuedDate + " · " + issuedTime],
        ],
        notice,
      });
      link.download = 'queue-ticket-' + queue.queue_number + '.png';
      document.body.appendChild(link);
      link.click();
    } catch {
      setDownloadError('Could not download your ticket. Please try again.');
    } finally {
      link.remove();
    }
  };
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm" aria-label="My queue ticket">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-950"><Ticket size={18} aria-hidden="true" />My Queue</h2>
        <span data-status={queue.status} className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-800 data-[status=missed]:bg-red-50 data-[status=missed]:text-red-700 data-[status=no_show]:bg-red-50 data-[status=no_show]:text-red-700 data-[status=called]:bg-emerald-50 data-[status=called]:text-emerald-700 data-[status=serving]:bg-emerald-50 data-[status=serving]:text-emerald-700">{status}</span>
      </header>
      <div className="p-5 sm:p-6">
        <div className={`mb-6 rounded-2xl border p-5 sm:p-6 ${priority ? "border-orange-200/70 bg-orange-50 text-orange-700" : "border-blue-200/70 bg-blue-50 text-blue-700"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium">Your Queue Number</p>
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold tracking-widest ring-1 ring-current/10">{priority ? "PRIORITY" : "REGULAR"}</span>
          </div>
          <strong className="mt-4 block text-5xl leading-none font-black tracking-tight wrap-anywhere tabular-nums sm:text-6xl">{queue.queue_number}</strong>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          {fields.map(([label, value], index) => <div key={label} className={index === 0 || index === 3 ? "col-span-full" : ""}>
            <dt className="mb-1 text-xs text-slate-500">{label}</dt>
            <dd className={`font-medium wrap-anywhere ${index === 0 ? "text-base font-semibold text-blue-950" : "text-sm text-slate-700"}`}>{index === 3 && services.length ? <ul className="flex flex-wrap gap-2">{services.map((service, i) => <li key={`${service}-${i}`} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-normal">{service}</li>)}</ul> : value}</dd>
          </div>)}
        </dl>
        {notice && <p role="status" data-status={queue.status} className="mt-6 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-600 data-[status=missed]:text-red-700 data-[status=no_show]:text-red-700 data-[status=called]:font-medium data-[status=called]:text-emerald-700">{notice}</p>}
      </div>
      <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 [&>button]:grow sm:[&>button]:grow-0">
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50" onClick={downloadTicket} disabled={updatesUnavailable || !lastUpdated}><Download size={16} aria-hidden="true" />Download Ticket</button>
        {onViewQueue && <button type="button" className="min-h-11 rounded-lg px-2 text-xs font-medium text-blue-800 hover:bg-blue-50" onClick={onViewQueue}>View queue line</button>}
        {["waiting", "missed"].includes(queue.status) && onCancel && <button type="button" className="min-h-11 rounded-lg px-2 text-xs font-medium text-red-700 hover:bg-red-50" onClick={onCancel}>Cancel Queue</button>}
        {downloadError && <p role="alert" className="basis-full text-xs text-red-700">{downloadError}</p>}
      </footer>
    </article>
  );
}
