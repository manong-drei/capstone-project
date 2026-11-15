import { formatQueueDeadline, getQueueDisplayName } from "@/utils/queueDisplay";

export default function HeldTickets({ tickets, now, loading, onAction }) {
  const held = tickets.filter(ticket => new Date(ticket.held_expires_at).getTime() > now);
  if (!held.length) return null;

  return <section aria-labelledby="held-tickets-title" className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
    <div className="border-b border-amber-100 bg-amber-50 px-5 py-4">
      <h3 id="held-tickets-title" className="text-sm font-semibold text-amber-900">Held tickets · {held.length}</h3>
      <p className="mt-1 text-xs text-amber-900">Confirm physical presence to insert the ticket ahead of ordinary waiting patients.</p>
    </div>
    <ul className="divide-y divide-slate-100">{held.map(ticket => <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-bold text-blue-900">{ticket.queue_number} · {getQueueDisplayName(ticket)}</p>
        <p className="mt-1 text-xs text-slate-600">{ticket.status_reason}</p>
        <p className="mt-1 text-xs text-amber-900">Expires <time dateTime={ticket.held_expires_at}>{formatQueueDeadline(ticket.held_expires_at)}</time></p>
      </div>
      <button type="button" disabled={loading} onClick={() => onAction(ticket.id, "reactivate")}
        className="min-h-11 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
        Patient Present<span className="sr-only"> {ticket.queue_number}</span>
      </button>
    </li>)}</ul>
  </section>;
}
