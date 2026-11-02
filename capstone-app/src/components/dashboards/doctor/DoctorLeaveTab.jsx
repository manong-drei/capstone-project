import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Footer } from '@/pages/LandingPage';

const date = value => new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium' });
const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-2 focus:outline-indigo-600';
const statuses = { pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' };

export default function DoctorLeaveTab({ onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const reload = () => { setLoading(true); setLoadError(''); setRefresh(value => value + 1); };

  useEffect(() => {
    const controller = new AbortController();
    api.get('/doctor/leave-requests', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setRequests(data.requests ?? []); })
      .catch(err => { if (!controller.signal.aborted) setLoadError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  const submit = async event => {
    event.preventDefault();
    setError(''); setMessage('');
    if (start < today || end < start) { setError('Choose a start date of today or later and an end date on or after it.'); return; }
    setBusy(true);
    try {
      const data = await api.post('/doctor/leave-requests', { start_date: start, end_date: end, reason: reason.trim() });
      setStart(''); setEnd(''); setReason(''); setMessage(data.message); reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const withdraw = async id => {
    setError(''); setMessage(''); setBusy(true);
    try {
      await api.patch(`/doctor/leave-requests/${id}/withdraw`);
      setMessage('Pending leave request withdrawn.'); reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <>
    <main className="dd-tab-pad mx-auto w-full max-w-5xl flex-1 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><button type="button" onClick={onBack} className="text-sm text-slate-600">← Back</button><h2 className="text-xl font-bold text-slate-900">Leave Requests</h2></div>
        <button type="button" disabled={loading || busy} onClick={reload} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50">Refresh leave requests</button>
      </div>
      <p className="text-sm leading-relaxed text-slate-600">Request a date range for admin approval. Pending requests keep your current availability. Approved leave blocks new appointments and walk-ins for the full period, using Philippine dates.</p>
      <form onSubmit={submit} aria-label="Request doctor leave" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Request leave</h3>
        <p className="text-xs text-slate-500">Both dates are required. The end date is included.</p>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Start date<input type="date" required min={today} value={start} onChange={event => { setStart(event.target.value); setError(''); }} className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700">End date<input type="date" required min={start || today} value={end} onChange={event => { setEnd(event.target.value); setError(''); }} className={inputClass} /></label>
          <div className="sm:col-span-2"><label htmlFor="leave-reason" className="text-sm font-medium text-slate-700">Reason (optional)</label><textarea id="leave-reason" aria-describedby="leave-reason-help" rows={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className={inputClass} /><p id="leave-reason-help" className="mt-1 text-xs text-slate-500">Visible only to you and admins. Up to 500 characters.</p></div>
        </fieldset>
        <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">{busy ? 'Saving…' : 'Submit leave request'}</button>
      </form>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
      <section aria-labelledby="my-leave-heading" className="space-y-3">
        <h3 id="my-leave-heading" className="font-semibold text-slate-900">My leave requests</h3>
        {loading ? <p role="status" className="text-sm text-slate-500">Loading leave requests…</p> : loadError ? <div role="alert" className="text-sm text-red-700">{loadError}<button type="button" onClick={reload} className="ml-3 underline">Retry</button></div> : requests.length === 0 ? <p className="text-sm text-slate-500">No leave requests yet.</p> : requests.map(request => <article key={request.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{date(request.start_date)} – {date(request.end_date)}</p><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === 'approved' ? 'bg-green-50 text-green-800' : request.status === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{statuses[request.status]}</span></div>
          {request.reason && <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{request.reason}</p>}
          {request.review_note && <p className="whitespace-pre-wrap break-words text-sm text-slate-700"><strong>Admin note:</strong> {request.review_note}</p>}
          {request.status === 'pending' && <button type="button" disabled={busy} onClick={() => withdraw(request.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-50">Withdraw request</button>}
          {request.status === 'approved' && request.end_date >= today && <p className="text-xs text-slate-500">Contact an admin if these approved dates need to change.</p>}
        </article>)}
      </section>
    </main>
    <Footer />
  </>;
}
