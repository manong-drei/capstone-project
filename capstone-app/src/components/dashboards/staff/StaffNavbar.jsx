import { CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";
import { ROUTES } from "@/constants/routes";

export default function StaffNavbar({ identity, onLogout, onHelp }) {
  const dashboardPath =
    {
      doctor: ROUTES.DOCTOR_DASHBOARD,
      staff: ROUTES.STAFF_DASHBOARD,
      admin: ROUTES.ADMIN_DASHBOARD,
    }[identity.role] || ROUTES.STAFF_DASHBOARD;
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7] text-white shadow-sm">
      <nav
        aria-label={`${identity.roleLabel} navigation`}
        className="flex h-16 w-full items-center justify-between gap-3 px-2 sm:px-3"
      >
        <Link
          to={dashboardPath}
          aria-label={`E-KALUSUGAN ${identity.role} dashboard`}
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-white"
        >
          <img
            src="/assets/Logo.jpg"
            alt=""
            className="h-9 w-9 rounded-full border-2 border-white/40 object-cover"
          />
          <span className="hidden text-sm font-bold tracking-wide sm:block">
            E-KALUSUGAN
          </span>
        </Link>
        <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onHelp}
            aria-label="Help"
            className="flex cursor-pointer items-center gap-2 rounded-lg p-2.5 text-xs font-medium hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
          >
            <CircleHelp size={17} aria-hidden="true" />
            <span className="sr-only lg:not-sr-only">Help</span>
          </button>
          <DashboardProfileMenu
            identity={identity}
            onLogout={onLogout}
            accentColor="#f97316"
            chipBg="rgba(255,255,255,0.12)"
            chipBorder="rgba(255,255,255,0.2)"
            chipTextColor="#ffffff"
            subtitleColor="rgba(255,255,255,0.75)"
          />
        </div>
      </nav>
    </header>
  );
}
