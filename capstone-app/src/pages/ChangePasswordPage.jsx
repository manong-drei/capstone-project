import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/authService";
import { ROUTES } from "@/constants/routes";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.oldPassword.trim() || !form.newPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      updateUser({ must_change_password: false });
      navigate(ROUTES.HOME + "dashboard");
    } catch (err) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          "linear-gradient(160deg, #dbeafe 0%, #bfdbfe 60%, #dbeafe 100%)",
      }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl px-8 py-9"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.13)" }}
      >
        <div className="text-center mb-6">
          <h2
            className="font-bold mb-1"
            style={{ fontSize: "1.25rem", color: "#111827" }}
          >
            Change Your Password
          </h2>

          <p className="text-xs leading-snug px-2" style={{ color: "#6b7280" }}>
            You must set a new password before continuing.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "#374151" }}
            >
              Current (Temporary) Password
            </label>

            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                className="w-full px-3 pr-10 py-2 rounded-lg border text-sm text-gray-700 outline-none"
                style={{ border: "1px solid #d1d5db" }}
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
          </div>

          {/* New Password */}
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "#374151" }}
            >
              New Password
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full px-3 pr-10 py-2 rounded-lg border text-sm text-gray-700 outline-none"
                style={{ border: "1px solid #d1d5db" }}
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
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "#374151" }}
            >
              Confirm New Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 pr-10 py-2 rounded-lg border text-sm text-gray-700 outline-none"
                style={{ border: "1px solid #d1d5db" }}
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
            className="w-full py-2.5 rounded-full text-white font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(90deg, #1e4db7 0%, #2563eb 100%)",
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
