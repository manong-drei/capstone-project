/**
 * StaffDashboard.jsx — Staff Queue Management Panel
 **/

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../constants/routes";
import api from "../services/api";

// ─── Brand colors ──────────────────────────────────────────────────────────
const NAVY = "#1e2d6b";
const INDIGO = "#2d3a8c";
const ORANGE = "#f97316";
const BLUE = "#1e4db7";

// ─── Constants ──────────────────────────────────────────────────────────────
const BAGO_BARANGAYS = [
  "Abuanan",
  "Alianza",
  "Atipuluan",
  "Bacong",
  "Bagroy",
  "Balingasag",
  "Binubuhan",
  "Busay",
  "Calumangan",
  "Caridad",
  "Don Jorge Araneta",
  "Dulao",
  "Ilijan",
  "Lag-asan",
  "Ma-ao",
  "Mailum",
  "Malingin",
  "Napoles",
  "Pacol",
  "Poblacion",
  "Sagasa",
  "Sampinit",
  "Tabunan",
  "Taloc",
];

// ─── Shared CSS injected once ───────────────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1);   }
    50%       { opacity: 0.5; transform: scale(1.5); }
  }
  @keyframes spin-anim {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .ek-spin { animation: spin-anim 0.75s linear infinite; }
  .ek-pulse { animation: pulse-dot 2s ease-in-out infinite; }

  @media (max-width: 640px) {
    .ek-grid { grid-template-columns: 1fr !important; }
    .ek-hero { height: 150px !important; }
  }
`;

// ─── Navbar ─────────────────────────────────────────────────────────────────
function Navbar({ onLogout }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <nav
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          position: "relative",
        }}
      >
        {/* Help */}
        <button
          onClick={() => setHelpOpen((p) => !p)}
          style={navBtnStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = navBtnStyle.background)
          }
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Help
        </button>

        {/* Help tooltip */}
        {helpOpen && (
          <div
            style={{
              position: "absolute",
              top: "44px",
              right: "80px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "14px 16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              minWidth: "210px",
              zIndex: 200,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Staff Guide
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#6b7280",
                lineHeight: 1.6,
              }}
            >
              Press <b>Next Queue</b> to call the next patient.
              <br />
              Use the form on the right to register walk-in patients and assign
              their queue number.
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          style={navBtnStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(220,38,38,0.35)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = navBtnStyle.background)
          }
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </nav>
  );
}

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

// ─── Hero Banner ─────────────────────────────────────────────────────────────
function HeroBanner() {
  return (
    <div
      className="ek-hero"
      style={{
        position: "relative",
        width: "100%",
        height: "210px",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/assets/login_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          filter: "brightness(0.52)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(30,45,107,0.55) 0%, rgba(30,45,107,0.15) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 800,
            lineHeight: 1.2,
            fontSize: "clamp(20px, 4vw, 28px)",
            color: "#ffffff",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          Your Health, Schedule.
          <br />
          <span style={{ color: "#93c5fd" }}>No More Long Waits.</span>
        </h1>
        <p
          style={{
            margin: "10px 0 0",
            lineHeight: 1.55,
            fontSize: "clamp(12px, 2vw, 14px)",
            color: "rgba(255,255,255,0.85)",
            maxWidth: "520px",
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          Get your queue number online, check doctor availability, and track
          your wait time—all from your phone
        </p>
      </div>
    </div>
  );
}

// ─── Queue Panel (left) ──────────────────────────────────────────────────────
function QueuePanel({ currentServing, nextQueue, onCallNext, loading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Now Serving */}
      <div
        style={{
          background: ORANGE,
          borderRadius: "12px",
          padding: "28px 20px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Now Serving
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "clamp(32px, 6vw, 46px)",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {currentServing
            ? `#${String(currentServing.queue_number).padStart(2, "0")}`
            : "—"}
        </p>
        {currentServing && (
          <span
            style={{
              display: "inline-block",
              marginTop: "8px",
              fontSize: "12px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.95)",
              background: "rgba(255,255,255,0.22)",
              borderRadius: "20px",
              padding: "3px 12px",
            }}
          >
            {currentServing.type === "priority" ? "Priority" : "Regular"}
          </span>
        )}
        {!currentServing && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "12px",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            No patient being served
          </p>
        )}
      </div>

      {/* Next Serving list */}
      <div
        style={{
          background: "#ffffff",
          border: "1.5px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #f3f4f6",
            background: "#f9fafb",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Next Serving
          </p>
        </div>

        {nextQueue.length === 0 ? (
          <p
            style={{
              margin: 0,
              padding: "18px 16px",
              fontSize: "13px",
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            No patients waiting
          </p>
        ) : (
          nextQueue.slice(0, 5).map((q, i) => (
            <div
              key={q.id ?? i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom:
                  i < Math.min(nextQueue.length, 5) - 1
                    ? "1px solid #f9fafb"
                    : "none",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f9fafb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: i === 0 ? INDIGO : "#374151",
                }}
              >
                #{String(q.queue_number).padStart(3, "0")}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: q.type === "priority" ? ORANGE : "#6b7280",
                  background: q.type === "priority" ? "#fff7ed" : "#f3f4f6",
                  borderRadius: "10px",
                  padding: "2px 8px",
                }}
              >
                {q.type === "priority" ? "Priority" : "Regular"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Next Queue button */}
      <button
        onClick={onCallNext}
        disabled={loading || nextQueue.length === 0}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "12px",
          border: "none",
          background:
            nextQueue.length === 0
              ? "#d1d5db"
              : `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 100%)`,
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: 700,
          cursor: loading || nextQueue.length === 0 ? "not-allowed" : "pointer",
          opacity: nextQueue.length === 0 ? 0.6 : 1,
          boxShadow:
            nextQueue.length > 0 ? "0 4px 16px rgba(45,58,140,0.35)" : "none",
          transition: "transform 0.15s, box-shadow 0.15s",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          if (nextQueue.length > 0 && !loading) {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(45,58,140,0.45)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            nextQueue.length > 0 ? "0 4px 16px rgba(45,58,140,0.35)" : "none";
        }}
      >
        {loading ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg
              className="ek-spin"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            Processing...
          </span>
        ) : (
          "Next Queue"
        )}
      </button>
    </div>
  );
}

// ─── Walk-In Form (right) ────────────────────────────────────────────────────
function WalkInForm({ onSuccess }) {
  const [form, setForm] = useState({ fullName: "", address: "", contact: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dropdown states
  const [showDropdown, setShowDropdown] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);

  const set = (field) => (e) => {
    setError("");
    setSuccess("");
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!form.fullName.trim()) return setError("Full name is required.");
    if (!form.address.trim()) return setError("Address is required.");
    if (!form.contact.trim()) return setError("Contact number is required.");

    setLoading(true);
    try {
      const res = await api.post("/queue/walkin", {
        full_name: form.fullName,
        address: form.address,
        contact: "+63" + form.contact.replace(/^0+/, ""),
        type: "regular",
      });
      const queueNumber = res?.queue?.queue_number ?? "assigned";
      setSuccess(`Walk-in registered — queue number ${queueNumber}.`);
      setForm({ fullName: "", address: "", contact: "" });
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to register patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#eef0f7",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.06)",
      }}
    >
      {/* Full Name */}
      <FormField
        icon={
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        }
        placeholder="Full name"
        value={form.fullName}
        onChange={set("fullName")}
      />

      {/* Address Dropdown */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "13px",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            onFocus={() => setAddressFocused(true)}
            onBlur={() => {
              // Delay blur slightly so clicks on dropdown items can register
              setTimeout(() => setAddressFocused(false), 200);
            }}
            style={{
              width: "100%",
              padding: "12px 14px 12px 40px", // 40px left padding to accommodate the icon
              borderRadius: "10px",
              border: `1.5px solid ${showDropdown || addressFocused ? BLUE : "#dde1ec"}`,
              fontSize: "14px",
              color: form.address ? "#111827" : "#9ca3af",
              background: "#ffffff",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              boxShadow:
                showDropdown || addressFocused
                  ? `0 0 0 3px rgba(30,77,183,0.12)`
                  : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {form.address || "Address"}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              style={{
                transition: "transform 0.2s",
                transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              marginTop: "4px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            <ul
              style={{
                margin: 0,
                padding: "4px 0",
                listStyle: "none",
                maxHeight: "240px",
                overflowY: "auto",
              }}
            >
              {BAGO_BARANGAYS.map((brgy) => {
                const fullAddress = `Barangay ${brgy}, Bago City`;
                const isSelected = form.address === fullAddress;
                return (
                  <li key={brgy}>
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        fontSize: "14px",
                        background: isSelected ? "#eff6ff" : "transparent",
                        color: isSelected ? "#1d4ed8" : "#374151",
                        fontWeight: isSelected ? "600" : "400",
                        border: "none",
                        cursor: "pointer",
                        outline: "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.background = "#eff6ff";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected)
                          e.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => {
                        // Reuses existing set() logic to clear errors smoothly
                        set("address")({ target: { value: fullAddress } });
                        setShowDropdown(false);
                      }}
                    >
                      Barangay {brgy}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Contact Number */}
      <ContactField value={form.contact} onChange={set("contact")} />

      {/* Error / Success banners */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "9px 12px",
            fontSize: "12px",
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "9px 12px",
            fontSize: "12px",
            color: "#15803d",
            fontWeight: 500,
          }}
        >
          ✓ {success}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "10px",
          border: "none",
          background: `linear-gradient(90deg, ${NAVY} 0%, ${BLUE} 100%)`,
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.75 : 1,
          boxShadow: "0 3px 12px rgba(30,45,107,0.3)",
          transition: "transform 0.15s, box-shadow 0.15s",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 5px 18px rgba(30,45,107,0.42)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 3px 12px rgba(30,45,107,0.3)";
        }}
      >
        {loading ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg
              className="ek-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            Registering...
          </span>
        ) : (
          "Get Queue"
        )}
      </button>
    </div>
  );
}

function FormField({ icon, placeholder, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <span
        style={{
          position: "absolute",
          left: "13px",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
        }}
      >
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "12px 14px 12px 40px",
          borderRadius: "10px",
          border: `1.5px solid ${focused ? BLUE : "#dde1ec"}`,
          fontSize: "14px",
          color: "#111827",
          background: "#ffffff",
          outline: "none",
          fontFamily: "inherit",
          boxSizing: "border-box",
          boxShadow: focused ? `0 0 0 3px rgba(30,77,183,0.12)` : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      />
    </div>
  );
}

function ContactField({ value, onChange }) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: `1.5px solid ${focused ? BLUE : "#dde1ec"}`,
        borderRadius: "10px",
        background: "#ffffff",
        overflow: "hidden",
        boxShadow: focused ? `0 0 0 3px rgba(30,77,183,0.12)` : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <span
        style={{
          padding: "12px 10px 12px 14px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
          background: "#f4f5f9",
          borderRight: "1.5px solid #dde1ec",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        +63
      </span>
      <input
        type="tel"
        placeholder="9XX XXX XXXX"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          padding: "12px 14px",
          border: "none",
          outline: "none",
          fontSize: "14px",
          color: "#111827",
          fontFamily: "inherit",
          background: "transparent",
        }}
      />
    </div>
  );
}

// ─── Main StaffDashboard ─────────────────────────────────────────────────────
export default function StaffDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [queues, setQueues] = useState([]);
  const [calling, setCalling] = useState(false);
  const intervalRef = useRef(null);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await api.get("/queue");
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setQueues(list);
    } catch {
      // Silently fail on polling — don't disrupt UX
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, 15_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchQueue]);

  const handleCallNext = async () => {
    setCalling(true);
    try {
      await api.post("/queue/call-next");
      await fetchQueue();
    } catch (err) {
      alert(err.message || "Failed to call next patient.");
    } finally {
      setCalling(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const currentServing = queues.find((q) => q.status === "serving") ?? null;
  const nextQueue = queues.filter((q) => q.status === "waiting");

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#eef0f7",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        }}
      >
        <Navbar onLogout={handleLogout} />
        <HeroBanner />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            padding: "clamp(16px, 3vw, 28px)",
            maxWidth: "960px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          <div
            className="ek-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(14px, 2vw, 24px)",
              alignItems: "start",
            }}
          >
            <QueuePanel
              currentServing={currentServing}
              nextQueue={nextQueue}
              onCallNext={handleCallNext}
              loading={calling}
            />
            <WalkInForm onSuccess={fetchQueue} />
          </div>

          {/* Live indicator */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
            }}
          >
            <span
              className="ek-pulse"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
                boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                letterSpacing: "0.04em",
              }}
            >
              Queue auto-refreshes every 15 seconds
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
