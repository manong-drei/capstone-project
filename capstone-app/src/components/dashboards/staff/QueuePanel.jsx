import { ArrowRight, Clock3, ListOrdered, LoaderCircle, Megaphone, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getQueueDisplayName } from "@/utils/queueDisplay";

export default function QueuePanel({ currentServing, nextQueue, onCallNext, onCancelQueue, loading }) {
  return (
    <section id="dental-queue" aria-labelledby="dental-queue-title" className="scroll-mt-24 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h3 id="dental-queue-title" className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ListOrdered size={18} className="text-blue-700" aria-hidden="true" />Dental queue</h3>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{nextQueue.length} waiting</span>
        </div>
        <div className="m-5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-center text-white">
          <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-100"><Megaphone size={16} aria-hidden="true" />{currentServing?.status === 'called' ? 'Called' : 'Now serving'}</p>
          <p className="my-3 break-words text-5xl font-bold tracking-tight">{currentServing?.queue_number || "—"}</p>
          {currentServing ? <>
            <p className="text-sm font-medium">{currentServing.patient_id ? <Link to={`/staff/patients/${currentServing.patient_id}`} className="underline decoration-white/40 underline-offset-4 hover:decoration-white">{getQueueDisplayName(currentServing)}</Link> : getQueueDisplayName(currentServing)}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{currentServing.type === "priority" && <ShieldCheck size={13} aria-hidden="true" />}{currentServing.type === "priority" ? "Priority" : "Regular"}</span>
          </> : <p className="text-sm text-orange-100">{loading ? "Loading the dental queue…" : "No patient is currently being served."}</p>}
        </div>
        <div className="px-5 pb-5">
          <button type="button" onClick={onCallNext} disabled={loading || !nextQueue.length || !!currentServing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e4db7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
            {loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}{loading ? "Updating queue…" : "Call next patient"}
          </button>
          {currentServing && <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">{currentServing.status === 'called' ? 'Confirm the patient is here, or call again before skipping.' : 'Wait for the dentist to complete this visit before calling the next patient.'}</p>}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Clock3 size={18} className="text-blue-700" aria-hidden="true" /><h3 className="text-sm font-semibold text-slate-900">Up next</h3><span className="ml-auto text-xs text-slate-500">Serving order</span></div>
        {!nextQueue.length ? <div className="flex flex-col items-center gap-2 px-5 py-8 text-sm text-slate-500"><Users size={28} className="text-slate-300" aria-hidden="true" />{loading ? "Loading patients…" : "No patients waiting"}</div> :
          <ol className="divide-y divide-slate-100">{nextQueue.slice(0, 5).map((queue, index) => (
            <li key={queue.id} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${index === 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#1a3a8f]">{queue.queue_number}</p>{queue.patient_id ? <Link to={`/staff/patients/${queue.patient_id}`} className="block truncate text-xs text-slate-600 underline-offset-2 hover:text-blue-700 hover:underline">{getQueueDisplayName(queue)}</Link> : <p className="truncate text-xs text-slate-600">{getQueueDisplayName(queue)}</p>}<p className="mt-1 text-[10px] text-slate-400">{queue.is_walk_in ? "Walk-in" : "Registered patient"}</p></div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${queue.type === "priority" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{queue.type === "priority" ? "Priority" : "Regular"}</span>
              <button type="button" onClick={() => onCancelQueue(queue.id)} disabled={loading} aria-label={`Cancel queue ${queue.queue_number}`} className="rounded-lg px-2 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50">Cancel</button>
            </li>
          ))}</ol>}
        {nextQueue.length > 5 && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{nextQueue.length - 5} more patients waiting</p>}
      </div>
    </section>
  );
}
