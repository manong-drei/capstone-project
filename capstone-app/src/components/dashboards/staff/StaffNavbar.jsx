import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import DashboardProfileMenu, { ProfileActions } from "@/components/common/DashboardProfileMenu";
import { DASHBOARD_NAVIGATION } from "@/constants/dashboardNavigation";
import { ACCOUNT_ROUTES, ROUTES } from "@/constants/routes";

const theme = "bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7] text-white";
const control = "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white aria-[current=page]:bg-white/15";
const desktopRow = "gap-2 text-xs font-medium";
const menuRow = "w-full gap-3 py-2 text-left text-[13px] font-semibold";
const menuIcon = "grid size-7 shrink-0 place-items-center rounded-md bg-white/15";

export default function StaffNavbar({ identity, onLogout, onHelp, sections = [] }) {
  const dashboardPath = ACCOUNT_ROUTES[identity.role]?.dashboard || ROUTES.STAFF_DASHBOARD;
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const toggle = useRef(null);
  const nav = useRef(null);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 641px)");
    const onResize = () => { if (desktop.matches) setOpen(false); };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    const onPointerDown = (event) => {
      if (!nav.current?.contains(event.target)) setOpen(false);
    };
    desktop.addEventListener("change", onResize);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      desktop.removeEventListener("change", onResize);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const sectionControls = (items, mobile = false) => items.map(({ label, icon, active, path, onSelect }) => {
    const Component = onSelect ? "button" : Link;
    const Icon = icon;
    const iconElement = <Icon size={17} className="shrink-0" aria-hidden="true" />;
    return (
      <Component
        key={label}
        {...(onSelect ? { type: "button" } : { to: path })}
        aria-label={label}
        aria-current={(active ?? pathname === path) ? "page" : undefined}
        onClick={() => { setOpen(false); onSelect?.(); }}
        className={`${control} ${mobile ? menuRow : desktopRow}`}
      >
        {mobile ? <span className={menuIcon}>{iconElement}</span> : iconElement}
        <span className={mobile ? "" : "hidden xl:inline"}>{label}</span>
      </Component>
    );
  });

  const helpControl = (drawer = false) => {
    const icon = <CircleHelp size={17} aria-hidden="true" />;
    return (
      <button
        type="button"
        onClick={() => {
          if (drawer) toggle.current?.focus();
          setOpen(false);
          onHelp();
        }}
        aria-label="Help"
        className={`${control} ${drawer ? menuRow : desktopRow}`}
      >
        {drawer ? <span className={menuIcon}>{icon}</span> : icon}
        <span className={drawer ? "" : "sr-only lg:not-sr-only"}>Help</span>
      </button>
    );
  };

  return (
    <header className={`sticky top-0 border-b border-white/10 shadow-sm ${open ? "z-[61]" : "z-50"} ${theme}`}>
      <nav
        ref={nav}
        aria-label={identity.role === "admin" ? "Admin navigation" : `${identity.roleLabel} navigation`}
        className="flex h-16 w-full items-center justify-between gap-3 px-2 sm:px-3"
      >
        <Link
          to={dashboardPath}
          onClick={() => setOpen(false)}
          aria-label={`E-KALUSUGAN ${identity.role} dashboard`}
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-white"
        >
          <img
            src="/assets/ekalusugan-logo-small.webp"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full border-2 border-white/40 object-cover"
          />
          <span className="text-sm font-bold tracking-wide">
            E-KALUSUGAN
          </span>
        </Link>
        <div className="hidden min-w-0 items-center gap-3 min-[641px]:flex">
          {sections.length > 0 && <div className="flex items-center gap-1">{sectionControls(sections)}</div>}
          {helpControl()}
          <DashboardProfileMenu identity={identity} onLogout={onLogout} />
        </div>
        <button
          ref={toggle}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={identity.role === "admin" ? (open ? "Close menu" : "Open menu") : "Toggle menu"}
          aria-expanded={open}
          aria-controls={open ? drawerId : undefined}
          className={`${control} w-11 justify-center min-[641px]:hidden`}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
        {open && (
          <div id={drawerId} className={`absolute inset-x-2 top-full mt-2 max-h-[calc(100dvh-5rem)] max-w-sm overflow-y-auto overscroll-contain rounded-xl border border-white/15 p-3 shadow-lg min-[641px]:hidden min-[400px]:left-auto min-[400px]:w-full ${theme}`}>
            <ProfileActions
              role={identity.role}
              identity={identity}
              onProfileClick={() => setOpen(false)}
              onLogout={() => { setOpen(false); onLogout(); }}
            >
              {sectionControls(sections.length ? sections : DASHBOARD_NAVIGATION[identity.role] ?? [], true)}
              {helpControl(true)}
            </ProfileActions>
          </div>
        )}
      </nav>
    </header>
  );
}
