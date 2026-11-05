import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";
import { ACCOUNT_ROUTES, ROUTES } from "@/constants/routes";

const theme = "bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7] text-white";
const control = "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-xs font-medium hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white aria-[current=page]:bg-white/15";

export default function StaffNavbar({ identity, onLogout, onHelp, sections = [], mobileBar = false }) {
  const dashboardPath = ACCOUNT_ROUTES[identity.role]?.dashboard || ROUTES.STAFF_DASHBOARD;
  const hasDrawer = sections.length > 0 && !mobileBar;
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const toggle = useRef(null);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 641px)");
    const onResize = () => { if (desktop.matches) setOpen(false); };
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    desktop.addEventListener("change", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      desktop.removeEventListener("change", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sectionControls = (placement) => sections.map(({ label, mobileLabel, icon, active, to, onSelect }) => {
    const Icon = icon;
    const Component = to ? Link : "button";
    const name = placement === "bottom" ? mobileLabel : label;
    return (
      <Component
        key={label}
        {...(to ? { to } : { type: "button" })}
        aria-label={name}
        aria-current={active ? "page" : undefined}
        onClick={() => { setOpen(false); onSelect?.(); }}
        className={`${control} ${placement === "bottom" ? "flex-1 justify-center" : placement === "drawer" ? "w-full" : ""}`}
      >
        <Icon size={17} className="shrink-0" aria-hidden="true" />
        <span className={placement === "desktop" ? "hidden xl:inline" : ""}>{name}</span>
      </Component>
    );
  });

  const accountControls = (drawer = false) => (
    <>
      <button
        type="button"
        onClick={() => {
          if (drawer) toggle.current?.focus();
          setOpen(false);
          onHelp();
        }}
        aria-label="Help"
        className={`${control} ${drawer ? "w-full" : ""}`}
      >
        <CircleHelp size={17} aria-hidden="true" />
        <span className={drawer ? "" : "sr-only lg:not-sr-only"}>Help</span>
      </button>
      <DashboardProfileMenu identity={identity} onLogout={onLogout} mobile={drawer} panelBg={drawer ? "rgba(255,255,255,0.1)" : undefined} />
    </>
  );

  return (
    <>
      <header className={`sticky top-0 z-50 border-b border-white/10 shadow-sm ${theme}`}>
        <nav
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
              src="/assets/Logo.jpg"
              alt=""
              className="h-9 w-9 rounded-full border-2 border-white/40 object-cover"
            />
            <span className="hidden text-sm font-bold tracking-wide sm:block">
              E-KALUSUGAN
            </span>
          </Link>
          <div className={`min-w-0 items-center gap-2 sm:gap-3 ${hasDrawer ? "hidden min-[641px]:flex" : "flex"}`}>
            {sections.length > 0 && <div className={`items-center gap-1 ${mobileBar ? "hidden md:flex" : "flex"}`}>{sectionControls("desktop")}</div>}
            {accountControls()}
          </div>
          {hasDrawer && (
            <button
              ref={toggle}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={identity.role === "admin" ? (open ? "Close menu" : "Open menu") : "Toggle menu"}
              aria-expanded={open}
              aria-controls={drawerId}
              className={`${control} w-11 justify-center min-[641px]:hidden`}
            >
              {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          )}
          {hasDrawer && open && (
            <div id={drawerId} className={`absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto border-t border-white/15 p-3 shadow-lg min-[641px]:hidden ${theme}`}>
              {sectionControls("drawer")}
              {accountControls(true)}
            </div>
          )}
        </nav>
      </header>
      {mobileBar && (
        <nav aria-label="Mobile patient navigation" className={`fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-white/10 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-sm md:hidden ${theme}`}>
          {sectionControls("bottom")}
        </nav>
      )}
    </>
  );
}
