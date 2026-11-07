import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";
import { ACCOUNT_ROUTES } from "@/constants/routes";

function ProfileChip({
  identity,
  onClick,
  isOpen = false,
  chipClassName = "text-white",
  subtitleClassName = "text-white/70",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className={`flex min-h-11 min-w-0 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 ${chipClassName}`}
    >
      <User size={18} aria-hidden="true" focusable="false" />
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        <span className="max-w-35 truncate text-xs leading-tight font-bold">
          {identity.displayName}
        </span>
        <span
          className={`max-w-35 truncate text-[11px] leading-tight ${subtitleClassName}`}
        >
          {identity.subtitle}
        </span>
      </div>
      <ChevronDown
        size={14}
        aria-hidden="true"
        focusable="false"
        className={`shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}

export function ProfileActions({
  role,
  identity,
  onProfileClick,
  onLogout,
  children,
}) {
  const mobile = Boolean(identity);
  const profilePath = ACCOUNT_ROUTES[role]?.profile;

  const profileLinkClass = mobile
    ? "text-white hover:bg-white/15 focus-visible:outline-white"
    : "text-slate-700 hover:bg-slate-100 focus-visible:outline-blue-600";

  const profileIconClass = mobile
    ? "bg-white/15 text-white"
    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100";

  const logoutClass = mobile
    ? "text-red-100 hover:bg-red-500/30 focus-visible:outline-white"
    : "text-red-600 hover:bg-red-50 focus-visible:outline-red-600";

  const logoutIconClass = mobile
    ? "bg-red-500/30 text-red-100"
    : "bg-red-50 text-red-600 group-hover:bg-red-100";

  const dividerClass = mobile ? "bg-white/15" : "bg-slate-100";

  return (
    <div
      role={mobile ? "group" : "menu"}
      aria-label={mobile ? "Dashboard menu" : "Profile actions"}
      className={mobile ? "space-y-1" : "min-w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"}
    >
      {profilePath && (
        <div className={mobile ? "mb-3 space-y-2 rounded-xl border border-white/20 bg-white/10 p-2 shadow-sm" : ""}>
          {mobile && (
            <div className="flex items-center gap-3 border-b border-white/15 px-2.5 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15">
                <User size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="break-words text-sm font-bold">{identity.displayName}</p>
                <p className="text-xs text-white/70">{identity.subtitle}</p>
              </div>
            </div>
          )}
          <Link
            to={profilePath}
            onClick={onProfileClick}
            role={mobile ? undefined : "menuitem"}
            className={`group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 ${profileLinkClass}`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-md transition-colors ${profileIconClass}`}
            >
              <User size={16} aria-hidden="true" focusable="false" />
            </span>
            My Profile
          </Link>
          {!mobile && <div role="separator" className={`mx-2 my-1 h-px ${dividerClass}`} />}
        </div>
      )}
      {children}
      <button
        type="button"
        onClick={onLogout}
        role={mobile ? undefined : "menuitem"}
        className={`group flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 ${logoutClass}`}
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-md transition-colors ${logoutIconClass}`}
        >
          <LogOut size={16} aria-hidden="true" focusable="false" />
        </span>
        Log Out
      </button>
    </div>
  );
}

export default function DashboardProfileMenu({
  identity,
  onLogout,
  chipClassName,
  subtitleClassName,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        close();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  const handleLogout = useCallback(() => {
    close();
    onLogout();
  }, [close, onLogout]);

  return (
    <div ref={rootRef} className="relative">
      <ProfileChip
        identity={identity}
        onClick={toggle}
        isOpen={open}
        chipClassName={chipClassName}
        subtitleClassName={subtitleClassName}
      />
      {open ? (
        <div className="absolute top-[calc(100%+10px)] right-0 z-120">
          <ProfileActions
            role={identity.role}
            onProfileClick={close}
            onLogout={handleLogout}
          />
        </div>
      ) : null}
    </div>
  );
}
