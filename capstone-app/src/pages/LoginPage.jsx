import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/authService";
import AuthPageLayout from "@/components/common/AuthPageLayout";
import DevLoginPanel from "@/components/common/DevLoginPanel";
import TermsPrivacyModal from "@/components/common/TermsPrivacyModal";
import PasswordRecoveryDialog from "@/components/common/PasswordRecoveryDialog";

const TERMS_LINK_CLASSES = "cursor-pointer text-blue-700 hover:underline";

/* ── LoginPage ──────────────────────────────────────────────────────────── */
const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showRecoveryHelp, setShowRecoveryHelp] = useState(false);

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
      // goes to authController.js login function
      const response = await authService.login({
        phone: form.phone.trim(),
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
      <AuthPageLayout className="auth-page-login">
        {/* Heading */}
        <div className="auth-heading !mb-3 [@media(max-height:700px)]:!mb-2">
          <h1>Welcome!</h1>
        </div>

        {/* Error slot: fixed height so showing/hiding never shifts the layout */}
        <div className="auth-error-slot min-h-9 mb-2" aria-live="polite">
          {error && (
            <div
              role="alert"
              className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center"
            >
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-3 [@media(max-height:700px)]:space-y-2"
        >
          {/* Phone field */}
          <div>
            <label htmlFor="login-phone">Phone Number</label>
            <input
              id="login-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="09XXXXXXXXX"
            />
          </div>

          {/* Password field with show/hide toggle */}
          <div>
            <label htmlFor="login-password">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
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
          <div className="text-right text-xs">
            <button
              type="button"
              onClick={() => setShowRecoveryHelp(true)}
              aria-haspopup="dialog"
              aria-expanded={showRecoveryHelp}
              className="font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="auth-login-submit transition-colors disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin w-4 h-4 text-white" />
                Logging in…
              </span>
            ) : (
              <>
                Login <ArrowRight size={17} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="auth-terms !mt-3 [@media(max-height:700px)]:!mt-2">
          By logging in, you agree to our{" "}
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
          .
        </p>

        {import.meta.env.VITE_DEV_BYPASS === "true" && <DevLoginPanel />}
      </AuthPageLayout>

      {/* ── Modals ── */}
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
