import { useState } from "react";
import DashboardProfileMenu from "@/components/common/DashboardProfileMenu";

const NAVY = "#1e2d6b";
const INDIGO = "#2d3a8c";
const ORANGE = "#f97316";

const navBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.25)",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "5px 12px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s",
};

export default function StaffNavbar({ identity, onLogout }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <nav
      className="ek-nav"
      style={{
        background: `linear-gradient(90deg, ${NAVY} 0%, ${INDIGO} 100%)`,
        height: "54px",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 32 32" width="20" height="20" fill="none">
            <rect x="12" y="5" width="8" height="22" rx="2" fill="white" />
            <rect x="5" y="12" width="22" height="8" rx="2" fill="white" />
          </svg>
        </div>
        <span
          className="ek-brand-text"
          style={{
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "15px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          E-KALUSUGAN
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
        <button
          className="ek-nav-btn"
          onClick={() => setHelpOpen((p) => !p)}
          style={navBtnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = navBtnStyle.background)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="ek-nav-label">Help</span>
        </button>

        {helpOpen && (
          <div
            style={{
              position: "absolute",
              top: "44px",
              right: 0,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px 16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              minWidth: "210px",
              zIndex: 200,
            }}
          >
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#111827" }}>Staff Guide</p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
              Press <b>Next Queue</b> to call the next patient.
              <br />
              Use the form on the right to register walk-in patients and assign their queue number.
            </p>
          </div>
        )}

        <DashboardProfileMenu
          identity={identity}
          onLogout={onLogout}
          accentColor={ORANGE}
          chipBg="rgba(255,255,255,0.12)"
          chipBorder="rgba(255,255,255,0.25)"
          chipTextColor="#ffffff"
          subtitleColor="rgba(255,255,255,0.72)"
        />
      </div>
    </nav>
  );
}
