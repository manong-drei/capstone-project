import useLiveData from "@/hooks/useLiveData";
import { lazy, Suspense, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  ChartPie,
  CheckCircle2,
  CircleAlert,
  HeartPulse,
  ListOrdered,
  MessageSquareWarning,
  Stethoscope,
  Users,
} from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/common/LoadingState";
import { ROUTES } from "@/constants/routes";
import api from "@/services/api";
import AdminLiveQueueMonitor from "./AdminLiveQueueMonitor";

const AgeDistributionChart = lazy(() => import("./AdminOverviewCharts").then(
  ({ AgeDistributionChart }) => ({ default: AgeDistributionChart }),
  () => ({ default: ChartUnavailable }),
));
const PatientVolumeChart = lazy(() => import("./AdminOverviewCharts").then(
  ({ PatientVolumeChart }) => ({ default: PatientVolumeChart }),
  () => ({ default: ChartUnavailable }),
));

const AGE_COLORS = [
  "#1e4db7",
  "#60a5fa",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#eab308",
  "#64748b",
];
const AGE_GROUPS = [
  "0–11 months",
  "1–4 years",
  "5–9 years",
  "10–14 years",
  "15–19 years",
  "20–59 years",
  "60+ years",
];
const panelClass =
  "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";
const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function buildVolumeData(rows, period) {
  const today = new Date();
  const sum = (start, end) =>
    rows.reduce(
      (total, row) =>
        total +
        (row.day >= dateKey(start) && row.day < dateKey(end)
          ? Number(row.count)
          : 0),
      0,
    );
  const count = period === "Monthly" ? 12 : period === "Weekly" ? 8 : 7;
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - ((today.getDay() + 6) % 7),
  );
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    const start =
      period === "Monthly"
        ? new Date(today.getFullYear(), today.getMonth() - offset, 1)
        : period === "Weekly"
          ? new Date(
              monday.getFullYear(),
              monday.getMonth(),
              monday.getDate() - offset * 7,
            )
          : new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() - offset,
            );
    const end =
      period === "Monthly"
        ? new Date(start.getFullYear(), start.getMonth() + 1, 1)
        : new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate() + (period === "Weekly" ? 7 : 1),
          );
    return {
      label: start.toLocaleDateString(
        "en-PH",
        period === "Monthly"
          ? { month: "short", year: "2-digit" }
          : { month: "short", day: "numeric" },
      ),
      count: sum(start, end),
    };
  });
}

const formatAppointmentDate = (value) =>
  value
    ? new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+08:00` : value,
      ).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
const formatAppointmentTime = (value) =>
  value
    ? new Date(`2000-01-01T${value}`).toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";
const formatDoctorName = (appt) => {
  const name = [
    appt.doctor_first_name,
    appt.doctor_middle_name,
    appt.doctor_last_name,
    appt.doctor_suffix,
  ]
    .filter(Boolean)
    .join(" ");
  return name ? `Dr. ${name}` : "—";
};
const formatServices = (appt) => {
  try {
    const raw = appt.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length) return parsed.join(", ");
  } catch {
    /* Fall back to the recorded appointment reason. */
  }
  return (
    appt.cancellation_reason ||
    (appt.reason === "Same-day queue registration" ? "—" : appt.reason) ||
    "—"
  );
};

export default function AdminOverviewTab({
  identity,
  overview,
  ovLoading,
  initialLoading,
  overviewError,
  onRetry,
  doctors,
  doctorsError,
  recentAppointments,
  apptLoading,
  appointmentsError,
  initialAppointmentsLoading,
}) {
  const [volumeTab, setVolumeTab] = useState("Monthly");
  const [attention, setAttention] = useState({ pending: null, failed: null });
  useLiveData(useCallback(async (signal) => {
    const [leaves, sms] = await Promise.allSettled([
      api.get('/admin/doctor-leaves', { signal }), api.get('/admin/sms-jobs', { signal }),
    ]);
    if (!signal.aborted) setAttention({
      pending: leaves.status === 'fulfilled' ? (leaves.value.requests ?? []).filter(row => row.status === 'pending').length : null,
      failed: sms.status === 'fulfilled' ? (sms.value.jobs ?? []).filter(row => row.is_failed && !row.reviewed_at).length : null,
    });
  }, []));

  const dentalAges = (overview?.dentalAgeGroups ?? [])
    .filter((row) => AGE_GROUPS.includes(row.age_group))
    .map((row) => ({
      name: row.age_group,
      value: Number(row.count),
      color: AGE_COLORS[AGE_GROUPS.indexOf(row.age_group)],
    }))
    .sort((a, b) => b.value - a.value);
  const dentalTotal = dentalAges.reduce((sum, row) => sum + row.value, 0);
  const volumeData = buildVolumeData(overview?.volumeDaily ?? [], volumeTab);
  const availableDoctors = doctors.filter(
    (doctor) => Number(doctor.is_available) && !doctor.leave_end,
  ).length;
  const value = (number) => (overview ? (number ?? 0).toLocaleString() : "—");

  return (
    <div className="space-y-4 sm:space-y-5">
      <section
        className="relative overflow-hidden rounded-2xl bg-cover bg-center p-6 text-white shadow-sm sm:p-8"
        style={{ backgroundImage: "url('/assets/BGHero.webp')" }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-black/40"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-blue-200">
              ADMIN DASHBOARD · E-KALUSUGAN
            </p>
            <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome, {identity.displayName}.
            </h1>
          </div>
          <div className="space-y-3 text-xs">
            <p className="flex items-center gap-2 text-blue-100">
              <CalendarDays size={16} aria-hidden="true" />
              {new Date().toLocaleDateString("en-PH", {
                timeZone: "Asia/Manila",
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 font-medium">
              <Stethoscope size={16} aria-hidden="true" />
              <span
                className={`h-2 w-2 rounded-full ${availableDoctors ? "bg-emerald-300" : "bg-amber-300"}`}
                aria-hidden="true"
              />
              {doctorsError
                ? "Doctor availability unavailable"
                : `${availableDoctors} doctor${availableDoctors === 1 ? "" : "s"} available today`}
            </p>
          </div>
        </div>
      </section>

      <div>
        <h2 className="text-lg font-bold text-[#1a3a8f]">Dashboard overview</h2>
        <p className="mt-1 text-xs text-slate-500">Health center totals</p>
      </div>
      {overviewError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p>
            {overviewError} {overview && "Showing the last successful update."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 font-semibold underline"
          >
            Retry dashboard
          </button>
        </div>
      )}
      <section
        aria-label="Health center totals"
        aria-busy={ovLoading}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          {
            label: "Total Patient Visits",
            count: overview?.totalPatients,
            icon: Users,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Active Doctors",
            count: overview?.totalDoctors,
            icon: Stethoscope,
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "Total Appointments",
            count: overview?.totalAppointments,
            icon: CalendarDays,
            color: "bg-orange-50 text-orange-700",
          },
          {
            label: "Total Queues Completed",
            count: overview?.completedQueues,
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <span className={`rounded-xl p-2.5 ${item.color}`}>
              <item.icon size={21} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {initialLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  value(item.count)
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:gap-5">
        <AdminLiveQueueMonitor />
        <div className="min-w-0 space-y-4">
          <section className={panelClass} aria-labelledby="today-queue-heading">
            <h3
              id="today-queue-heading"
              className="flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <ListOrdered
                size={18}
                className="text-blue-700"
                aria-hidden="true"
              />
              Queues today
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4" aria-busy={ovLoading}>
              {[
                {
                  label: "Waiting",
                  count: overview?.waiting,
                  icon: Users,
                  color: "text-blue-700",
                },
                {
                  label: "Serving",
                  count: overview?.serving,
                  icon: HeartPulse,
                  color: "text-violet-700",
                },
                {
                  label: "Completed",
                  count: overview?.doneToday,
                  icon: CheckCircle2,
                  color: "text-emerald-700",
                },
                {
                  label: "Cancelled",
                  count: overview?.cancelled,
                  icon: CircleAlert,
                  color: "text-rose-700",
                },
              ].map((item) => (
                <div key={item.label} className="min-w-0">
                  <p
                    className={`flex items-center gap-2 text-xs ${item.color}`}
                  >
                    <item.icon size={15} aria-hidden="true" />
                    {item.label}
                  </p>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {initialLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      value(item.count)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className={panelClass} aria-labelledby="attention-heading">
            <h3
              id="attention-heading"
              className="flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <CircleAlert
                size={18}
                className="text-blue-700"
                aria-hidden="true"
              />
              Needs attention
            </h3>
            <div className="mt-4 divide-y divide-slate-100">
              <div className="flex items-center gap-3 pb-3">
                <span className="rounded-xl bg-orange-50 p-2.5 text-orange-700">
                  <CalendarClock size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {attention.pending === null
                      ? "Leave requests"
                      : `${attention.pending} pending leave request${attention.pending === 1 ? "" : "s"}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Doctor leave approvals
                  </p>
                </div>
                <Link
                  to={ROUTES.ADMIN_LEAVE_REQUESTS}
                  className="py-2 text-xs font-semibold text-blue-700 underline-offset-4 hover:underline"
                >
                  Review
                </Link>
              </div>
              <div className="flex items-center gap-3 pt-3">
                <span className="rounded-xl bg-orange-50 p-2.5 text-orange-700">
                  <MessageSquareWarning size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {attention.failed
                      ? `${attention.failed} recent SMS failure${attention.failed === 1 ? "" : "s"}`
                      : "Recent SMS failures"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Notification delivery status
                  </p>
                </div>
                <Link
                  to={`${ROUTES.ADMIN_NOTIFICATIONS}?view=failures`}
                  className="py-2 text-xs font-semibold text-blue-700 underline-offset-4 hover:underline"
                >
                  View
                </Link>
              </div>
            </div>
          </section>
          <section
            className={panelClass}
            aria-labelledby="age-distribution-heading"
          >
            <h3
              id="age-distribution-heading"
              className="flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <ChartPie size={18} className="text-blue-700" aria-hidden="true" />
              Dental Queues by Age Group
            </h3>
            <p className="mb-4 mt-1 text-xs text-slate-500">
              Dental queues with a recorded age group · most common:{" "}
              {dentalAges[0]?.name ?? "—"}
            </p>
            <div className="min-h-[150px]" aria-busy={ovLoading}>
              {initialLoading ? (
                <AgeChartSkeleton />
              ) : !overview ? (
                <p className="py-10 text-sm text-slate-500">
                  Age group data is unavailable.
                </p>
              ) : dentalTotal === 0 ? (
                <p className="py-10 text-sm text-slate-500">
                  No dental queues with a recorded age group.
                </p>
              ) : (
                <div className="grid items-center gap-4 min-[480px]:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
                  <Suspense fallback={<AgeChartSkeleton />}>
                    <AgeDistributionChart dentalAges={dentalAges} dentalTotal={dentalTotal} />
                  </Suspense>
                  <ul className="min-w-0 space-y-2 text-xs">
                    {dentalAges.map((row) => (
                      <li
                        key={row.name}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: row.color }}
                          aria-hidden="true"
                        />
                        <span className="flex-1 text-slate-600">{row.name}</span>
                        <span className="font-semibold tabular-nums text-slate-800">
                          {row.value.toLocaleString()} (
                          {((row.value / dentalTotal) * 100).toFixed(1)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <section
        className={panelClass}
        aria-labelledby="patient-volume-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3
            id="patient-volume-heading"
            className="flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            <BarChart3
              size={18}
              className="text-blue-700"
              aria-hidden="true"
            />
            Patient Volume
          </h3>
          <div
            role="group"
            aria-label="Patient volume period"
            className="flex gap-1 rounded-lg bg-slate-100 p-1"
          >
            {["Monthly", "Weekly", "Daily"].map((period) => (
              <button
                key={period}
                type="button"
                aria-pressed={volumeTab === period}
                onClick={() => setVolumeTab(period)}
                className={`min-h-9 cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${volumeTab === period ? "bg-[#1a3a8f] text-white" : "text-slate-500 hover:bg-blue-50"}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-4 mt-2 text-xs text-slate-500">
          All queue visits · last{" "}
          {volumeTab === "Monthly"
            ? "12 months"
            : volumeTab === "Weekly"
              ? "8 weeks"
              : "7 days"}
        </p>
        <div className="h-[250px] min-w-0 sm:h-[320px] xl:h-[360px]" aria-busy={ovLoading}>
          {initialLoading ? (
            <VolumeChartSkeleton />
          ) : !overview ? (
            <p className="py-10 text-sm text-slate-500">
              Patient volume data is unavailable.
            </p>
          ) : (
            <Suspense fallback={<VolumeChartSkeleton />}>
              <PatientVolumeChart volumeTab={volumeTab} volumeData={volumeData} />
            </Suspense>
          )}
        </div>
      </section>

      <section
        className={panelClass}
        aria-labelledby="recent-appointments-heading"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3
            id="recent-appointments-heading"
            className="flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            <CalendarDays
              size={18}
              className="text-blue-700"
              aria-hidden="true"
            />
            Recent appointments
          </h3>
          <Link
            to={ROUTES.ADMIN_PATIENT_HISTORY}
            className="py-2 text-xs font-semibold text-blue-700 underline-offset-4 hover:underline"
          >
            View patient history
          </Link>
        </div>
        {initialAppointmentsLoading ? (
          <div role="status" aria-busy="true" className="space-y-3">
            <span className="sr-only">Loading recent history…</span>
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        ) : appointmentsError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-red-700"
          >
            <p>{appointmentsError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 font-semibold underline"
            >
              Retry appointments
            </button>
          </div>
        ) : apptLoading ? (
          <p className="text-sm text-slate-500">Loading recent history…</p>
        ) : recentAppointments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No appointments recorded yet.
          </p>
        ) : (
          <>
            <div className="ad-hide-on-mobile overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    {[
                      "Patient",
                      "Date",
                      "Time",
                      "Doctor",
                      "Service",
                      "Status",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="px-3 py-3 font-medium"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.map((appt) => (
                    <tr key={appt.appointment_id}>
                      <td className="px-3 py-3 font-medium">
                        {appt.patient_full_name || "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {formatAppointmentDate(appt.appointment_date)}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {formatAppointmentTime(appt.appointment_time)}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {formatDoctorName(appt)}
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {formatServices(appt)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="ad-show-on-mobile">
              {recentAppointments.map((appt) => (
                <li
                  key={appt.appointment_id}
                  className="space-y-2 border-b border-slate-100 py-3 last:border-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="break-words text-sm font-semibold">
                      {appt.patient_full_name || "—"}
                    </p>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDoctorName(appt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatServices(appt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatAppointmentDate(appt.appointment_date)} ·{" "}
                    {formatAppointmentTime(appt.appointment_time)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function ChartUnavailable() {
  return (
    <p role="status" className="grid min-h-40 place-items-center text-sm text-slate-500">
      Chart could not load. Reload the page to try again.
    </p>
  );
}

function AgeChartSkeleton() {
  return (
    <div role="status" className="grid min-h-40 w-full max-w-40 place-items-center justify-self-center">
      <span className="sr-only">Loading age groups…</span>
      <Skeleton className="mx-auto h-32 w-32 rounded-full" />
    </div>
  );
}

function VolumeChartSkeleton() {
  return (
    <div
      role="status"
      className="flex h-full items-end justify-around gap-3 border-b border-slate-200 px-4 pb-6"
    >
      <span className="sr-only">Loading patient volume…</span>
      {["h-1/3", "h-2/3", "h-1/2", "h-4/5", "h-3/5", "h-2/5"].map(
        (height) => (
          <Skeleton key={height} className={`w-6 ${height}`} />
        ),
      )}
    </div>
  );
}
