import { useId } from "react";

export default function ProfileCard({ name, initials, eyebrow, badge, secondaryBadge, action, headerAction, className = "", children }) {
  const nameId = useId();

  return (
    <section aria-labelledby={nameId} className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className={`grid items-start gap-x-3 gap-y-2 p-3 sm:gap-x-5 sm:p-5 lg:p-6 ${headerAction ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_minmax(0,1fr)]"}`}>
        <div aria-hidden="true" className="row-span-2 grid size-11 place-items-center rounded-full bg-blue-100 text-lg font-bold text-[#1a3a8f] sm:size-16 sm:self-center sm:text-2xl">{initials}</div>
        <div className="col-start-2 row-start-1 min-w-0">
          {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">{eyebrow}</p>}
          <div className="flex items-center gap-2">
            <h2 id={nameId} className="min-w-0 text-lg font-bold leading-snug text-slate-900 wrap-anywhere sm:text-3xl">{name}</h2>
            {action}
          </div>
        </div>
        {headerAction && <div className="col-start-3 row-start-1 justify-self-end">{headerAction}</div>}
        <div className="col-start-2 col-end-[-1] row-start-2 flex flex-wrap gap-1.5">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{badge}</span>
          {secondaryBadge}
        </div>
      </div>
      {children}
    </section>
  );
}
