import { useEffect, useRef, useState } from 'react';
import { generatePath, useMatch, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import api from '@/services/api';

const date = value => new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium' });
const buttonClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50';
const statuses = { pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' };

function ReviewLeave({ id, onClose, onDecided }) {
  const dialogRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [note, setNote] = useState('');
  const [acknowledge, setAcknowledge] = useState(false);
  const [busy, setBusy] = useState(false);
  const reload = () => { setData(null); setError(''); setAcknowledge(false); setRefresh(value => value + 1); };

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; if (trigger?.isConnected) trigger.focus(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api.get(`/admin/doctor-leaves/${id}`, { signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setData(response); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [id, refresh]);

  const decide = async status => {
    setError(''); setBusy(true);
    try {
      await api.patch(`/admin/doctor-leaves/${id}`, { status, review_note: note.trim(), acknowledge_conflicts: acknowledge, impact_version: data.impacts.version });
      onDecided(status);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const affected = data && (data.impacts.appointments.length > 0 || data.impacts.queues.length > 0);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

  return <dialog ref={dialogRef} aria-labelledby="leave-review-heading" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-5 text-slate-800 shadow-xl backdrop:bg-slate-900/50 sm:p-6">
    <div className="mb-4 flex items-start justify-between gap-3"><h2 id="leave-review-heading" className="text-lg font-bold">Review leave request</h2><button type="button" autoFocus disabled={busy} onClick={onClose} className={buttonClass}>Close</button></div>
    {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><button type="button" disabled={busy} onClick={reload} className="mt-2 font-semibold underline">Refresh review</button></div>}
    {!data ? !error && <p role="status">Loading leave details…</p> : <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">Dr. {data.leave.doctor_name}</h3><p className="mt-1 text-sm">{date(data.leave.start_date)} – {date(data.leave.end_date)} · {statuses[data.leave.status]}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{data.leave.reason || 'No reason provided.'}</p></div>
      <section aria-labelledby="leave-impact-heading" className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 id="leave-impact-heading" className="font-semibold text-amber-900">Affected bookings and queue tickets</h3>
        <p className="mt-1 text-sm text-amber-900">{data.impacts.appointments.length} open appointment{data.impacts.appointments.length !== 1 && 's'} · {data.impacts.queues.length} active queue ticket{data.impacts.queues.length !== 1 && 's'}</p>
        <p className="mt-2 text-xs leading-relaxed text-amber-900">Approval blocks new registration. Existing bookings and tickets stay in place so staff can arrange rescheduling or follow-up.</p>
        {affected && <ul aria-label="Affected patients" className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs text-slate-700">
          {data.impacts.appointments.map(row => <li key={`appointment-${row.appointment_id}`} className="break-words">Appointment #{row.appointment_id} · {row.patient_name} · {date(row.appointment_date)} · {row.status}</li>)}
          {data.impacts.queues.map(row => <li key={`queue-${row.id}`} className="break-words">Ticket {row.queue_number} · {row.patient_name} · {row.status}</li>)}
        </ul>}
      </section>
      {data.leave.status === 'pending' && affected && <label className="flex items-start gap-2 text-sm leading-relaxed"><input type="checkbox" checked={acknowledge} disabled={busy} onChange={event => setAcknowledge(event.target.checked)} className="mt-1 shrink-0" /><span>I will arrange staff follow-up for the affected bookings and queue tickets.</span></label>}
      {['pending', 'approved'].includes(data.leave.status) && <label className="block text-sm font-medium">Review note (optional)<textarea rows={3} maxLength={500} disabled={busy} value={note} onChange={event => setNote(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:outline-blue-600" /></label>}
      {data.leave.review_note && <p className="whitespace-pre-wrap break-words text-sm"><strong>Previous admin note:</strong> {data.leave.review_note}</p>}
      <div className="flex flex-wrap gap-3">
        {data.leave.status === 'pending' && <><button type="button" disabled={busy || (affected && !acknowledge) || data.leave.end_date < today} onClick={() => decide('approved')} className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Approve leave</button><button type="button" disabled={busy} onClick={() => decide('rejected')} className={buttonClass}>Reject request</button></>}
        {data.leave.status === 'approved' && data.leave.end_date >= today && <button type="button" disabled={busy} onClick={() => decide('cancelled')} className={buttonClass}>Cancel approved leave</button>}
      </div>
      {data.leave.status === 'approved' && <p className="text-xs text-slate-500">Cancelling leave restores the doctor's saved daily availability rules.</p>}
      {data.leave.status === 'pending' && data.leave.end_date < today && <p className="text-xs text-red-700">This leave period has ended. Reject it and ask the doctor to request new dates.</p>}
    </div>}
  </dialog>;
}

export default function AdminLeaveRequestsTab({ onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState('pending');
  const selected = useMatch(ROUTES.ADMIN_LEAVE_REVIEW)?.params.id;
  const navigate = useNavigate();
  const reload = () => { setLoading(true); setError(''); setRefresh(value => value + 1); };
  useEffect(() => {
    const controller = new AbortController();
    api.get('/admin/doctor-leaves', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setRequests(data.requests ?? []); })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const filtered = requests.filter(request => filter === 'all' || request.status === filter);
  const decided = status => { navigate(ROUTES.ADMIN_LEAVE_REQUESTS); setMessage(`Leave request ${status}.`); reload(); onChanged?.(); };

  return <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6" aria-labelledby="leave-requests-heading">
    {selected && <ReviewLeave key={selected} id={selected} onClose={() => navigate(ROUTES.ADMIN_LEAVE_REQUESTS)} onDecided={decided} />}
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="leave-requests-heading" className="text-lg font-bold">Leave Requests</h2><p className="mt-1 text-sm text-slate-500">Review doctor leave. Daily availability and capacity changes do not need approval.</p></div><button type="button" disabled={loading} onClick={reload} className={buttonClass}>Refresh leave requests</button></div>
    <label className="block text-sm font-medium">Request status<select value={filter} onChange={event => setFilter(event.target.value)} className="ml-3 rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="all">All requests</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {message && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {loading ? <p role="status" className="text-sm text-slate-500">Loading leave requests…</p> : error ? <div role="alert" className="text-sm text-red-700">{error}<button type="button" onClick={reload} className="ml-3 underline">Retry</button></div> : filtered.length === 0 ? <p className="py-5 text-sm text-slate-500">No leave requests match this status.</p> : filtered.map(request => <article key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
      <div className="min-w-0 space-y-1"><h3 className="break-words text-sm font-semibold">Dr. {request.doctor_name}</h3><p className="text-sm text-slate-600">{date(request.start_date)} – {date(request.end_date)}</p><p className="text-xs font-medium text-slate-500">{statuses[request.status]}</p></div>
      <button type="button" onClick={() => navigate(generatePath(ROUTES.ADMIN_LEAVE_REVIEW, { id: request.id }))} className={buttonClass}>Review request #{request.id}</button>
    </article>)}
  </section>;
}
