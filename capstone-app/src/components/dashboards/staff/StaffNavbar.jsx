import { CircleHelp, ListOrdered, UserPlus } from "lucide-react";
import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";

export default function StaffNavbar({ identity, onLogout }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7] text-white shadow-sm">
      <nav aria-label="Staff navigation" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#" aria-label="E-KALUSUGAN staff dashboard" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-white">
          <img src="/assets/Logo.jpg" alt="" className="h-9 w-9 rounded-full border-2 border-white/40 object-cover" />
          <span className="hidden text-sm font-bold tracking-wide sm:block">E-KALUSUGAN</span>
        </a>
        <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
          <a href="#dental-queue" className="hidden items-center gap-2 rounded-lg p-2.5 text-xs font-medium transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white sm:inline-flex"><ListOrdered size={17} aria-hidden="true" /><span className="sr-only md:not-sr-only">Dental queue</span></a>
          <a href="#walk-in-registration" className="hidden items-center gap-2 rounded-lg p-2.5 text-xs font-medium transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white sm:inline-flex"><UserPlus size={17} aria-hidden="true" /><span className="sr-only md:not-sr-only">Register walk-in</span></a>
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-2.5 text-xs font-medium hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"><CircleHelp size={17} aria-hidden="true" /><span className="sr-only lg:not-sr-only">Staff guide</span></summary>
            <div className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600 shadow-xl">
              <p className="mb-2 font-semibold text-slate-900">Dental staff guide</p>
              <p>Find or register a patient, confirm their contact number, and select up to two dental services.</p>
              <p className="mt-2">Call the next patient when the chair is free. Confirm presence, or call again after 30 seconds and wait another 30 seconds before skipping. Missed patients have 10 minutes to report to staff and keep their ticket. Record cancellation reasons and relay the SMS instructions shown after registration.</p>
            </div>
          </details>
          <DashboardProfileMenu identity={identity} onLogout={onLogout} accentColor="#f97316" chipBg="rgba(255,255,255,0.12)" chipBorder="rgba(255,255,255,0.2)" chipTextColor="#ffffff" subtitleColor="rgba(255,255,255,0.75)" />
        </div>
      </nav>
    </header>
  );
}
