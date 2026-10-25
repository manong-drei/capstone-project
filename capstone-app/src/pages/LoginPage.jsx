import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/authService";
import DevLoginPanel from "@/components/common/DevLoginPanel";
import TermsPrivacyModal from "@/components/common/TermsPrivacyModal";

/* ── Shared class names (used more than once below) ───────────────────── */
const LABEL_CLASSES = "block text-xs font-semibold mb-1 text-gray-700";

const INPUT_CLASSES =
  "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 placeholder-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400";

const TERMS_LINK_CLASSES = "cursor-pointer text-blue-500 hover:underline";

/* ── Inline Navbar (same design system) ───────────────────────────────── */
const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="w-full px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7]">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img
          src="/assets/Logo.webp"
          alt="E-KALUSUGAN Logo"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0"
        />
        <span className="text-white font-extrabold text-sm sm:text-base tracking-widest uppercase select-none">
          E-KALUSUGAN
        </span>
      </div>
    </nav>
  );
};

/* ── Password recovery instructions (shown when "Forgot password?" is clicked) ── */
const PasswordRecoveryHelp = () => (
  <div
    id="recovery-help"
    className="mt-3 rounded-lg bg-blue-50 p-4 text-sm leading-relaxed text-slate-700"
  >
    <h3 className="mb-3 text-sm font-semibold text-blue-900">
      Password Recovery Steps
    </h3>
    <ul className="list-disc space-y-1 pl-3">
      <li>Visit the clinic reception.</li>
      <li>Verify your name, phone number, address, and birthday.</li>
      <li>Receive a temporary password.</li>
      <li>Valid for 30 minutes and one login only.</li>
      <li>Set a new password after logging in.</li>
    </ul>
  </div>
);

/* ── LoginPage ──────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form values
  const [form, setForm] = useState({ phone: "", password: "" });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showRecoveryHelp, setShowRecoveryHelp] = useState(false);

  // Updates the field that changed (phone or password) and clears any old error
  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.phone.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.login({
        //go to authcontroller.js login function
        phone: form.phone,
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
    <div className="min-h-screen flex flex-col bg-[linear-gradient(160deg,#dbeafe_0%,#bfdbfe_60%,#dbeafe_100%)]">
      <Navbar />

      {/* Hero background + centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-[url('/assets/BGHero.webp')] bg-cover bg-center bg-no-repeat">
        <div className="w-full max-w-sm bg-white rounded-2xl px-8 py-9 shadow-[0_8px_40px_rgba(0,0,0,0.13)]">
          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="font-bold mb-1 text-xl tracking-[-0.01em] text-gray-900">
              Welcome!
            </h2>
            <p className="text-xs leading-snug px-2 text-gray-500">
              Login with your Account and stay Connected With Your Health
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone field */}
            <div>
              <label className={LABEL_CLASSES}>Phone Number:</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="09XXXXXXXXX"
                className={INPUT_CLASSES}
              />
            </div>

            {/* Password field with show/hide toggle */}
            <div>
              <label className={LABEL_CLASSES}>Password:</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`${INPUT_CLASSES} pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowRecoveryHelp((visible) => !visible)}
                aria-expanded={showRecoveryHelp}
                aria-controls="recovery-help"
                className="font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Forgot password?
              </button>
              {showRecoveryHelp && <PasswordRecoveryHelp />}
            </div>

            {/* Terms and privacy links */}
            <p className="text-xs text-center leading-relaxed text-gray-400">
              By signing up you agree to our{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className={TERMS_LINK_CLASSES}
              >
                terms and conditions
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className={TERMS_LINK_CLASSES}
              >
                privacy policy
              </button>
            </p>

            {/* Submit button (shows a spinner while logging in) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#1e4db7] to-blue-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4 text-white" />
                  Logging in…
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {import.meta.env.VITE_DEV_BYPASS === "true" && <DevLoginPanel />}
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
