/**
 * DevLoginPanel.jsx – Development Quick-Login Panel
 * E-KALUSUGAN Frontend Component
 *
 * Renders a row of role buttons that are ONLY visible when
 * VITE_DEV_BYPASS=true is set in your .env.development file.
 *
 * Each button calls the real /api/auth/dev-login endpoint which
 * returns a mock JWT, exactly like a normal login — so AuthContext
 * handles it identically and redirects to the correct dashboard.
 *
 * USAGE: Drop <DevLoginPanel /> inside your LoginPage.jsx.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

// Only render in dev mode (controlled by .env.development)
const DEV_MODE = import.meta.env.VITE_DEV_BYPASS === "true";

const ROLES = [
  { role: "patient", label: "Patient", emoji: "🧑‍⚕️", color: "#4f46e5" },
  { role: "doctor", label: "Doctor", emoji: "👨‍⚕️", color: "#0891b2" },
  { role: "staff", label: "Staff", emoji: "🏥", color: "#059669" },
  { role: "admin", label: "Admin", emoji: "🔧", color: "#dc2626" },
];

// Route each role goes to after bypass login
const ROLE_ROUTES = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  staff: "/dashboard/staff",
  admin: "/dashboard/admin",
};

export default function DevLoginPanel() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // which role is loading
  const [error, setError] = useState("");

  // Return nothing in production
  if (!DEV_MODE) return null;

  async function handleDevLogin(role) {
    setLoading(role);
    setError("");
    try {
      const res = await api.post("/auth/dev-login", { role });

      // Make sure the response actually has what we expect
      console.log("[DEV] Response:", res);
      const { token, user } = res;

      if (!token || !user) {
        setError("Dev login response missing token or user.");
        return;
      }

      login(user, token);

      setTimeout(() => {
        navigate("/dashboard"); // ← always, RoleRedirect will sort by role
      }, 100);
    } catch (err) {
      console.error("[DEV] Login error:", err);
      setError(err.response?.data?.message || "Dev login failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "16px",
        borderRadius: "10px",
        border: "1.5px dashed #f97316",
        background: "rgba(249,115,22,0.06)",
      }}
    >
      {/* Header */}
      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: "11px",
          fontWeight: "600",
          letterSpacing: "0.08em",
          textAlign: "center",
          color: "#f97316",
          textTransform: "uppercase",
        }}
      >
        ⚡ Dev Bypass — Quick Login
      </p>

      {/* Role Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {ROLES.map(({ role, label, emoji, color }) => (
          <button
            key={role}
            onClick={() => handleDevLogin(role)}
            disabled={loading !== null}
            style={{
              padding: "8px 4px",
              borderRadius: "7px",
              border: `1.5px solid ${color}22`,
              background: loading === role ? color : `${color}15`,
              color: loading === role ? "#fff" : color,
              cursor: loading !== null ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: "600",
              transition: "all 0.15s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              opacity: loading !== null && loading !== role ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: "18px" }}>{emoji}</span>
            {loading === role ? "..." : label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p
          style={{
            margin: "10px 0 0 0",
            fontSize: "12px",
            color: "#dc2626",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
