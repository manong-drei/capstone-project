import useLiveData from "@/hooks/useLiveData";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Info, LoaderCircle, RefreshCw, Send, X } from 'lucide-react';
import api from '@/services/api';

const date = value => new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium' });
const inputClass = 'mt-1.5 block min-h-11 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-800 focus:border-blue-600 focus:outline-2 focus:outline-blue-600';
const statuses = { pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' };

export default function DoctorLeaveModal({ onClose }) {
  const dialogRef = useRef(null);
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
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  useLiveData(useCallback(async (signal) => {
    try {
      const data = await api.get('/doctor/leave-requests', { signal });
      if (!signal.aborted) { setRequests(data.requests ?? []); setLoadError(''); }
    } catch (err) { if (!signal.aborted) setLoadError(err.message); }
    finally { if (!signal.aborted) setLoading(false); }
  }, []), true, refresh);

  const submit = async event => {
    event.preventDefault();
    if (busy) return;
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
    if (busy) return;
    setError(''); setMessage(''); setBusy(true);
    try {
      await api.patch(`/doctor/leave-requests/${id}/withdraw`);
      setMessage('Pending leave request withdrawn.'); reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="doctor-leave-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-900/55 sm:rounded-[20px]"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:flex">
            <CalendarDays size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="doctor-leave-title" className="text-xl font-bold tracking-tight text-[#1a3a8f]">Leave Requests</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Plan time away and track admin decisions.</p>
          </div>
        </div>
        <button
          type="button"
          autoFocus
          aria-label="Close leave requests"
          disabled={busy}
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-relaxed text-blue-900">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>Leave needs admin approval. Pending requests keep your current availability. Approved dates block new appointments and walk-ins.</p>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <form onSubmit={submit} aria-label="Request doctor leave" aria-busy={busy} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h3 className="font-bold text-[#1a3a8f]">Request leave</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Both dates are required. Philippine dates; the end date is included.</p>
            </div>
            <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="min-w-0 text-sm font-semibold text-slate-700">
                Start date
                <input type="date" required min={today} value={start} onChange={event => { setStart(event.target.value); setError(''); }} className={inputClass} />
              </label>
              <label className="min-w-0 text-sm font-semibold text-slate-700">
                End date
                <input type="date" required min={start || today} value={end} onChange={event => { setEnd(event.target.value); setError(''); }} className={inputClass} />
              </label>
              <div className="min-w-0 sm:col-span-2">
                <label htmlFor="leave-reason" className="text-sm font-semibold text-slate-700">Reason (optional)</label>
                <textarea id="leave-reason" aria-describedby="leave-reason-help" rows={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className={inputClass} />
                <p id="leave-reason-help" className="mt-1.5 text-xs leading-relaxed text-slate-500">Visible only to you and admins. Up to 500 characters.</p>
              </div>
            </fieldset>
            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 [overflow-wrap:anywhere]">{error}</p>}
            {message && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800 [overflow-wrap:anywhere]">{message}</p>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1e4db7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {busy ? <LoaderCircle size={17} className="shrink-0 animate-spin" aria-hidden="true" /> : <Send size={17} className="shrink-0" aria-hidden="true" />}
              {busy ? 'Saving…' : 'Submit leave request'}
            </button>
          </form>

          <section aria-labelledby="my-leave-heading" className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="my-leave-heading" className="font-bold text-[#1a3a8f]">My leave requests</h3>
              <button
                type="button"
                aria-label="Refresh leave requests"
                disabled={loading || busy}
                onClick={reload}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                Refresh
              </button>
            </div>
            {loading ? (
              <p role="status" className="py-6 text-center text-sm text-slate-500">Loading leave requests…</p>
            ) : loadError ? (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p role="alert" className="text-sm text-red-700 [overflow-wrap:anywhere]">{loadError}</p>
                <button type="button" onClick={reload} className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">Retry</button>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CalendarDays size={26} className="text-slate-400" aria-hidden="true" />
                <p className="text-sm text-slate-500">No leave requests yet.</p>
              </div>
            ) : requests.map(request => (
              <article key={request.id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold leading-relaxed text-slate-900">{date(request.start_date)} – {date(request.end_date)}</p>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-800' : request.status === 'pending' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{statuses[request.status]}</span>
                </div>
                {request.reason && <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">{request.reason}</p>}
                {request.review_note && <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere]"><strong className="mb-1 block text-xs font-semibold text-slate-500">Admin note</strong><span className="whitespace-pre-wrap">{request.review_note}</span></p>}
                {request.status === 'pending' && (
                  <div className="border-t border-slate-100 pt-3">
                    <button type="button" disabled={busy} onClick={() => withdraw(request.id)} className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">Withdraw request</button>
                  </div>
                )}
                {request.status === 'approved' && request.end_date >= today && <p className="border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">Contact an admin if these approved dates need to change.</p>}
              </article>
            ))}
          </section>
        </div>
      </div>
    </dialog>
  );
}
