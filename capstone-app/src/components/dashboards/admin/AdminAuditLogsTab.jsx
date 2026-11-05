import useLiveData from "@/hooks/useLiveData";
import { useCallback, useState } from "react";
import { RefreshCw, ShieldCheck } from 'lucide-react';
import api from '@/services/api';

const ACTIONS = {
  'account.created': 'Account created', 'account.updated': 'Account updated',
  'account.deactivated': 'Account deactivated', 'account.reactivated': 'Account reactivated',
  'password.issued': 'Temporary password issued', 'password.replaced': 'Temporary password replaced',
  'password.changed': 'Password changed', 'account.recovered': 'Account recovered',
  'password.recovery_requested': 'Recovery requested', 'password.recovery_verified': 'Recovery phone verified',
  'password.recovery_completed': 'Recovery completed — password changed', 'password.recovery_expired': 'Recovery expired',
  'password.recovery_failed': 'Recovery failed', 'password.recovery_cancelled': 'Recovery cancelled',
  'patient.created': 'Patient record created', 'patient.updated': 'Patient record updated',
  'patient.merged': 'Patient records merged', 'patient.duplicate_override': 'Duplicate warning overridden',
  'queue.registered': 'Walk-in registered', 'queue.status_changed': 'Queue status changed',
  'appointment.status_changed': 'Appointment status changed', 'sms.threshold_changed': 'SMS threshold changed',
  'auth.login': 'Admin sign-in', 'access.denied': 'Access denied',
  'patient.viewed': 'Patient profile viewed', 'patient.history_viewed': 'Patient history viewed', 'doctor.viewed': 'Doctor records viewed',
  'doctor.leave_approved': 'Doctor leave approved', 'doctor.leave_rejected': 'Doctor leave rejected', 'doctor.leave_cancelled': 'Doctor leave cancelled',
};
const EMPTY_FILTERS = { dateFrom: '', dateTo: '', actor: '', action: '', outcome: '' };
const time = value => new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'medium' });
const label = value => value.replaceAll('_', ' ');
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-2 focus:outline-blue-600';
const buttonClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

function EventDetails({ event }) {
  const details = typeof event.details === 'string' ? JSON.parse(event.details) : event.details || {};
  return <details className="mt-3 border-t border-slate-100 pt-3 text-sm">
    <summary className="w-fit cursor-pointer font-semibold text-blue-800">View details</summary>
    <dl className="mt-3 space-y-2 text-xs text-slate-600">
      <div><dt className="font-semibold">Event ID</dt><dd>#{event.id}</dd></div>
      <div><dt className="font-semibold">IP address</dt><dd>{event.ip_address || 'Unavailable'}</dd></div>
      {event.reason && <div><dt className="font-semibold">Reason</dt><dd className="break-words">{event.reason}</dd></div>}
      {details.changed_fields?.length > 0 && <div><dt className="font-semibold">Changed fields</dt><dd>{details.changed_fields.map(label).join(', ')}</dd></div>}
      {Object.entries(details.changes || {}).map(([field, change]) => <div key={field}>
        <dt className="font-semibold capitalize">{label(field)}</dt><dd>{String(change.from ?? 'Unavailable')} → {String(change.to ?? 'Unavailable')}</dd>
      </div>)}
      {Object.entries(details).filter(([key]) => !['changes', 'changed_fields', 'appointments'].includes(key)).map(([key, value]) => <div key={key}>
        <dt className="font-semibold capitalize">{label(key)}</dt><dd className="break-words">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
      </div>)}
      {details.appointments?.length > 0 && <div><dt className="font-semibold">Related appointments</dt><dd>{details.appointments.map(row => `#${row.appointment_id}: ${row.from} → ${row.to}`).join('; ')}</dd></div>}
    </dl>
  </details>;
}

export default function AdminAuditLogsTab() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState({ events: [], pagination: { page: 1, total: 0, totalPages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useLiveData(useCallback(async (signal) => {
    try {
      const data = await api.get('/admin/audit-logs', { params: { ...filters, page, limit: 20 }, signal });
      if (!signal.aborted) { setResult(data); setPage(data.pagination.page); setError(''); }
    } catch (err) { if (!signal.aborted) setError(err.message); }
    finally { if (!signal.aborted) setLoading(false); }
  }, [filters, page]), true, refresh);
  const reload = () => { setLoading(true); setError(''); setRefresh(value => value + 1); };
  const apply = event => {
    event.preventDefault();
    setLoading(true); setError(''); setPage(1); setFilters({ ...draft });
  };
  const reset = () => {
    setDraft(EMPTY_FILTERS); setFilters({ ...EMPTY_FILTERS }); setPage(1); setLoading(true); setError('');
  };
  const changePage = next => { setLoading(true); setError(''); setPage(next); };
  return <section aria-labelledby="audit-heading" className="w-full space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-blue-800" aria-hidden="true" />
        <div><h2 id="audit-heading" className="text-xl font-bold text-slate-800">Audit Logs</h2>
          <p className="mt-1 text-sm text-slate-500">Review administrator activity and patient account recovery. All times are Philippine Standard Time (UTC+8).</p></div>
      </div>
      <button type="button" className={`${buttonClass} inline-flex items-center gap-2`} onClick={reload} disabled={loading} aria-label="Refresh audit logs">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />Refresh
      </button>
    </div>
    <form onSubmit={apply} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['dateFrom', 'dateTo'].map((key, index) => <label key={key} className="text-xs font-semibold text-slate-600">
          {index ? 'To date' : 'From date'}<input type="date" className={inputClass} value={draft[key]} max={index ? undefined : draft.dateTo || undefined}
            min={index ? draft.dateFrom || undefined : undefined} onChange={event => setDraft({ ...draft, [key]: event.target.value })} />
        </label>)}
        <label className="text-xs font-semibold text-slate-600">Admin name or ID<input type="search" maxLength={200} className={inputClass} value={draft.actor} onChange={event => setDraft({ ...draft, actor: event.target.value })} /></label>
        <label className="text-xs font-semibold text-slate-600">Action<select aria-label="Action" className={inputClass} value={draft.action} onChange={event => setDraft({ ...draft, action: event.target.value })}>
          <option value="">All actions</option>{Object.entries(ACTIONS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
        </select></label>
        <label className="text-xs font-semibold text-slate-600">Outcome<select aria-label="Outcome" className={inputClass} value={draft.outcome} onChange={event => setDraft({ ...draft, outcome: event.target.value })}>
          <option value="">All outcomes</option>{['success', 'failed', 'denied'].map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
        </select></label>
      </div>
      <div className="mt-4 flex gap-2"><button type="submit" className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Apply filters</button>
        <button type="button" className={buttonClass} onClick={reset}>Clear filters</button></div>
    </form>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button type="button" onClick={reload} className="ml-3 font-semibold underline">Try again</button></div>}
    {loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Loading audit logs…</p>
      : !error && <>
        <p className="text-sm text-slate-500" aria-live="polite">{result.pagination.total} matching {result.pagination.total === 1 ? 'event' : 'events'}</p>
        {result.events.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500">No audit logs match these filters.</div>
          : <ol aria-label="Audit events" className="space-y-3">{result.events.map(event => {
            const details = typeof event.details === 'string' ? JSON.parse(event.details) : event.details || {};
            return <li key={event.id} className="min-w-0 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-slate-800">{ACTIONS[event.action] || event.action}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${event.outcome === 'success' ? 'bg-emerald-50 text-emerald-800' : event.outcome === 'denied' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>{event.outcome}</span></div>
            {details.recovery_id && <p className="mt-2 break-words text-sm font-semibold text-blue-900">Patient: {details.patient_name || `#${details.patient_id}`} · {details.phone}</p>}
            <p className="mt-2 break-words text-sm text-slate-600">{event.actor_name}{event.actor_user_id ? ` (#${event.actor_user_id})` : ''}{event.actor_role ? ` · ${event.actor_role}` : ''}
              {!!event.is_development && <span className="ml-2 rounded bg-violet-50 px-2 py-1 text-xs text-violet-800">Development session</span>}</p>
            <p className="mt-1 text-xs text-slate-500"><time dateTime={event.created_at}>{time(event.created_at)}</time> · {label(event.target_type)}{event.target_id ? ` #${event.target_id}` : ''}</p>
            <EventDetails event={event} />
          </li>; })}</ol>}
        <nav aria-label="Audit pagination" className="flex flex-wrap items-center justify-between gap-3 py-2">
          <p className="text-sm text-slate-500">Page {result.pagination.page} of {result.pagination.totalPages}</p>
          <div className="flex gap-2"><button className={buttonClass} disabled={result.pagination.page <= 1} onClick={() => changePage(result.pagination.page - 1)}>Previous</button>
            <button className={buttonClass} disabled={result.pagination.page >= result.pagination.totalPages} onClick={() => changePage(result.pagination.page + 1)}>Next</button></div>
        </nav>
      </>}
  </section>;
}
