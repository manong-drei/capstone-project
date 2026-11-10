import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ClipboardPenLine,
  HeartPulse,
  ListOrdered,
  LoaderCircle,
  Megaphone,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { getQueueDisplayName } from "@/utils/queueDisplay";
import QueueRecovery from "@/components/common/QueueRecovery";
import { DashboardSkeleton } from "@/components/common/LoadingState";
import { generatePath, Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export default function DoctorHomeTab({
  identity,
  initialLoading,
  isAvailable,
  approvedLeave,
  availLoading,
  onToggleAvailability,
  onRequestLeave,
  capacityCollapsed,
  setCapacityCollapsed,
  appointmentLimit,
  setAppointmentLimit,
  walkInLimit,
  setWalkInLimit,
  bookedCount,
  walkInCount,
  walkInPercent,
  apptPercent,
  apptFull,
  settingsLoading,
  settingsSaved,
  onApplySettings,
  waiting,
  serving,
  doneQueues,
  servingQueue,
  nextQueue,
  done,
  priority,
  queueLoading,
  onMarkDone,
  onConsult,
  calledQueue,
  missedQueues,
  onQueueAction,
  error,
}) {
  const currentQueue = servingQueue || calledQueue;
  const leaveEnd =
    approvedLeave &&
    new Date(`${approvedLeave.end_date}T00:00:00+08:00`).toLocaleDateString(
      "en-PH",
      { timeZone: "Asia/Manila", dateStyle: "medium" },
    );
  const stats = [
    {
      label: "Waiting",
      value: waiting.length,
      icon: Users,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Serving",
      value: serving.length,
      icon: HeartPulse,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Completed",
      value: done,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Priority",
      value: priority,
      icon: ShieldCheck,
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section
        className="relative overflow-hidden rounded-2xl bg-cover bg-center bg-no-repeat p-6 text-white shadow-sm sm:p-8"
        style={{ backgroundImage: "url('/assets/BGHero.webp')" }}
      >
        {/* Dark overlay for text readability */}
        <div
          className="pointer-events-none absolute inset-0 bg-black/40"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-40 border-white/5"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold tracking-widest text-blue-200">
              DOCTOR DASHBOARD · DENTAL SERVICES
            </p>
            <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome, {identity.displayName}.
            </h1>
          </div>
          <div className="space-y-3 text-xs">
            <p className="flex items-center gap-2 text-blue-100">
              <CalendarDays size={16} className="shrink-0" aria-hidden="true" />
              {new Date().toLocaleDateString("en-PH", {
                timeZone: "Asia/Manila",
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 font-medium">
              <Stethoscope size={16} className="shrink-0" aria-hidden="true" />
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${!initialLoading && isAvailable && !approvedLeave ? "bg-emerald-300" : "bg-amber-300"}`}
                aria-hidden="true"
              />
              {initialLoading
                ? "Checking availability…"
                : approvedLeave
                  ? `On leave through ${leaveEnd}`
                  : isAvailable
                    ? "Available today"
                    : "Unavailable today"}
            </p>
          </div>
        </div>
      </section>
      {initialLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div>
            <h2 className="text-lg font-bold text-[#1a3a8f]">
              Dental queue management
            </h2>
          </div>
          <section
            aria-label="Today's dental queue summary"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <span className={`rounded-xl p-3 ${stat.color}`}>
                  <stat.icon size={21} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </section>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p>{error} Displayed queue information may be outdated.</p>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:gap-8">
            <div className="min-w-0 space-y-4">
              <section
                aria-labelledby="doctor-queue-title"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <h3
                    id="doctor-queue-title"
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <ListOrdered
                      size={18}
                      className="text-blue-700"
                      aria-hidden="true"
                    />
                    Dental queue
                  </h3>
                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {waiting.length} waiting
                  </span>
                </div>
                <div className="m-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-center text-white sm:m-5">
                  <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-orange-100">
                    <Megaphone
                      size={16}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    {calledQueue ? "Called — awaiting patient" : "Now serving"}
                  </p>
                  <p className="my-3 break-words text-5xl font-bold tracking-tight">
                    {currentQueue?.queue_number || "—"}
                  </p>
                  {currentQueue ? (
                    <>
                      <p className="break-words text-sm font-medium">
                        {currentQueue.patient_id ? (
                          <Link
                            to={generatePath(ROUTES.DOCTOR_PATIENT_PROFILE, {
                              id: String(currentQueue.patient_id),
                            })}
                            className="underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-white"
                          >
                            {getQueueDisplayName(currentQueue)}
                          </Link>
                        ) : (
                          getQueueDisplayName(currentQueue)
                        )}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                        {currentQueue.type === "priority" && (
                          <ShieldCheck size={13} aria-hidden="true" />
                        )}
                        {currentQueue.type === "priority"
                          ? "Priority"
                          : "Regular"}
                      </span>
                    </>
                  ) : (
                    <p className="text-sm text-orange-100">
                      No patient is currently being served.
                    </p>
                  )}
                </div>
                <div className="px-4 pb-5 sm:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {servingQueue && (
                      <button
                        type="button"
                        onClick={() => onConsult(servingQueue)}
                        disabled={queueLoading}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1e4db7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        <Stethoscope
                          size={18}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        Consultation Remarks
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onMarkDone(servingQueue?.id)}
                      disabled={
                        !!calledQueue ||
                        (!servingQueue && !waiting.length) ||
                        queueLoading
                      }
                      aria-busy={queueLoading}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      <CheckCircle2
                        size={18}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                      {calledQueue
                        ? "Awaiting patient"
                        : servingQueue
                          ? "Mark as Complete"
                          : "Call next patient"}
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
                    {calledQueue
                      ? "Confirm the patient is here before starting the consultation."
                      : servingQueue
                        ? nextQueue
                          ? `Marking this visit complete will call ${nextQueue.queue_number}.`
                          : "Mark this visit complete. No patients are waiting to be called."
                        : nextQueue
                          ? `Ready to call ${nextQueue.queue_number}.`
                          : "No patients are waiting to be called."}
                  </p>
                </div>
              </section>

              <QueueRecovery
                called={calledQueue}
                missed={missedQueues}
                onAction={onQueueAction}
                loading={queueLoading}
                presentLabel="Start consultation"
              />

              <section
                aria-labelledby="doctor-next-title"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                  <Clock3
                    size={18}
                    className="text-blue-700"
                    aria-hidden="true"
                  />
                  <h3
                    id="doctor-next-title"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Up next
                  </h3>
                  <span className="ml-auto text-xs text-slate-500">
                    Serving order
                  </span>
                </div>
                {!waiting.length ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    No queues waiting.
                  </p>
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {waiting.slice(0, 8).map((queue, index) => (
                      <li
                        key={queue.id}
                        className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${index === 0 ? "bg-blue-50/60" : ""}`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${index === 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-bold text-[#1a3a8f]">
                            {queue.queue_number}
                          </p>
                          <p className="break-words text-xs text-slate-600">
                            {queue.patient_id ? (
                              <Link
                                to={generatePath(
                                  ROUTES.DOCTOR_PATIENT_PROFILE,
                                  {
                                    id: String(queue.patient_id),
                                  },
                                )}
                                className="underline-offset-4 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                              >
                                {getQueueDisplayName(queue)}
                              </Link>
                            ) : (
                              getQueueDisplayName(queue)
                            )}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${queue.type === "priority" ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {queue.type === "priority" ? "Priority" : "Regular"}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <div className="min-w-0 space-y-4">
              <section
                aria-labelledby="doctor-availability-title"
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <h3
                    id="doctor-availability-title"
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                  >
                    <CalendarDays
                      size={18}
                      className="shrink-0 text-blue-700"
                      aria-hidden="true"
                    />
                    Today's availability
                  </h3>
                  <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isAvailable && !approvedLeave ? "bg-emerald-500" : "bg-amber-500"}`}
                      aria-hidden="true"
                    />
                    {approvedLeave
                      ? `On approved leave through ${leaveEnd}`
                      : isAvailable
                        ? "You are currently marked as available"
                        : "You are currently marked as unavailable"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    !availLoading && onToggleAvailability(!isAvailable)
                  }
                  disabled={availLoading || !!approvedLeave}
                  className={`min-h-11 shrink-0 rounded-xl border-2 px-4 py-2 text-xs font-bold shadow-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 ${
                    isAvailable && !approvedLeave
                      ? "border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-800"
                      : "border-amber-600 bg-amber-400 text-amber-950 hover:bg-amber-300"
                  }`}
                >
                  {approvedLeave
                    ? "On leave"
                    : availLoading
                      ? "Saving..."
                      : isAvailable
                        ? "Available"
                        : "Unavailable"}
                </button>
                <div className="w-full border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={onRequestLeave}
                    aria-haspopup="dialog"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                  >
                    <CalendarPlus size={18} aria-hidden="true" />
                    Request leave
                  </button>
                </div>
              </section>

              <section
                aria-label="Daily capacity"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setCapacityCollapsed((value) => !value)}
                  aria-expanded={!capacityCollapsed}
                  aria-controls="doctor-capacity-fields"
                  className="flex min-h-11 w-full items-center justify-between gap-3 p-5 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                >
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <CalendarDays
                        size={18}
                        className="text-blue-700"
                        aria-hidden="true"
                      />
                      Daily capacity
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-blue-800 transition-transform ${capacityCollapsed ? "" : "rotate-180"}`}
                    aria-hidden="true"
                  />
                </button>
                {!capacityCollapsed && (
                  <div
                    id="doctor-capacity-fields"
                    className="space-y-5 border-t border-slate-100 p-5"
                  >
                    <div>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor="doctor-appointment-limit"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Appointment Limit
                        </label>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointmentLimit === 10 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}
                        >
                          {appointmentLimit === 10
                            ? "Maximum (10)"
                            : `${appointmentLimit} / 10`}
                        </span>
                      </div>
                      <input
                        id="doctor-appointment-limit"
                        type="range"
                        min={0}
                        max={10}
                        value={appointmentLimit}
                        onChange={(event) =>
                          setAppointmentLimit(parseInt(event.target.value))
                        }
                        className="min-h-8 w-full cursor-pointer accent-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
                      />
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>0</span>
                        <span>10 (max)</span>
                      </div>
                      <div className="mt-3 flex justify-between gap-3 text-xs text-slate-500">
                        <span>Appointments today</span>
                        <span className="font-semibold text-slate-900">
                          {bookedCount} /{" "}
                          {appointmentLimit > 0 ? appointmentLimit : "—"}
                        </span>
                      </div>
                      <progress
                        aria-label="Appointment capacity used"
                        max={100}
                        value={apptPercent}
                        className={`mt-2 block h-2 w-full overflow-hidden rounded-full bg-slate-100 [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full ${apptPercent >= 100 ? "[&::-moz-progress-bar]:bg-red-500 [&::-webkit-progress-value]:bg-red-500" : apptPercent >= 80 ? "[&::-moz-progress-bar]:bg-orange-500 [&::-webkit-progress-value]:bg-orange-500" : "[&::-moz-progress-bar]:bg-emerald-500 [&::-webkit-progress-value]:bg-emerald-500"}`}
                      />
                      {apptFull && (
                        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold leading-relaxed text-red-700">
                          SLOTS FULL — No more appointments can be booked today
                        </p>
                      )}
                    </div>
                    <div className="border-t border-slate-100 pt-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor="doctor-walk-in-limit"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Walk-In Capacity
                        </label>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${walkInLimit > 0 ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {walkInLimit > 0 ? `${walkInLimit} slots` : "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id="doctor-walk-in-limit"
                          type="number"
                          min={0}
                          max={30}
                          placeholder="0"
                          value={walkInLimit === 0 ? "" : walkInLimit}
                          onChange={(event) =>
                            setWalkInLimit(
                              Math.min(
                                30,
                                Math.max(0, parseInt(event.target.value) || 0),
                              ),
                            )
                          }
                          aria-describedby="doctor-walk-in-hint"
                          className="min-h-11 w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:border-blue-600 focus:outline-2 focus:outline-blue-600"
                        />
                        <span
                          id="doctor-walk-in-hint"
                          className="text-xs text-slate-500"
                        >
                          0–30 patients
                        </span>
                      </div>
                      <div className="mt-3 flex justify-between gap-3 text-xs text-slate-500">
                        <span>Walk-ins today</span>
                        <span className="font-semibold text-slate-900">
                          {walkInCount} / {walkInLimit > 0 ? walkInLimit : "—"}
                        </span>
                      </div>
                      <progress
                        aria-label="Walk-in capacity used"
                        max={100}
                        value={walkInPercent}
                        className={`mt-2 block h-2 w-full overflow-hidden rounded-full bg-slate-100 [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full ${walkInPercent >= 100 ? "[&::-moz-progress-bar]:bg-red-500 [&::-webkit-progress-value]:bg-red-500" : walkInPercent >= 80 ? "[&::-moz-progress-bar]:bg-orange-500 [&::-webkit-progress-value]:bg-orange-500" : "[&::-moz-progress-bar]:bg-emerald-500 [&::-webkit-progress-value]:bg-emerald-500"}`}
                      />
                      {walkInLimit > 0 && walkInCount >= walkInLimit && (
                        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold leading-relaxed text-red-700">
                          SLOTS FULL — No more walk-ins can be accepted today
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onApplySettings}
                      disabled={settingsLoading}
                      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${settingsSaved ? "bg-emerald-600" : "bg-[#1e4db7] hover:bg-blue-800"}`}
                    >
                      {settingsLoading && (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      {settingsLoading
                        ? "Saving..."
                        : settingsSaved
                          ? "Saved ✓"
                          : "Apply"}
                    </button>
                  </div>
                )}
              </section>

              <section
                aria-labelledby="doctor-completed-title"
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600"
                    aria-hidden="true"
                  />
                  <h3
                    id="doctor-completed-title"
                    className="text-sm font-semibold text-slate-900"
                  >
                    Completed today
                  </h3>
                  <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {done} {done === 1 ? "patient" : "patients"}
                  </span>
                </div>
                {!doneQueues.length ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">
                    No completed patients yet.
                  </p>
                ) : (
                  <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                    {doneQueues.map((queue) => (
                      <li
                        key={queue.id}
                        className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5"
                      >
                        <span className="max-w-full break-words rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                          {queue.queue_number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold text-slate-900">
                            {getQueueDisplayName(queue)}
                          </p>
                          <p className="mt-1 break-words text-xs leading-relaxed text-slate-500">
                            {queue.updated_at && (
                              <>
                                {new Date(queue.updated_at).toLocaleTimeString(
                                  "en-PH",
                                  {
                                    timeZone: "Asia/Manila",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )}
                                {" · "}
                              </>
                            )}
                            {Array.isArray(queue.services) &&
                            queue.services.length > 0
                              ? queue.services.join(", ")
                              : "—"}
                          </p>
                        </div>
                        {!queue.has_consultation && (
                          <button
                            type="button"
                            onClick={() => onConsult(queue)}
                            disabled={queueLoading}
                            aria-label={`Add remarks for ${queue.queue_number}`}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
                          >
                            <ClipboardPenLine size={15} aria-hidden="true" />
                            Add remarks
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
          <p className="flex items-center justify-center gap-2 pb-2 text-xs text-slate-600">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${error ? "bg-amber-500" : "bg-emerald-500"}`}
              aria-hidden="true"
            />
            {error ? "Refresh unavailable" : "Auto-refresh every 5 seconds"}
          </p>
        </>
      )}
    </main>
  );
}
