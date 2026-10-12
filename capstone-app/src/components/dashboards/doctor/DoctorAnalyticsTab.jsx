import { createElement, useEffect, useState } from "react";
import {
  ArrowLeft, BarChart3, CalendarDays, CalendarRange, CheckCircle2,
  CircleAlert, ClipboardPenLine, Clock3, Download, Footprints,
  HeartPulse, Info, Printer, RefreshCw, Save, Star,
  UsersRound,
} from "lucide-react";
import { Footer } from "@/pages/LandingPage";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { AGE_GROUPS, BARANGAYS, PREGNANT_AGES, REPORT_GROUPS, createDoctorReport, emptyReport, groupOffset, normalizeReportBarangay, summarizeCompletedVisits, sumReports } from "./doctorReport";
import "./DoctorAnalyticsTab.css";

const PERIODS = [
  { value: "today", label: "Today", icon: CalendarDays, description: "Today's dental service" },
  { value: "weekly", label: "This week", icon: CalendarRange, description: "Monday–Sunday" },
  { value: "monthly", label: "This month", icon: CalendarDays, description: "This calendar month" },
];
const METRICS = [
  { key: "patients", label: "Unique patients", icon: UsersRound, color: "#2d3a8c", bg: "#eef2ff" },
  { key: "waiting", label: "Waiting", icon: Clock3, color: "#8b5d19", bg: "#fff7e6" },
  { key: "serving", label: "Serving", icon: HeartPulse, color: "#177454", bg: "#e8f7f0" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "#33728a", bg: "#eaf6fb" },
  { key: "priority", label: "Priority", icon: Star, color: "#a15a20", bg: "#fff1e7" },
  { key: "appointments", label: "Appointments", icon: CalendarDays, color: "#5946ab", bg: "#f1edff" },
  { key: "walk_ins", label: "Walk-ins", icon: Footprints, color: "#4f6586", bg: "#eef3f9" },
];
const total = (values) => values.some((value) => value !== null)
  ? values.reduce((sum, value) => sum + (value ?? 0), 0)
  : "—";

function CountInput({ label, value, onChange, disabled }) {
  return <input
    className="da-input"
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    maxLength={9}
    aria-label={label}
    placeholder="—"
    value={value ?? ""}
    disabled={disabled}
    onChange={(event) => {
      const next = event.target.value;
      if (/^\d{0,9}$/.test(next)) onChange(next === "" ? null : Number(next));
    }}
  />;
}

function ReportTable({ data, page }) {
  const groups = page === 1 ? REPORT_GROUPS.slice(0, 4) : REPORT_GROUPS.slice(4);
  const firstGroup = page === 1 ? 0 : 4;
  const columnTotal = (index) => total(data.map((row) => row[index]));
  return <table className="da-month-table"><thead>
    <tr><th rowSpan="2">Barangay</th>{groups.map((group, index) => <th colSpan="3" key={group}>{firstGroup + index + 1}. {group}</th>)}{page === 1 && <th colSpan="5">Pregnant women who received BOHC</th>}</tr>
    <tr>{groups.flatMap((group) => ["M", "F", "Total"].map((field) => <th key={`${group}-${field}`}>{field}</th>))}{page === 1 && [...PREGNANT_AGES, "Total"].map((age) => <th key={age}>{age}</th>)}</tr>
  </thead><tbody>{BARANGAYS.map((barangay, index) => <tr key={barangay}><th scope="row">{barangay}</th>
    {groups.flatMap((_, groupIndex) => {
      const offset = groupOffset(firstGroup + groupIndex);
      return [<td key={`${groupIndex}-m`}>{data[index][offset] ?? ""}</td>, <td key={`${groupIndex}-f`}>{data[index][offset + 1] ?? ""}</td>, <td key={`${groupIndex}-total`}>{total(data[index].slice(offset, offset + 2))}</td>];
    })}
    {page === 1 && PREGNANT_AGES.map((_, age) => <td key={age}>{data[index][8 + age] ?? ""}</td>)}
    {page === 1 && <td>{total(data[index].slice(8, 12))}</td>}
  </tr>)}<tr className="da-grand-total"><th scope="row">TOTAL</th>
    {groups.flatMap((_, index) => {
      const offset = groupOffset(firstGroup + index);
      return [<td key={`${index}-m`}>{columnTotal(offset)}</td>, <td key={`${index}-f`}>{columnTotal(offset + 1)}</td>, <td key={`${index}-total`}>{total(data.flatMap((row) => row.slice(offset, offset + 2)))}</td>];
    })}
    {page === 1 && PREGNANT_AGES.map((_, age) => <td key={age}>{columnTotal(8 + age)}</td>)}
    {page === 1 && <td>{total(data.flatMap((row) => row.slice(8, 12)))}</td>}
  </tr></tbody></table>;
}

function CompletedTable({ rows }) {
  const barangays = [...BARANGAYS, ...new Set(rows.map((row) => normalizeReportBarangay(row.barangay)).filter((barangay) => !BARANGAYS.includes(barangay)))];
  const cells = (entries) => {
    const counts = summarizeCompletedVisits(entries);
    return [counts.completed, counts.male, counts.female, counts.other, counts.unknown,
      ...[...AGE_GROUPS, "Unknown"].map((age) => entries.filter((row) => row.age_group === age).reduce((sum, row) => sum + Number(row.count), 0))];
  };
  return <table className="da-month-table da-completed-table"><thead><tr>
    {["Barangay", "Completed", "Male", "Female", "Other", "Unknown sex", ...AGE_GROUPS, "Unknown age"].map((label) => <th scope="col" key={label}>{label}</th>)}
  </tr></thead><tbody>
    {barangays.map((barangay) => <tr key={barangay}><th scope="row">{barangay}</th>
      {cells(rows.filter((row) => normalizeReportBarangay(row.barangay) === barangay)).map((count, index) => <td key={index}>{count}</td>)}
    </tr>)}
    <tr className="da-grand-total"><th scope="row">TOTAL</th>{cells(rows).map((count, index) => <td key={index}>{count}</td>)}</tr>
  </tbody></table>;
}

export default function DoctorAnalyticsTab({ onBack }) {
  const { user } = useAuth();
  const [period, setPeriod] = useState("today");
  const [anchorDate, setAnchorDate] = useState("");
  const [today, setToday] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [manualData, setManualData] = useState(emptyReport);
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [entryBarangay, setEntryBarangay] = useState(0);
  const [manualDate, setManualDate] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualRetry, setManualRetry] = useState(0);
  const [hasSavedRecord, setHasSavedRecord] = useState(false);
  const [legacyRecord, setLegacyRecord] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [reportRetry, setReportRetry] = useState(0);
  const [reportPage, setReportPage] = useState(1);
  const query = new URLSearchParams({ period, ...(anchorDate ? { date: anchorDate } : {}) }).toString();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api.get(`/doctor/analytics?${query}`);
        if (active) {
          setStats(data);
          setToday(data.report_date);
          setSelectedDate((date) => date || data.report_date);
          setError("");
        }
      } catch (err) {
        if (active) { setStats(null); setError(err.message || "Could not load analytics."); }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => { active = false; clearInterval(timer); };
  }, [query, retry]);

  useEffect(() => {
    if (!manualOpen || !selectedDate) return;
    let active = true;
    setManualLoading(true);
    setManualError("");
    setManualDate("");
    api.get(`/doctor/daily-report?date=${selectedDate}`)
      .then((response) => {
        if (active) {
          setManualData(Array.isArray(response.data) ? response.data : emptyReport());
          setHasSavedRecord(Boolean(response.data));
          setLegacyRecord(response.legacy ?? null);
          setManualDate(selectedDate);
          setDirty(false);
        }
      })
      .catch((err) => { if (active) setManualError(err.message || "Could not load your report."); })
      .finally(() => { if (active) setManualLoading(false); });
    return () => { active = false; };
  }, [selectedDate, manualOpen, manualRetry]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await api.get(`/doctor/report?${query}`);
        if (active) { setReport({ ...response, data: sumReports(response.reports) }); setReportError(""); }
      } catch (err) {
        if (active) { setReport(null); setReportError(err.message || "Could not load report."); }
      } finally {
        if (active) setReportLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => { active = false; clearInterval(timer); };
  }, [query, reportRetry]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const selectPeriod = (value) => {
    if (value === period) return;
    setPeriod(value);
    if (value === "today") setSelectedDate(anchorDate || today);
    setStats(null);
    setReport(null);
    setLoading(true);
    setReportLoading(true);
    setReportPage(1);
    setError("");
    setReportError("");
  };
  const changeRange = (date) => {
    setAnchorDate(date);
    if (period === "today") setSelectedDate(date || today);
    setStats(null);
    setReport(null);
    setLoading(true);
    setReportLoading(true);
    setReportPage(1);
    setError("");
    setReportError("");
  };
  const changeCount = (barangayIndex, fieldIndex, value) => {
    setManualData((current) => current.map((row, index) => index === barangayIndex
      ? row.map((item, field) => field === fieldIndex ? value : item)
      : row));
    setDirty(true);
  };
  const saveReport = async (event) => {
    event.preventDefault();
    if (!dirty || saving || manualDate !== selectedDate) return;
    setSaving(true);
    setManualError("");
    try {
      await api.put("/doctor/daily-report", { date: selectedDate, data: manualData });
      setHasSavedRecord(true);
      setDirty(false);
      setReportLoading(true);
      setReportRetry((value) => value + 1);
    } catch (err) {
      setManualError(err.message || "Could not save your report.");
    } finally {
      setSaving(false);
    }
  };
  const downloadReport = () => {
    if (!exportReady) return;
    const blob = new Blob([createDoctorReport(report.from, doctorName, report.data, { period, from: report.from, until: report.until, completed_demographics: completedRows })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dental-report-${period}-${report.from}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const doctorName = user?.display_name || "Doctor";
  const reportReady = Boolean(selectedDate) && manualDate === selectedDate && !manualLoading;
  const hasManualEntries = report?.data.some((row) => row.some((value) => value !== null));
  const completedRows = stats?.completed_demographics || [];
  const completed = summarizeCompletedVisits(completedRows);
  const exportReady = Boolean(stats && report && stats.from === report.from && stats.until === report.until && !loading && !reportLoading && !error && !reportError && !dirty && (completed.completed || hasManualEntries));
  const ages = new Map(stats?.age_groups?.map((row) => [row.age_group, Number(row.count)]) || []);
  const maxAge = Math.max(1, ...ages.values());
  const periodInfo = PERIODS.find((item) => item.value === period);
  const reportTitle = `${period === "today" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly"} dental service report`;
  const range = stats || report;
  const lastDate = range?.until ? new Date(Date.parse(`${range.until}T00:00:00Z`) - 86400000).toISOString().slice(0, 10) : "";
  const rangeLabel = range?.from ? range.from === lastDate ? range.from : `${range.from} – ${lastDate}` : "";

  return <>
    <main className="da-page">
      <div className="da-top">
        <div className="da-title"><span className="da-title-icon"><BarChart3 size={23} /></span><div>
          <p className="da-eyebrow">Dental service</p><h1>Doctor Analytics</h1>
        </div></div>
        <button className="da-back" type="button" onClick={() => { if (!dirty || window.confirm("Discard unsaved barangay entries?")) onBack(); }}><ArrowLeft size={17} /> Back to dashboard</button>
      </div>

      <div className="da-periods" role="group" aria-label="Analytics period">
        {PERIODS.map(({ value, label, icon }) => <button
          key={value} className="da-period" type="button" aria-pressed={period === value}
          disabled={dirty || saving} onClick={() => selectPeriod(value)}>{createElement(icon, { size: 16 })} {label}</button>)}
      </div>
      <label className="da-field da-month-picker">{period === "monthly" ? "Report month" : period === "weekly" ? "Week containing" : "Report date"}
        <input className="da-input" type={period === "monthly" ? "month" : "date"} value={period === "monthly" ? (anchorDate || today).slice(0, 7) : anchorDate || today} max={period === "monthly" ? today.slice(0, 7) : today} disabled={!today || dirty || saving} onChange={(event) => changeRange(period === "monthly" && event.target.value ? `${event.target.value}-01` : event.target.value)} />
      </label>
      <p className="da-muted">{rangeLabel || periodInfo.description} · Your recorded dental activity · Philippine time</p>
      {loading && <p role="status" className="da-muted">Loading analytics…</p>}
      {error && <div className="da-alert" role="alert"><CircleAlert size={17} /> {error}
        <button type="button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Retry</button></div>}

      {stats && <>
        <div className="da-metrics">
          {METRICS.filter(({ key }) => period === "today" || (key !== "waiting" && key !== "serving")).map(({ key, label, icon, color, bg }) => <div className="da-metric" key={key}>
            <span className="da-metric-icon" style={{ "--metric-color": color, "--metric-bg": bg }}>{createElement(icon, { size: 19 })}</span>
            <div><span className="da-metric-label">{label}</span><strong>{stats[key] ?? 0}</strong></div>
          </div>)}
        </div>

        <section className="da-card" aria-labelledby="da-age-title">
          <div className="da-section-heading"><span className="da-section-icon"><UsersRound size={21} /></span><div>
            <h2 id="da-age-title">Completed visits by age group</h2>
            <p className="da-muted">{rangeLabel} · Age at the time of the visit</p>
          </div></div>
          <div className="da-age-grid">{[...AGE_GROUPS, "Unknown"].map((group) => {
            const count = ages.get(group) || 0;
            return <div className="da-age-row" key={group}>
              <span>{group}</span><div className="da-age-track" aria-hidden="true"><div className="da-age-fill" style={{ width: `${count / maxAge * 100}%` }} /></div><strong>{count}</strong>
            </div>;
          })}</div>
          <p className="da-note"><Info size={15} /> Each completed visit is counted once, including visits without consultation notes. One patient may have several visits.</p>
        </section>
      </>}

        <section className="da-card">
          <button className="da-button da-button-secondary" type="button" aria-expanded={manualOpen} aria-controls="da-manual-entries" disabled={!selectedDate || dirty || saving} onClick={() => setManualOpen((open) => !open)}><ClipboardPenLine size={17} /> Daily barangay entries</button>
          <p className="da-muted">Open when you need to add manual clinical counts for cases missing from the system. Automatic completed-visit counts remain separate.</p>
          {manualOpen && <div id="da-manual-entries">
          <div className="da-section-head da-report-head">
            <div className="da-section-heading"><span className="da-section-icon"><ClipboardPenLine size={21} /></span><div>
              <h2 id="da-report-title">Manual clinical entries</h2>
              <p className="da-muted">BOHC, orally fit children, new DMFT cases, and pregnant BOHC are entered manually. Saved days feed daily, weekly, and monthly reports.</p>
              {reportReady && <span className={`da-status ${dirty ? "da-status-unsaved" : !hasSavedRecord ? "da-status-ready" : ""}`}>
                {dirty ? <CircleAlert size={14} /> : hasSavedRecord ? <CheckCircle2 size={14} /> : <Info size={14} />}{dirty ? "Unsaved changes" : hasSavedRecord ? "Saved for this date" : "Ready for entries"}
              </span>}
            </div></div>
          </div>
          {manualLoading && <p className="da-muted" role="status">Loading saved entries…</p>}
          {manualError && <div className="da-alert" role="alert"><CircleAlert size={17} /> {manualError}
            {!reportReady && <button type="button" onClick={() => setManualRetry((value) => value + 1)}><RefreshCw size={14} /> Retry</button>}
          </div>}
          {legacyRecord && <details className="da-legacy" role="note"><summary>Earlier unassigned totals for this date</summary>
            <p className="da-muted">These saved figures remain available. Assign them to barangays manually if you know their source.</p>
            <div className="da-month-wrap"><table><thead><tr><th>Measure</th><th>Est. population</th><th>Male</th><th>Female</th></tr></thead>
              <tbody>{REPORT_GROUPS.map((group, index) => <tr key={group}><th scope="row">{group}</th>{(legacyRecord.categories[index] || []).map((value, field) => <td key={field}>{value ?? ""}</td>)}</tr>)}</tbody></table></div>
            <p className="da-muted">Pregnant BOHC: estimated population {legacyRecord.pregnant?.[0] ?? "—"}; 10–14: {legacyRecord.pregnant?.[1] ?? "—"}; 15–19: {legacyRecord.pregnant?.[2] ?? "—"}; 20–49: {legacyRecord.pregnant?.[3] ?? "—"}.</p>
          </details>}
          <form onSubmit={saveReport}>
            <div className="da-entry-controls">
              <label className="da-field">Entry date<input className="da-input" type="date" value={selectedDate} max={today} disabled={dirty || saving} onChange={(event) => { setSelectedDate(event.target.value); setManualDate(""); }} /></label>
              <label className="da-field">Barangay<select className="da-input" value={entryBarangay} onChange={(event) => setEntryBarangay(Number(event.target.value))}>{BARANGAYS.map((barangay, index) => <option key={barangay} value={index}>{barangay}</option>)}</select></label>
            </div>
            <h3 className="da-subhead">{BARANGAYS[entryBarangay]} · {selectedDate}</h3>
            <div className="da-entry-groups">{REPORT_GROUPS.map((group, index) => <fieldset className="da-entry-group" key={group}>
              <legend>{index + 1}. {group}</legend>
              {["Male", "Female"].map((sex, field) => <label className="da-field" key={sex}>{sex}<CountInput label={`${BARANGAYS[entryBarangay]}, ${group}, ${sex}`} value={manualData[entryBarangay][groupOffset(index) + field]} onChange={(value) => changeCount(entryBarangay, groupOffset(index) + field, value)} disabled={!reportReady || saving} /></label>)}
              <span className="da-entry-total">Total: {total(manualData[entryBarangay].slice(groupOffset(index), groupOffset(index) + 2))}</span>
            </fieldset>)}</div>
            <fieldset className="da-entry-group da-entry-pregnant"><legend>Pregnant women who received BOHC</legend>
              {PREGNANT_AGES.map((age, index) => <label className="da-field" key={age}>{age} years<CountInput label={`${BARANGAYS[entryBarangay]}, pregnant women, ${age} years`} value={manualData[entryBarangay][8 + index]} onChange={(value) => changeCount(entryBarangay, 8 + index, value)} disabled={!reportReady || saving} /></label>)}
              <span className="da-entry-total">Total: {total(manualData[entryBarangay].slice(8, 12))}</span>
            </fieldset>
            <p className="da-note"><Info size={15} /> Blank means no entry; enter 0 for a confirmed zero. Save before changing the date.</p>
            <div className="da-actions">
              <button className="da-button da-button-primary" type="submit" disabled={!reportReady || !dirty || saving}><Save size={17} /> {saving ? "Saving…" : "Save entries"}</button>
            </div>
          </form>
          </div>}
        </section>

        <section className="da-card" aria-labelledby="da-period-report-title">
            <h2 id="da-period-report-title">{reportTitle}</h2>
            <p className="da-muted">{rangeLabel} · {doctorName}</p>
            <h3 className="da-subhead">Automatic completed visits</h3>
            {stats && <>
              <p className="da-muted">{completed.completed} completed visits · Male {completed.male} · Female {completed.female} · Other {completed.other} · Unknown sex {completed.unknown}</p>
              {completed.missing > 0 && <p className="da-alert" role="note"><Info size={17} /> {completed.missing} completed visits have missing demographics or a barangay outside the report list. They remain included below.</p>}
              <div className="da-month-wrap"><CompletedTable rows={completedRows} /></div>
            </>}
            <h3 className="da-subhead">Manual clinical counts</h3>
            <p className="da-muted">Saved daily entries are added for this period. Completed visits do not automatically establish BOHC or other clinical outcomes.</p>
            {reportLoading && <p role="status" className="da-muted">Loading report…</p>}
            {reportError && <div className="da-alert" role="alert"><CircleAlert size={17} /> {reportError}<button type="button" onClick={() => { setReportLoading(true); setReportRetry((value) => value + 1); }}>Retry</button></div>}
            {report && !reportLoading && !reportError && <>
              {!hasManualEntries && <p className="da-muted">No saved manual clinical entries for this period yet.</p>}
              <div className="da-periods" role="group" aria-label="Report pages">{[1, 2].map((page) => <button type="button" className="da-period" key={page} aria-pressed={reportPage === page} onClick={() => setReportPage(page)}>Page {page}</button>)}</div>
              <p className="da-subhead">{reportPage === 1 ? "Page 1 · Dental measures 1–4 and pregnant BOHC" : "Page 2 · BOHC age groups 5–10"}</p>
              <div className="da-month-wrap"><ReportTable data={report.data} page={reportPage} /></div>
            </>}
            <div className="da-actions">
              <button className="da-button da-button-secondary" type="button" disabled={!exportReady} onClick={() => window.print()}><Printer size={17} /> Print report</button>
              <button className="da-button da-button-secondary" type="button" disabled={!exportReady} onClick={downloadReport}><Download size={17} /> Download Excel</button>
            </div>
        </section>
    </main>

    {exportReady && <section id="doctor-report-print" aria-label="Printable dental report">
      <h1>{reportTitle}</h1><p>{rangeLabel} · {doctorName} · Philippine time</p>
      <h2>Automatic completed visits · {completed.completed} visits</h2>
      <CompletedTable rows={completedRows} />
      <p>{completed.missing} visits need demographic review. Automatic visit totals are separate from manual clinical counts.</p>
      <h2>Manual clinical counts · page 1</h2>
      <ReportTable data={report.data} page={1} />
      <div className="da-print-page"><h1>{reportTitle} · page 2</h1><p>{rangeLabel} · {doctorName}</p><h2>Manual clinical counts</h2><ReportTable data={report.data} page={2} /></div>
    </section>}
    <Footer />
  </>;
}
