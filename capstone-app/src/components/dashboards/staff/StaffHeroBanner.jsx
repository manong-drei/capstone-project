import { CalendarDays, Stethoscope } from "lucide-react";

export default function StaffHeroBanner({
  identity,
  doctorAvailable,
  doctorLeaveEnd,
}) {
  return (
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
        className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
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
              className={`h-2 w-2 rounded-full ${doctorAvailable === null ? "bg-slate-300" : doctorAvailable ? "bg-emerald-300" : "bg-amber-300"}`}
              aria-hidden="true"
            />
            {doctorLeaveEnd
              ? `Dentist on leave through ${new Date(`${doctorLeaveEnd}T00:00:00+08:00`).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium" })}`
              : doctorAvailable === null
                ? "Dentist availability unknown"
                : doctorAvailable
                  ? "Dentist available today"
                  : "Dentist unavailable today"}
          </p>
        </div>
      </div>
    </section>
  );
}
