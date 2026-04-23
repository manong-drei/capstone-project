import { useEffect, useRef, useState } from "react";
import Icon from "./AppIcons";

function Chevron({ open, color = "currentColor" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.16s ease",
        flexShrink: 0,
      }}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileChip({
  identity,
  onClick,
  isOpen = false,
  chipTextColor = "#ffffff",
  subtitleColor = "rgba(255,255,255,0.72)",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: 0,
        padding: 0,
        border: "none",
        background: "transparent",
        color: chipTextColor,
        cursor: "pointer",
      }}
    >
      <Icon name="user" size={18} color={chipTextColor} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          minWidth: 0,
        }}
      >
        <span
          style={{
            maxWidth: "140px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "12px",
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {identity.displayName}
        </span>
        <span
          style={{
            maxWidth: "140px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "11px",
            color: subtitleColor,
            lineHeight: 1.1,
          }}
        >
          {identity.subtitle}
        </span>
      </div>
      <Chevron open={isOpen} color={chipTextColor} />
    </button>
  );
}

function LogoutDropdown({
  onLogout,
  mobile = false,
  accentColor = "#f97316",
  panelBg = "#ffffff",
  panelTextColor = "#0f172a",
}) {
  return (
    <div
      role="menu"
      aria-label="Profile actions"
      style={{
        minWidth: mobile ? "100%" : "150px",
        borderRadius: "12px",
        background: panelBg,
        boxShadow: mobile ? "none" : "0 14px 30px rgba(15,23,42,0.16)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onLogout}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "11px 14px",
          border: "none",
          background: "transparent",
          color: mobile ? "#ffffff" : panelTextColor,
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Icon name="logout" size={16} color={mobile ? "#ffffff" : accentColor} />
        Log Out
      </button>
    </div>
  );
}

export default function DashboardProfileMenu({
  identity,
  onLogout,
  mobile = false,
  accentColor = "#f97316",
  chipTextColor,
  subtitleColor,
  panelBg,
  panelTextColor,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (mobile || !open) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobile, open]);

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  if (mobile) {
    return (
      <div style={{ display: "grid", gap: "8px" }}>
        <ProfileChip
          identity={identity}
          onClick={() => setOpen((value) => !value)}
          isOpen={open}
          chipTextColor={chipTextColor}
          subtitleColor={subtitleColor}
        />
        {open ? (
          <LogoutDropdown
            mobile
            onLogout={handleLogout}
            accentColor={accentColor}
            panelBg={panelBg}
            panelTextColor={panelTextColor}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <ProfileChip
        identity={identity}
        onClick={() => setOpen((value) => !value)}
        isOpen={open}
        chipTextColor={chipTextColor}
        subtitleColor={subtitleColor}
      />
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            zIndex: 120,
          }}
        >
          <LogoutDropdown
            onLogout={handleLogout}
            accentColor={accentColor}
            panelBg={panelBg}
            panelTextColor={panelTextColor}
          />
        </div>
      ) : null}
    </div>
  );
}
