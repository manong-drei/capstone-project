import useLiveData from "@/hooks/useLiveData";
import { useCallback, useEffect, useState } from "react";
import { useBlocker, useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardPenLine,
  Download,
  Footprints,
  Info,
  Printer,
  RefreshCw,
  Save,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import {
  AGE_GROUPS,
  BARANGAYS,
  PREGNANT_AGES,
  REPORT_GROUPS,
  createDoctorReport,
  emptyReport,
  groupOffset,
  normalizeReportBarangay,
  summarizeCompletedVisits,
  sumReports,
} from "./doctorReport";
import "./DoctorAnalyticsTab.css";

const PERIODS = [
  {
    value: "today",
    label: "Today",
    icon: CalendarDays,
    description: "Today's dental service",
  },
  {
    value: "weekly",
    label: "This week",
    icon: CalendarRange,
    description: "Monday–Sunday",
  },
  {
    value: "monthly",
    label: "This month",
    icon: CalendarDays,
    description: "This calendar month",
  },
];
const METRICS = [
  {
    key: "patients",
    label: "Unique patients",
    icon: UsersRound,
    color: "bg-blue-50 text-blue-700",
  },
  {
    key: "completed",
    label: "Completed visits",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "appointments",
    label: "Appointments",
    icon: CalendarDays,
    color: "bg-violet-50 text-violet-700",
  },
  {
    key: "walk_ins",
    label: "Walk-ins",
    icon: Footprints,
    color: "bg-slate-100 text-slate-600",
  },
];
const MEASURE_NAMES = [
  "Orally fit children",
  "Clients examined · 5+ years",
  "New DMFT cases · 5+ years",
  "Infants · BOHC",
  "Children 1–4 · BOHC",
  "Children 5–9 · BOHC",
  "Adolescents 10–14 · BOHC",
  "Adults 15–19 · BOHC",
  "Adults 20–59 · BOHC",
  "Senior citizens · BOHC",
  "Pregnant women · BOHC",
];
const INPUT_CLASS =
  "min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 focus:border-blue-600 focus:outline-2 focus:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const PRIMARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1e4db7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";
const PROGRESS_CLASS =
  "block h-2 w-full overflow-hidden rounded-full bg-slate-100 [&::-moz-progress-bar]:bg-blue-600 [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-600";
const measureFields = (measure) =>
  measure === REPORT_GROUPS.length
    ? PREGNANT_AGES.map((age, index) => ({
        label: age === "25 and above" ? age : `${age} years`,
        index: 8 + index,
      }))
    : ["Male", "Female"].map((label, index) => ({
        label,
        index: groupOffset(measure) + index,
      }));
const measureDescription = (measure) =>
  REPORT_GROUPS[measure] || "Pregnant women who received BOHC";
const total = (values) =>
  values.some((value) => value !== null)
    ? values.reduce((sum, value) => sum + (value ?? 0), 0)
    : "—";

function CountInput({ label, value, onChange, disabled }) {
  return (
    <input
      className={`${INPUT_CLASS} font-semibold`}
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
    />
  );
}

function ReportTable({ data, page }) {
  const groups =
    page === 1 ? REPORT_GROUPS.slice(0, 4) : REPORT_GROUPS.slice(4);
  const firstGroup = page === 1 ? 0 : 4;
  const columnTotal = (index) => total(data.map((row) => row[index]));
  return (
    <table className="da-month-table">
      <thead>
        <tr>
          <th rowSpan="2">Barangay</th>
          {groups.map((group, index) => (
            <th colSpan="3" key={group}>
              {firstGroup + index + 1}. {group}
            </th>
          ))}
          {page === 1 && <th colSpan="5">Pregnant women who received BOHC</th>}
        </tr>
        <tr>
          {groups.flatMap((group) =>
            ["M", "F", "Total"].map((field) => (
              <th key={`${group}-${field}`}>{field}</th>
            )),
          )}
          {page === 1 &&
            [...PREGNANT_AGES, "Total"].map((age) => <th key={age}>{age}</th>)}
        </tr>
      </thead>
      <tbody>
        {BARANGAYS.map((barangay, index) => (
          <tr key={barangay}>
            <th scope="row">{barangay}</th>
            {groups.flatMap((_, groupIndex) => {
              const offset = groupOffset(firstGroup + groupIndex);
              return [
                <td key={`${groupIndex}-m`}>{data[index][offset] ?? ""}</td>,
                <td key={`${groupIndex}-f`}>
                  {data[index][offset + 1] ?? ""}
                </td>,
                <td key={`${groupIndex}-total`}>
                  {total(data[index].slice(offset, offset + 2))}
                </td>,
              ];
            })}
            {page === 1 &&
              PREGNANT_AGES.map((_, age) => (
                <td key={age}>{data[index][8 + age] ?? ""}</td>
              ))}
            {page === 1 && <td>{total(data[index].slice(8, 12))}</td>}
          </tr>
        ))}
        <tr className="da-grand-total">
          <th scope="row">TOTAL</th>
          {groups.flatMap((_, index) => {
            const offset = groupOffset(firstGroup + index);
            return [
              <td key={`${index}-m`}>{columnTotal(offset)}</td>,
              <td key={`${index}-f`}>{columnTotal(offset + 1)}</td>,
              <td key={`${index}-total`}>
                {total(data.flatMap((row) => row.slice(offset, offset + 2)))}
              </td>,
            ];
          })}
          {page === 1 &&
            PREGNANT_AGES.map((_, age) => (
              <td key={age}>{columnTotal(8 + age)}</td>
            ))}
          {page === 1 && (
            <td>{total(data.flatMap((row) => row.slice(8, 12)))}</td>
          )}
        </tr>
      </tbody>
    </table>
  );
}

function CompletedTable({ rows }) {
  const barangays = [
    ...BARANGAYS,
    ...new Set(
      rows
        .map((row) => normalizeReportBarangay(row.barangay))
        .filter((barangay) => !BARANGAYS.includes(barangay)),
    ),
  ];
  const cells = (entries) => {
    const counts = summarizeCompletedVisits(entries);
    return [
      counts.completed,
      counts.male,
      counts.female,
      counts.other,
      counts.unknown,
      ...[...AGE_GROUPS, "Unknown"].map((age) =>
        entries
          .filter((row) => row.age_group === age)
          .reduce((sum, row) => sum + Number(row.count), 0),
      ),
    ];
  };
  return (
    <table className="da-month-table da-completed-table">
      <thead>
        <tr>
          {[
            "Barangay",
            "Completed",
            "Male",
            "Female",
            "Other",
            "Unknown sex",
            ...AGE_GROUPS,
            "Unknown age",
          ].map((label) => (
            <th scope="col" key={label}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {barangays.map((barangay) => (
          <tr key={barangay}>
            <th scope="row">{barangay}</th>
            {cells(
              rows.filter(
                (row) => normalizeReportBarangay(row.barangay) === barangay,
              ),
            ).map((count, index) => (
              <td key={index}>{count}</td>
            ))}
          </tr>
        ))}
        <tr className="da-grand-total">
          <th scope="row">TOTAL</th>
          {cells(rows).map((count, index) => (
            <td key={index}>{count}</td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function MeasureSelect({ value, onChange, disabled = false }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
      Clinical measure
      <select
        className={INPUT_CLASS}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
      >
        {MEASURE_NAMES.map((name, index) => (
          <option key={name} value={index}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClinicalRows({ rows, fields }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.barangay}
            aria-label={row.barangay}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900">
                {row.barangay}
              </h4>
              {row.recorded && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                  {row.values.every((value) => value === 0)
                    ? "Confirmed zero"
                    : "Recorded"}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3">
              {fields.map((field, index) => (
                <div key={field.index}>
                  <dt className="text-xs text-slate-500">{field.label}</dt>
                  <dd className="mt-1 text-base font-semibold">
                    {row.values[index] ?? "—"}
                  </dd>
                </div>
              ))}
              <div className="col-span-2 flex justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-blue-900">
                <dt>Total</dt>
                <dd>{total(row.values)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
        <table
          aria-label="Clinical counts by barangay"
          className="w-full table-fixed text-sm"
        >
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th
                scope="col"
                className="w-1/4 break-words px-3 py-3 text-left font-semibold"
              >
                Barangay
              </th>
              {fields.map((field) => (
                <th
                  scope="col"
                  key={field.index}
                  className="wrap-break-word px-2 py-3 text-right font-semibold"
                >
                  {field.label}
                </th>
              ))}
              <th scope="col" className="px-2 py-3 text-right font-semibold">
                Total
              </th>
              <th
                scope="col"
                className="break-words px-3 py-3 text-left font-semibold"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.barangay}>
                <th
                  scope="row"
                  className="break-words px-3 py-4 text-left font-semibold text-slate-900"
                >
                  {row.barangay}
                </th>
                {row.values.map((value, index) => (
                  <td key={index} className="px-2 py-4 text-right tabular-nums">
                    {value ?? "—"}
                  </td>
                ))}
                <td className="px-2 py-4 text-right font-semibold tabular-nums text-blue-900">
                  {total(row.values)}
                </td>
                <td className="break-words px-3 py-4 text-xs text-slate-500">
                  {row.recorded
                    ? row.values.every((value) => value === 0)
                      ? "Confirmed zero"
                      : "Recorded"
                    : "No entry"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ClinicalCountsReport({ data, measure, onMeasureChange }) {
  const fields = measureFields(measure);
  const rows = BARANGAYS.map((barangay, index) => {
    const values = fields.map((field) => data[index][field.index]);
    return {
      barangay,
      values,
      recorded: values.some((value) => value !== null),
    };
  });
  const recorded = rows.filter((row) => row.recorded);
  const blank = rows.filter((row) => !row.recorded);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-xl bg-slate-50 p-4">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={14} aria-hidden="true" />
          Saved daily entries
        </p>
        <MeasureSelect value={measure} onChange={onMeasureChange} />
        <p className="text-xs leading-relaxed text-slate-600">
          {measureDescription(measure)}.{" "}
          <span className="mt-1 block">11 measures available.</span>
        </p>
        <div className="rounded-xl bg-blue-100/60 p-4">
          <h3 className="text-sm font-semibold text-blue-950">
            This measure only
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            {fields.map((field, index) => (
              <div key={field.index}>
                <dt className="text-xs text-slate-600">{field.label}</dt>
                <dd className="mt-1 text-lg font-bold text-blue-950">
                  {total(rows.map((row) => row.values[index]))}
                </dd>
              </div>
            ))}
            <div className="col-span-2 flex justify-between border-t border-blue-200 pt-3 font-semibold text-blue-950">
              <dt>Total</dt>
              <dd>{total(rows.flatMap((row) => row.values))}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-600">
            Totals across all barangays.
          </p>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Clinical measures are separate from completed visits. Different
          measures may overlap.
        </p>
      </aside>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Recorded barangays
          </h3>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            {recorded.length} of {BARANGAYS.length}
          </span>
        </div>
        {recorded.length ? (
          <ClinicalRows rows={recorded} fields={fields} />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
            No saved entries for this measure in the selected period.
          </p>
        )}
        {blank.length > 0 && (
          <details
            key={measure}
            className="group rounded-xl border border-slate-200"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600">
              <span>
                {blank.length} barangays without entries
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Expand to review blank rows.
                </span>
              </span>
              <ChevronDown
                size={18}
                className="shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="p-3">
              <ClinicalRows rows={blank} fields={fields} />
            </div>
          </details>
        )}
        <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <Info size={16} className="shrink-0" aria-hidden="true" />— No entry ·
          0 Confirmed zero
        </p>
      </div>
    </div>
  );
}

function CompletedBreakdown({ rows, completed }) {
  const [breakdown, setBreakdown] = useState("barangay");
  const sexLabel = (row) =>
    ["male", "female", "other"].includes(String(row.sex).trim().toLowerCase())
      ? String(row.sex).trim().toLowerCase()
      : "unknown";
  const ageLabel = (row) =>
    AGE_GROUPS.includes(row.age_group) ? row.age_group : "Unknown";
  const labels =
    breakdown === "barangay"
      ? [
          ...BARANGAYS,
          ...new Set(
            rows
              .map((row) => normalizeReportBarangay(row.barangay))
              .filter((name) => !BARANGAYS.includes(name)),
          ),
        ]
      : breakdown === "age"
        ? [...AGE_GROUPS, "Unknown"]
        : ["Male", "Female", "Other", "Unknown sex"];
  const groups = labels.map((label) => {
    const entries = rows.filter((row) =>
      breakdown === "barangay"
        ? normalizeReportBarangay(row.barangay) === label
        : breakdown === "age"
          ? ageLabel(row) === label
          : sexLabel(row) ===
            (label === "Unknown sex" ? "unknown" : label.toLowerCase()),
    );
    return {
      label,
      entries,
      count: summarizeCompletedVisits(entries).completed,
    };
  });
  const visibleGroups = groups.filter(
    (group) => breakdown !== "barangay" || group.count > 0,
  );
  const emptyGroups = groups.filter(
    (group) => breakdown === "barangay" && group.count === 0,
  );
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-xl bg-slate-50 p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={14} aria-hidden="true" />
          Automatic
        </span>
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {completed.completed} completed visits
          </h3>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Breakdown
          <select
            value={breakdown}
            onChange={(event) => setBreakdown(event.target.value)}
            className={INPUT_CLASS}
          >
            <option value="barangay">By barangay</option>
            <option value="age">By age group</option>
            <option value="sex">By sex</option>
          </select>
        </label>
        <p className="text-xs leading-relaxed text-slate-500">
          Visits are counted separately from clinical outcomes.
        </p>
      </aside>
      <div className="min-w-0 space-y-4">
        <section
          aria-label="Completed visit breakdown"
          className="divide-y divide-slate-100 rounded-xl border border-slate-200"
        >
          {!visibleGroups.length && (
            <p className="p-5 text-sm text-slate-500">
              No completed visits for this period.
            </p>
          )}
          {visibleGroups.map((group) => {
            const line = (
              <>
                <span className="flex items-center gap-2 break-words text-sm font-semibold text-slate-800">
                  {group.label}
                  {breakdown === "barangay" && (
                    <ChevronDown
                      size={14}
                      className="shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <progress
                  aria-label={`${group.label} completed visits`}
                  max={Math.max(1, completed.completed)}
                  value={group.count}
                  className={PROGRESS_CLASS}
                />
                <strong className="text-right text-sm tabular-nums text-blue-900">
                  {group.count}
                </strong>
              </>
            );
            return breakdown === "barangay" ? (
              <details key={group.label} className="group">
                <summary className="grid min-h-14 cursor-pointer list-none grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_2rem] items-center gap-3 rounded-lg px-4 py-3 focus-visible:outline-2 focus-visible:outline-blue-600">
                  {line}
                </summary>
                <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-4">
                  <h4 className="text-xs font-semibold text-slate-600">
                    Sex and age at the time of the visit
                  </h4>
                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Male", "male"],
                      ["Female", "female"],
                      ["Other", "other"],
                      ["Unknown sex", "unknown"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="text-sm font-semibold">
                          {summarizeCompletedVisits(group.entries)[key]}
                        </dd>
                      </div>
                    ))}
                    {[...AGE_GROUPS, "Unknown"].map((age) => (
                      <div key={age}>
                        <dt className="text-xs text-slate-500">
                          {age === "Unknown" ? "Unknown age" : age}
                        </dt>
                        <dd className="text-sm font-semibold">
                          {
                            summarizeCompletedVisits(
                              group.entries.filter(
                                (entry) => ageLabel(entry) === age,
                              ),
                            ).completed
                          }
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ) : (
              <div
                key={group.label}
                className="grid min-h-14 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_2rem] items-center gap-3 px-4 py-3"
              >
                {line}
              </div>
            );
          })}
        </section>
        {emptyGroups.length > 0 && (
          <details className="rounded-xl border border-slate-200 p-4">
            <summary className="min-h-6 cursor-pointer text-sm font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-600">
              {emptyGroups.length} barangays with no completed visits
            </summary>
            <ul className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-3">
              {emptyGroups.map((group) => (
                <li key={group.label} className="flex justify-between gap-2">
                  <span>{group.label}</span>
                  <span>0</span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {completed.missing > 0 && (
          <p
            role="note"
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"
          >
            <Info size={17} className="shrink-0" aria-hidden="true" />
            <span>
              <strong>
                {completed.missing} visits need demographic review.
              </strong>{" "}
              These visits remain included. Some demographics are missing or the
              barangay is outside the report list.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function DoctorAnalyticsTab({ onBack, dailyEntry = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = dailyEntry
    ? "today"
    : PERIODS.find(({ value }) => value === searchParams.get("period"))
        ?.value || "today";
  const anchorDate = searchParams.get("date") || "";
  const [today, setToday] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [manualData, setManualData] = useState(emptyReport);
  const manualOpen = dailyEntry;
  const selectedDate = anchorDate || today;
  const [entryBarangay, setEntryBarangay] = useState(0);
  const [entryMeasure, setEntryMeasure] = useState(0);
  const [reportMeasure, setReportMeasure] = useState(0);
  const [reportTab, setReportTab] = useState("completed");
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
  const blocker = useBlocker(dirty || saving);
  const query = new URLSearchParams({
    period,
    ...(anchorDate ? { date: anchorDate } : {}),
  }).toString();

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (!saving && window.confirm("Discard unsaved barangay entries?")) {
      setDirty(false);
      blocker.proceed();
    } else blocker.reset();
  }, [blocker, saving]);

  useLiveData(useCallback(async (signal, background) => {
    if (!background) setLoading(true);
    try {
      const data = await api.get('/doctor/analytics?' + query, { signal });
      if (!signal.aborted) { setStats(data); setToday(data.report_date); setError(''); }
    } catch (err) { if (!signal.aborted) setError(err.message || 'Could not load analytics.'); }
    finally { if (!signal.aborted) setLoading(false); }
  }, [query]), true, retry);

  useLiveData(useCallback(async (signal, background) => {
    if (!background) { setManualLoading(true); setManualDate(''); }
    try {
      const response = await api.get('/doctor/daily-report?date=' + selectedDate, { signal });
      if (!signal.aborted) {
        setManualData(Array.isArray(response.data) ? response.data : emptyReport());
        setHasSavedRecord(Boolean(response.data)); setLegacyRecord(response.legacy ?? null);
        setManualDate(selectedDate); setManualError('');
      }
    } catch (err) { if (!signal.aborted) setManualError(err.message || 'Could not load your report.'); }
    finally { if (!signal.aborted) setManualLoading(false); }
  }, [selectedDate]), manualOpen && Boolean(selectedDate) && !dirty && !saving, manualRetry);

  useLiveData(useCallback(async (signal, background) => {
    if (!background) setReportLoading(true);
    try {
      const response = await api.get('/doctor/report?' + query, { signal });
      if (!signal.aborted) { setReport({ ...response, data: sumReports(response.reports) }); setReportError(''); }
    } catch (err) { if (!signal.aborted) setReportError(err.message || 'Could not load report.'); }
    finally { if (!signal.aborted) setReportLoading(false); }
  }, [query]), !manualOpen, reportRetry);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const selectPeriod = (value) => {
    if (value === period) return;
    setSearchParams((current) => {
      current.set("period", value);
      return current;
    });
    setStats(null);
    setReport(null);
    setLoading(true);
    setReportLoading(true);
    setError("");
    setReportError("");
  };
  const changeRange = (date) => {
    setSearchParams((current) => {
      if (date) current.set("date", date);
      else current.delete("date");
      return current;
    });
    setStats(null);
    setReport(null);
    setLoading(true);
    setReportLoading(true);
    setError("");
    setReportError("");
  };
  const changeCount = (barangayIndex, fieldIndex, value) => {
    setManualData((current) =>
      current.map((row, index) =>
        index === barangayIndex
          ? row.map((item, field) => (field === fieldIndex ? value : item))
          : row,
      ),
    );
    setDirty(true);
  };
  const saveReport = async (event) => {
    event.preventDefault();
    if (!dirty || saving || manualDate !== selectedDate) return;
    setSaving(true);
    setManualError("");
    try {
      await api.put("/doctor/daily-report", {
        date: selectedDate,
        data: manualData,
      });
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
    const blob = new Blob(
      [
        createDoctorReport(report.from, doctorName, report.data, {
          period,
          from: report.from,
          until: report.until,
          completed_demographics: completedRows,
        }),
      ],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dental-report-${period}-${report.from}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const doctorName = user?.display_name || "Doctor";
  const reportReady =
    Boolean(selectedDate) && manualDate === selectedDate && !manualLoading;
  const hasManualEntries = report?.data.some((row) =>
    row.some((value) => value !== null),
  );
  const completedRows = stats?.completed_demographics || [];
  const completed = summarizeCompletedVisits(completedRows);
  const exportReady = Boolean(
    !manualOpen &&
    stats &&
    report &&
    stats.from === report.from &&
    stats.until === report.until &&
    !loading &&
    !reportLoading &&
    !error &&
    !reportError &&
    !dirty &&
    (completed.completed || hasManualEntries),
  );
  const entryFields = measureFields(entryMeasure);
  const entryValues = entryFields.map(
    (field) => manualData[entryBarangay][field.index],
  );
  const periodInfo = PERIODS.find((item) => item.value === period);
  const reportTitle = `${period === "today" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly"} dental service report`;
  const range = stats || report;
  const lastDate = range?.until
    ? new Date(Date.parse(`${range.until}T00:00:00Z`) - 86400000)
        .toISOString()
        .slice(0, 10)
    : "";
  const rangeLabel = range?.from
    ? range.from === lastDate
      ? range.from
      : `${range.from} – ${lastDate}`
    : "";

  return (
    <>
      <main className="da-page w-full min-w-0 flex-1 space-y-4 px-3 py-5 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {!dailyEntry && (
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
                Dental services
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1a3a8f] sm:text-3xl">
              {dailyEntry ? "Daily barangay entries" : "Doctor Analytics"}
            </h1>
          </div>
          <button
            className={SECONDARY_BUTTON}
            type="button"
            onClick={() =>
              dailyEntry ? navigate(ROUTES.DOCTOR_ANALYTICS) : onBack()
            }
          >
            <ArrowLeft size={17} aria-hidden="true" />
            {dailyEntry ? "Back to analytics" : "Back to dashboard"}
          </button>
        </div>

        {!dailyEntry && (
          <>
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
              <div
                className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 lg:min-w-96"
                role="group"
                aria-label="Analytics period"
              >
                {PERIODS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={period === item.value}
                    onClick={() => selectPeriod(item.value)}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 sm:px-4 sm:text-sm ${period === item.value ? "bg-[#1e4db7] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
                  >
                    <item.icon
                      size={16}
                      className="hidden shrink-0 sm:block"
                      aria-hidden="true"
                    />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:min-w-80">
                <label className="grid min-w-0 gap-2 text-xs font-semibold text-slate-600">
                  {period === "monthly"
                    ? "Report month"
                    : period === "weekly"
                      ? "Week containing"
                      : "Report date"}
                  <input
                    className={INPUT_CLASS}
                    type={period === "monthly" ? "month" : "date"}
                    value={
                      period === "monthly"
                        ? (anchorDate || today).slice(0, 7)
                        : anchorDate || today
                    }
                    max={period === "monthly" ? today.slice(0, 7) : today}
                    disabled={!today}
                    onChange={(event) =>
                      changeRange(
                        period === "monthly" && event.target.value
                          ? `${event.target.value}-01`
                          : event.target.value,
                      )
                    }
                  />
                </label>
              </div>
            </div>
            {loading && (
              <p role="status" className="text-xs text-slate-500">
                Loading analytics…
              </p>
            )}
          </>
        )}
        {error && (
          <div
            className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <CircleAlert size={18} className="shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRetry((value) => value + 1);
              }}
              className="min-h-11 rounded-lg px-3 font-semibold underline focus-visible:outline-2 focus-visible:outline-red-600"
            >
              Retry
            </button>
          </div>
        )}

        {!dailyEntry && (
          <>
            {stats && (
              <>
                <section
                  aria-label="Dental activity summary"
                  className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
                  {METRICS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
                    >
                      <span className={`shrink-0 rounded-xl p-2 ${item.color}`}>
                        <item.icon size={21} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {stats[item.key] ?? 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>
                <details className="group rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                  <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-2 py-2 text-xs text-slate-500 focus-visible:outline-2 focus-visible:outline-blue-600">
                    <strong className="mr-2 text-sm text-slate-700">
                      More activity
                    </strong>
                    <span>
                      {period === "today" &&
                        `Waiting ${stats.waiting ?? 0} · Serving ${stats.serving ?? 0} · `}
                      Priority {stats.priority ?? 0}
                    </span>
                    <ChevronDown
                      size={17}
                      className="ml-auto shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="border-t border-slate-100 py-3 text-xs leading-relaxed text-slate-500">
                    Unique patients count each person once in the selected
                    period. Appointments and walk-ins count visits.{" "}
                    {period === "today" &&
                      "Waiting and serving show the current queue."}
                  </p>
                </details>
              </>
            )}

            <section
              aria-labelledby="da-period-report-title"
              className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2
                    id="da-period-report-title"
                    className="text-lg font-bold text-[#1a3a8f]"
                  >
                    {reportTitle}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {rangeLabel || periodInfo.description} · {doctorName}
                  </p>
                </div>
                <button
                  className={PRIMARY_BUTTON}
                  type="button"
                  disabled={!selectedDate}
                  onClick={() =>
                    navigate(
                      `${ROUTES.DOCTOR_DAILY_REPORT}?date=${anchorDate || today}`,
                    )
                  }
                >
                  <ClipboardPenLine size={17} aria-hidden="true" />
                  Daily barangay entries
                </button>
              </div>
              <div
                role="group"
                aria-label="Report view"
                className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 lg:max-w-xl"
              >
                {[
                  ["completed", "Completed visits"],
                  ["clinical", "Clinical counts"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={reportTab === key}
                    onClick={() => setReportTab(key)}
                    className={`min-h-11 rounded-lg px-2 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-blue-600 ${reportTab === key ? "bg-[#1e4db7] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {reportTab === "completed" ? (
                stats ? (
                  <CompletedBreakdown
                    rows={completedRows}
                    completed={completed}
                  />
                ) : (
                  <p className="py-4 text-sm text-slate-500">
                    {error
                      ? "Completed visits are unavailable. Retry loading analytics."
                      : "Loading completed visits…"}
                  </p>
                )
              ) : (
                <>
                  {reportLoading && (
                    <p role="status" className="text-sm text-slate-500">
                      Loading report…
                    </p>
                  )}
                  {report && !reportError && (
                    <ClinicalCountsReport
                      data={report.data}
                      measure={reportMeasure}
                      onMeasureChange={setReportMeasure}
                    />
                  )}
                </>
              )}
              {reportError && (
                <div
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  <CircleAlert
                    size={18}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1">{reportError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setReportLoading(true);
                      setReportRetry((value) => value + 1);
                    }}
                    className="min-h-11 rounded-lg px-3 font-semibold underline focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    Retry
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-xs leading-relaxed text-slate-500">
                  Full report includes all barangays and measures, regardless of
                  the current view.
                </p>
                <div className="grid grid-cols-2 gap-2 lg:flex">
                  <button
                    className={SECONDARY_BUTTON}
                    type="button"
                    disabled={!exportReady}
                    onClick={() => window.print()}
                  >
                    <Printer
                      size={17}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    Print report
                  </button>
                  <button
                    className={SECONDARY_BUTTON}
                    type="button"
                    disabled={!exportReady}
                    onClick={downloadReport}
                  >
                    <Download
                      size={17}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    Download Excel
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {dailyEntry && (
          <section aria-labelledby="da-manual-title" className="space-y-4">
            <h2 id="da-manual-title" className="sr-only">
              Manual clinical entries
            </h2>
            {manualLoading && (
              <p role="status" className="text-sm text-slate-500">
                Loading saved entries…
              </p>
            )}
            {manualError && (
              <div
                className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                <CircleAlert
                  size={18}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <p className="min-w-0 flex-1">{manualError}</p>
                {!reportReady && (
                  <button
                    type="button"
                    onClick={() => setManualRetry((value) => value + 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold underline focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                    Retry
                  </button>
                )}
              </div>
            )}
            {legacyRecord && (
              <details className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="min-h-6 cursor-pointer text-sm font-semibold text-slate-700">
                  Earlier unassigned totals for this date
                </summary>
                <p className="my-3 text-xs leading-relaxed text-slate-500">
                  These saved figures remain available. Assign them to barangays
                  manually if you know their source.
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {REPORT_GROUPS.map((group, index) => (
                    <div key={group} className="rounded-xl bg-slate-50 p-3">
                      <h3 className="text-xs font-semibold text-slate-700">
                        {group}
                      </h3>
                      <dl className="mt-3 grid grid-cols-3 gap-2">
                        {["Est. population", "Male", "Female"].map(
                          (label, field) => (
                            <div key={label}>
                              <dt className="text-xs text-slate-500">
                                {label}
                              </dt>
                              <dd className="text-sm font-semibold">
                                {legacyRecord.categories[index]?.[field] ?? "—"}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Pregnant BOHC: estimated population{" "}
                  {legacyRecord.pregnant?.[0] ?? "—"}; 10–14:{" "}
                  {legacyRecord.pregnant?.[1] ?? "—"}; 15–19:{" "}
                  {legacyRecord.pregnant?.[2] ?? "—"}; 20–49:{" "}
                  {legacyRecord.pregnant?.[3] ?? "—"}.
                </p>
              </details>
            )}
            <form
              onSubmit={saveReport}
              aria-label="Daily clinical entries"
              className="space-y-4"
            >
              <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-1">
                  <h3 className="text-sm font-semibold text-slate-900 sm:col-span-2 lg:col-span-1">
                    Entry details
                  </h3>
                  <div>
                    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
                      Entry date
                      <input
                        className={INPUT_CLASS}
                        type="date"
                        value={selectedDate}
                        max={today}
                        disabled={!today || dirty || saving}
                        onChange={(event) => {
                          changeRange(event.target.value);
                          setManualDate("");
                        }}
                      />
                    </label>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      Save changes before changing the date.
                    </p>
                  </div>
                  <div>
                    <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
                      Barangay
                      <select
                        className={INPUT_CLASS}
                        value={entryBarangay}
                        disabled={!reportReady || saving}
                        onChange={(event) =>
                          setEntryBarangay(Number(event.target.value))
                        }
                      >
                        {BARANGAYS.map((barangay, index) => (
                          <option key={barangay} value={index}>
                            {barangay}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div
                      role="group"
                      aria-label="Barangay navigation"
                      className="mt-2 grid grid-cols-2 gap-2"
                    >
                      <button
                        type="button"
                        aria-label="Previous barangay"
                        disabled={!reportReady || saving || entryBarangay === 0}
                        onClick={() =>
                          setEntryBarangay((index) => Math.max(0, index - 1))
                        }
                        className={SECONDARY_BUTTON}
                      >
                        <ChevronLeft
                          size={18}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        Previous
                      </button>
                      <button
                        type="button"
                        aria-label="Next barangay"
                        disabled={
                          !reportReady ||
                          saving ||
                          entryBarangay === BARANGAYS.length - 1
                        }
                        onClick={() =>
                          setEntryBarangay((index) =>
                            Math.min(BARANGAYS.length - 1, index + 1),
                          )
                        }
                        className={SECONDARY_BUTTON}
                      >
                        Next
                        <ChevronRight
                          size={18}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <MeasureSelect
                      value={entryMeasure}
                      onChange={setEntryMeasure}
                      disabled={!reportReady || saving}
                    />
                  </div>
                </div>
                <section
                  aria-labelledby="entry-measure-title"
                  className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div>
                    <p className="text-xs font-medium text-blue-700">
                      {BARANGAYS[entryBarangay]} ·{" "}
                      {selectedDate || "Loading date…"}
                    </p>
                    <h3
                      id="entry-measure-title"
                      className="mt-2 text-lg font-bold text-[#1a3a8f]"
                    >
                      {MEASURE_NAMES[entryMeasure]}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {measureDescription(entryMeasure)}.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {entryFields.map((field) => (
                      <label
                        key={field.index}
                        className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700"
                      >
                        {field.label}
                        <CountInput
                          label={`${BARANGAYS[entryBarangay]}, ${entryMeasure === REPORT_GROUPS.length ? "pregnant women" : REPORT_GROUPS[entryMeasure]}, ${field.label}`}
                          value={manualData[entryBarangay][field.index]}
                          onChange={(value) =>
                            changeCount(entryBarangay, field.index, value)
                          }
                          disabled={!reportReady || saving}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-blue-50 p-4">
                    <p className="text-xl font-bold text-blue-950 sm:text-2xl">
                      Total
                    </p>
                    <output
                      aria-label="Total for this measure"
                      className="text-3xl font-bold text-blue-950 sm:text-4xl"
                    >
                      {total(entryValues)}
                    </output>
                  </div>
                  <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                    <Info size={16} className="shrink-0" aria-hidden="true" />—
                    No entry · 0 Confirmed zero
                  </p>

                  <div
                    role="group"
                    aria-label="Clinical measure navigation"
                    className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:flex sm:justify-end"
                  >
                    <button
                      type="button"
                      aria-label="Previous clinical measure"
                      disabled={!reportReady || saving || entryMeasure === 0}
                      onClick={() =>
                        setEntryMeasure((index) => Math.max(0, index - 1))
                      }
                      className={SECONDARY_BUTTON}
                    >
                      <ChevronLeft
                        size={18}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        Previous
                        <span className="hidden sm:inline"> measure</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Next clinical measure"
                      disabled={
                        !reportReady ||
                        saving ||
                        entryMeasure === MEASURE_NAMES.length - 1
                      }
                      onClick={() =>
                        setEntryMeasure((index) =>
                          Math.min(MEASURE_NAMES.length - 1, index + 1),
                        )
                      }
                      className={SECONDARY_BUTTON}
                    >
                      <span>
                        Next<span className="hidden sm:inline"> measure</span>
                      </span>
                      <ChevronRight
                        size={18}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </section>
              </div>
              <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    role="status"
                    aria-label="Entry save status"
                    className={`flex items-center gap-2 text-sm font-semibold ${!reportReady ? "text-slate-500" : dirty ? "text-amber-800" : "text-emerald-800"}`}
                  >
                    {!reportReady ? (
                      <Info size={16} aria-hidden="true" />
                    ) : dirty ? (
                      <CircleAlert size={16} aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={16} aria-hidden="true" />
                    )}
                    {!reportReady
                      ? manualError
                        ? "Entries unavailable"
                        : "Loading entries…"
                      : dirty
                        ? "Unsaved changes"
                        : hasSavedRecord
                          ? "Saved for this date"
                          : "Ready for entries"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedDate} · Saves all edits for this date.
                  </p>
                </div>
                <button
                  className={`${PRIMARY_BUTTON} sm:min-w-44`}
                  type="submit"
                  disabled={!reportReady || !dirty || saving}
                >
                  <Save size={17} aria-hidden="true" />
                  {saving ? "Saving…" : "Save entries"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {exportReady && (
        <section id="doctor-report-print" aria-label="Printable dental report">
          <h1>{reportTitle}</h1>
          <p>
            {rangeLabel} · {doctorName} · Philippine time
          </p>
          <h2>Automatic completed visits · {completed.completed} visits</h2>
          <CompletedTable rows={completedRows} />
          <p>
            {completed.missing} visits need demographic review. Automatic visit
            totals are separate from manual clinical counts.
          </p>
          <h2>Manual clinical counts · page 1</h2>
          <ReportTable data={report.data} page={1} />
          <div className="da-print-page">
            <h1>{reportTitle} · page 2</h1>
            <p>
              {rangeLabel} · {doctorName}
            </p>
            <h2>Manual clinical counts</h2>
            <ReportTable data={report.data} page={2} />
          </div>
        </section>
      )}
    </>
  );
}
