import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import AuthPageLayout from "@/components/common/AuthPageLayout";
import TermsPrivacyModal from "@/components/common/TermsPrivacyModal";
import { ROLES } from "@/constants/roles";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/authService";
import { ACCOUNT_ROUTES, ROUTES } from "@/constants/routes";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const setup = !!user?.must_change_password;
  const profilePath = ACCOUNT_ROUTES[user.role].profile;

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || showTerms) return;

    if ((!setup && !form.oldPassword.trim()) || !form.newPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.newPassword.length < 8 || new TextEncoder().encode(form.newPassword).length > 72 || !/[0-9]/.test(form.newPassword)) {
      setError("Use at least 8 characters and a number. Maximum: 72 bytes (72 plain English characters; fewer for accented letters or emoji).");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (setup && user.role === ROLES.PATIENT) {
      setShowTerms(true);
      return;
    }

    savePassword();
  };

  const savePassword = async () => {
    setShowTerms(false);
    setLoading(true);
    setError("");

    try {
      const result = await authService.changePassword({
        ...(setup ? {} : { oldPassword: form.oldPassword }),
        newPassword: form.newPassword,
      });

      login(result.user, result.token);
      if (setup) navigate(ROUTES.HOME + "dashboard");
      else navigate(profilePath, { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout logoTo={!setup && user.role === ROLES.PATIENT ? profilePath : ROUTES.HOME}>
      <div className="auth-heading">
        <h1>
          Change Your Password
        </h1>

        <p>
          {setup ? "You must set a new password before continuing." : "Enter your current password and choose a new one."}
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
          {error}
        </div>
      )}

      <form inert={showTerms} onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        {!setup && <div>
          <label
            htmlFor="oldPassword"
            className="block text-xs font-semibold mb-1"
          >
            Current Password
          </label>

          <div className="relative">
            <input
              id="oldPassword"
              type={showOldPassword ? "text" : "password"}
              name="oldPassword"
              autoComplete="current-password"
              value={form.oldPassword}
              onChange={handleChange}
            />

            <button
              type="button"
              onClick={() => setShowOldPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={
                showOldPassword
                  ? "Hide current password"
                  : "Show current password"
              }
            >
              {showOldPassword ? (
                <EyeOff size={18} strokeWidth={2} />
              ) : (
                <Eye size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>}

        {/* New Password */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-xs font-semibold mb-1"
          >
            New Password
          </label>

          <div className="relative">
            <input
              id="newPassword"
              aria-describedby="password-guidance"
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
            />

            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={
                showNewPassword ? "Hide new password" : "Show new password"
              }
            >
              {showNewPassword ? (
                <EyeOff size={18} strokeWidth={2} />
              ) : (
                <Eye size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <p id="password-guidance" className="text-xs leading-relaxed text-slate-500">Use at least 8 characters and a number. Maximum 72 bytes; accented letters and emoji use more than one byte.</p>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold mb-1"
          >
            Confirm New Password
          </label>

          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={18} strokeWidth={2} />
              ) : (
                <Eye size={18} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="transition-colors disabled:opacity-70"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
      {!setup && <Link to={profilePath} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">Back to My Profile</Link>}
      <TermsPrivacyModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={savePassword}
      />
    </AuthPageLayout>
  );
};

export default ChangePasswordPage;
