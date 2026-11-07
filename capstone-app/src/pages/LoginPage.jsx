import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/authService";
import AuthPageLayout from "@/components/common/AuthPageLayout";
import DevLoginPanel from "@/components/common/DevLoginPanel";
import TermsPrivacyModal from "@/components/common/TermsPrivacyModal";
import PasswordRecoveryDialog from "@/components/common/PasswordRecoveryDialog";

/* ── Shared class names (used more than once below) ───────────────────── */
const LABEL_CLASSES = "block text-xs font-semibold mb-1 text-gray-700";

const INPUT_CLASSES =
  "w-full px-3 py-2 sm:py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 placeholder-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400";

const TERMS_LINK_CLASSES = "cursor-pointer text-blue-500 hover:underline";

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
    <>
      <AuthPageLayout>
        {/* Heading */}
        <div className="text-center mb-6 sm:mb-7">
          <h2 className="font-bold mb-1 text-xl sm:text-2xl tracking-[-0.01em] text-gray-900">
            Welcome!
          </h2>
          <p className="text-xs sm:text-sm leading-snug px-2 text-gray-500">
            Login with your Account and stay Connected With Your Health
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
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
              aria-haspopup="dialog"
              className="font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Forgot password?
            </button>
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
            className="w-full py-2.5 sm:py-3 rounded-full text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#1e4db7] to-blue-600"
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
      </AuthPageLayout>
      {/* ── Terms & Privacy Modal ── */}
      {showRecoveryHelp && (
        <PasswordRecoveryDialog onClose={() => setShowRecoveryHelp(false)} />
      )}
      <TermsPrivacyModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => setShowTerms(false)}
      />
    </>
  );
};

export default LoginPage;
