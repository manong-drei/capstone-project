import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import * as authService from "../services/authService";
import DevLoginPanel from "../components/common/DevLoginPanel";
import TermsPrivacyModal from "../components/common/TermsPrivacyModal";

/* ── Inline Navbar (same design system) ───────────────────────────────── */
const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav
      className="w-full px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0"
      style={{ background: "linear-gradient(90deg, #1a3a8f 0%, #1e4db7 100%)" }}
    >
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <circle
              cx="16"
              cy="16"
              r="15"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
            />
            <rect x="13" y="7" width="6" height="18" rx="1.5" fill="white" />
            <rect x="7" y="13" width="18" height="6" rx="1.5" fill="white" />
          </svg>
        </div>
        <span className="text-white font-extrabold text-sm sm:text-base tracking-widest uppercase select-none">
          E-KALUSUGAN
        </span>
      </div>
    </nav>
  );
};

/* ── Eye Icons ─────────────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
  >
    <path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4"
  >
    <path
      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="1"
      y1="1"
      x2="23"
      y2="23"
      stroke="#9ca3af"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* ── LoginPage ──────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.login({
        username: form.username,
        password: form.password,
      });

      login(response.user, response.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #dbeafe 0%, #bfdbfe 60%, #dbeafe 100%)",
      }}
    >
      <Navbar />

      <div
        className="flex-1 flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: "url('/assets/Hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl px-8 py-9"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.13)" }}
        >
          <div className="text-center mb-6">
            <h2
              className="font-bold mb-1"
              style={{
                fontSize: "1.25rem",
                letterSpacing: "-0.01em",
                color: "#111827",
              }}
            >
              Welcome!
            </h2>
            <p
              className="text-xs leading-snug px-2"
              style={{ color: "#6b7280" }}
            >
              Login with your Account and stay Connected With Your Health
            </p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: "#374151" }}
              >
                Username:
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full px-3 py-2 rounded-lg border text-sm text-gray-700 placeholder-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                style={{ border: "1px solid #d1d5db" }}
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: "#374151" }}
              >
                Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-9 rounded-lg border text-sm text-gray-700 placeholder-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  style={{ border: "1px solid #d1d5db" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <p
              className="text-xs text-center leading-relaxed"
              style={{ color: "#9ca3af" }}
            >
              By signing up you agree to our{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="hover:underline"
                style={{
                  color: "#3b82f6",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "inherit",
                }}
              >
                terms and conditions
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="hover:underline"
                style={{
                  color: "#3b82f6",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "inherit",
                }}
              >
                privacy policy
              </button>
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(90deg, #1e4db7 0%, #2563eb 100%)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="3"
                      strokeOpacity="0.3"
                    />
                    <path
                      d="M12 2a10 10 0 0110 10"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Logging in…
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: "#9ca3af" }}>
            Don't have an account yet?{" "}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: "#3b82f6" }}
            >
              Sign up
            </Link>
          </p>

          <DevLoginPanel />
        </div>
      </div>

      {/* ── Terms & Privacy Modal ── */}
      <TermsPrivacyModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => setShowTerms(false)}
      />
    </div>
  );
};

export default LoginPage;
