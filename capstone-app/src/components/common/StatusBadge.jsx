import { BadgeCheck, CalendarOff, CheckCheck, CircleCheck, CircleHelp, CircleX, Clock3, Hourglass, Megaphone, PhoneMissed, Stethoscope, UserRoundX } from "lucide-react";

const STATUS_VARIANTS = {
  available: { label: "Available", icon: CircleCheck, classes: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  unavailable: { label: "Unavailable", icon: CircleX, classes: "border-red-200 bg-red-50 text-red-700" },
  on_leave: { label: "On Leave", icon: CalendarOff, classes: "border-dashed border-slate-300 bg-slate-50 text-slate-600" },
  done: { label: "Done", icon: CheckCheck, classes: "border-emerald-300 bg-emerald-100 text-emerald-800" },
  completed: { label: "Completed", icon: CheckCheck, classes: "border-emerald-300 bg-emerald-100 text-emerald-800" },
  confirmed: { label: "Confirmed", icon: BadgeCheck, classes: "border-teal-200 bg-teal-50 text-teal-800" },
  pending: { label: "Pending", icon: Clock3, classes: "border-amber-300 bg-amber-50 text-amber-800" },
  waiting: { label: "Waiting", icon: Hourglass, classes: "border-sky-200 bg-sky-50 text-sky-800" },
  called: { label: "Called", icon: Megaphone, classes: "border-violet-300 bg-violet-100 text-violet-800" },
  serving: { label: "Serving", icon: Stethoscope, classes: "border-blue-700 bg-blue-600 text-white shadow-sm" },
  missed: { label: "Missed call", icon: PhoneMissed, classes: "border-orange-300 bg-orange-50 text-orange-800" },
  no_show: { label: "No-show", icon: UserRoundX, classes: "border-red-300 bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", icon: CircleX, classes: "border-slate-300 bg-slate-100 text-slate-600" },
};

export default function StatusBadge({ status }) {
  const normalized = String(status ?? "").trim().toLowerCase().replace(/[ -]+/g, "_");
  // The API uses "cancelled"; accept the alternate spelling for display compatibility.
  const key = normalized === "canceled" ? "cancelled" : normalized;
  const { label, icon: Icon, classes } = Object.hasOwn(STATUS_VARIANTS, key)
    ? STATUS_VARIANTS[key]
    : {
      label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1).replaceAll("_", " ") : "—",
      icon: CircleHelp,
      classes: "border-slate-200 bg-slate-50 text-slate-600",
    };

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none align-middle ${classes}`}
    >
      <Icon size={13} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
