import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import TermsPrivacyModal from "../components/common/TermsPrivacyModal"; // adjust path as needed

/* -- Navbar -------------------------------------------------------------- */
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

/* -- Icons --------------------------------------------------------------- */
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
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
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
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
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* -- Password strength --------------------------------------------------- */
const getStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too short", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#3b82f6" },
    { label: "Strong", color: "#22c55e" },
  ];
  return { score, ...map[score] };
};

/* -- Input component ----------------------------------------------------- */
const Field = ({ label, children }) => (
  <div>
    <label
      className="block text-xs font-semibold mb-1.5"
      style={{ color: "#374151" }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white";
const inputStyle = { border: "1px solid #d1d5db", color: "#111827" };
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

/* -- RegisterPage -------------------------------------------------------- */
const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ← NEW: controls the Terms & Privacy modal
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    address: "",
    phone: "",
    age: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });

  const set = (k) => (e) => {
    setError("");
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  /* -- Step 1 validation -- */
  const nextStep = () => {
    const { username, fullName, address, phone, age, gender } = form;
    if (!username.trim()) return setError("Username is required.");
    if (!fullName.trim()) return setError("Full name is required.");
    if (!address.trim()) return setError("Address is required.");
    if (!phone.trim()) return setError("Phone number is required.");
    if (!age || isNaN(age) || +age < 1 || +age > 120)
      return setError("Please enter a valid age.");
    if (!gender) return setError("Please select a gender.");
    setError("");
    setStep(2);
  };

  /* -- Step 2: validate passwords, then show modal instead of submitting -- */
  const handleRegisterClick = () => {
    const { password, confirmPassword } = form;
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (!/[0-9]/.test(password))
      return setError("Password must contain at least one number.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    setError("");
    setShowTermsModal(true); // ← open modal; don't submit yet
  };

  /* -- Actual API call: triggered only after user accepts the modal -- */
  const handleSubmit = async () => {
    setShowTermsModal(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate("/login");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(form.password);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #dbeafe 0%, #bfdbfe 60%, #dbeafe 100%)",
      }}
    >
      <Navbar />

      {/* Terms & Privacy Modal ------------------------------------------ */}
      <TermsPrivacyModal
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleSubmit}
      />

      {/* Body */}
      <div
        className="flex-1 flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: "url('/assets/login_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Card */}
        <div
          className="w-full bg-white rounded-2xl px-7 py-8"
          style={{
            maxWidth: "420px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.13)",
          }}
        >
          {/* -- Step indicator -- */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((n) => (
              <React.Fragment key={n}>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: step >= n ? "#1e4db7" : "#e5e7eb",
                      color: step >= n ? "#fff" : "#9ca3af",
                    }}
                  >
                    {step > n ? <CheckIcon /> : n}
                  </div>
                  <span
                    className="text-xs font-medium hidden sm:block"
                    style={{ color: step >= n ? "#1e4db7" : "#9ca3af" }}
                  >
                    {n === 1 ? "Personal Info" : "Security"}
                  </span>
                </div>
                {n < 2 && (
                  <div
                    className="flex-1 h-0.5 rounded-full transition-all duration-500"
                    style={{ background: step > 1 ? "#1e4db7" : "#e5e7eb" }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* -- Header -- */}
          <div className="mb-5">
            <h2
              className="font-bold text-lg"
              style={{ color: "#111827", letterSpacing: "-0.01em" }}
            >
              {step === 1 ? "Create Your Account" : "Set Your Password"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              {step === 1
                ? "Fill in your personal details to get started."
                : "Choose a strong password to secure your account."}
            </p>
          </div>

          {/* -- Error -- */}
          {error && (
            <div
              className="mb-4 px-3 py-2 rounded-xl text-xs text-center"
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          {/* ---------------- STEP 1 ---------------- */}
          {step === 1 && (
            <div className="space-y-3.5">
              <Field label="Username">
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder=" "
                  value={form.username}
                  onChange={set("username")}
                  autoComplete="username"
                />
              </Field>
              <Field label="Full Name">
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="e.g. Juan Dela Cruz"
                  value={form.fullName}
                  onChange={set("fullName")}
                />
              </Field>

              <Field label="Address">
                <div className="relative">
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    className={`${inputCls} flex items-center justify-between text-left`}
                    style={{
                      ...inputStyle,
                      color: form.address ? "#111827" : "#9ca3af", // gray text if empty
                    }}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <span className="truncate">
                      {form.address || "Select your barangay"}
                    </span>
                    {/* Down Arrow Icon */}
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu (Forces to bottom) */}
                  {showDropdown && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <ul className="max-h-60 overflow-y-auto py-1">
                        {BAGO_BARANGAYS.map((brgy) => {
                          const fullAddress = `Barangay ${brgy}, Bago City`;
                          const isSelected = form.address === fullAddress;

                          return (
                            <li key={brgy}>
                              <button
                                type="button"
                                className="w-full text-left px-3.5 py-2.5 text-sm transition-colors hover:bg-blue-50 focus:bg-blue-100 outline-none"
                                style={{
                                  background: isSelected
                                    ? "#eff6ff"
                                    : "transparent",
                                  color: isSelected ? "#1d4ed8" : "#374151",
                                  fontWeight: isSelected ? "600" : "400",
                                }}
                                onClick={() => {
                                  // Reuses your existing set() logic by faking an event object
                                  set("address")({
                                    target: { value: fullAddress },
                                  });
                                  setShowDropdown(false); // Close menu after picking
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
              </Field>
              <Field label="Phone Number">
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder="09XX XXX XXXX"
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Age">
                  <input
                    className={inputCls}
                    style={inputStyle}
                    placeholder="e.g. 30"
                    type="number"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={set("age")}
                  />
                </Field>

                <Field label="Gender">
                  <div
                    className="flex rounded-xl overflow-hidden border"
                    style={{ borderColor: "#d1d5db" }}
                  >
                    {["Male", "Female"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setError("");
                          setForm((p) => ({ ...p, gender: g }));
                        }}
                        className="flex-1 py-2.5 text-xs font-semibold transition-all duration-200"
                        style={{
                          background: form.gender === g ? "#1e4db7" : "white",
                          color: form.gender === g ? "white" : "#6b7280",
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-2.5 rounded-xl text-white font-semibold text-sm mt-1 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95"
                style={{
                  background:
                    "linear-gradient(90deg, #1a3a8f 0%, #2563eb 100%)",
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ---------------- STEP 2 ---------------- */}
          {step === 2 && (
            // ← Note: no onSubmit here; submission is handled via the modal
            <div className="space-y-3.5">
              <Field label="Password">
                <div className="relative">
                  <input
                    className={inputCls}
                    style={{ ...inputStyle, paddingRight: "2.5rem" }}
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set("password")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background:
                              i <= strength.score ? strength.color : "#e5e7eb",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                    <ul className="mt-1.5 space-y-0.5">
                      {[
                        {
                          label: "At least 8 characters",
                          ok: form.password.length >= 8,
                        },
                        {
                          label: "One number (0–9)",
                          ok: /[0-9]/.test(form.password),
                        },
                      ].map(({ label, ok }) => (
                        <li
                          key={label}
                          className="flex items-center gap-1 text-xs"
                          style={{ color: ok ? "#22c55e" : "#ef4444" }}
                        >
                          <span>{ok ? "✓" : "✗"}</span>
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Field>

              <Field label="Confirm Password">
                <div className="relative">
                  <input
                    className={inputCls}
                    style={{ ...inputStyle, paddingRight: "2.5rem" }}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {form.confirmPassword && (
                  <p
                    className="text-xs mt-1"
                    style={{
                      color:
                        form.password === form.confirmPassword
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    {form.password === form.confirmPassword
                      ? "✓ Passwords match"
                      : "✗ Passwords do not match"}
                  </p>
                )}
              </Field>

              {/* Terms notice — reassures the user what's coming */}
              <p
                className="text-xs text-center leading-relaxed"
                style={{ color: "#9ca3af" }}
              >
                By registering you agree to our{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="hover:underline font-semibold"
                  style={{
                    color: "#3b82f6",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Terms &amp; Privacy Policy
                </button>
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-gray-100 active:scale-95"
                  style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  ← Back
                </button>

                {/* ← Clicks open the modal, not the form */}
                <button
                  type="button"
                  onClick={handleRegisterClick}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(90deg, #1a3a8f 0%, #2563eb 100%)",
                    flex: 2,
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
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
                      Registering…
                    </span>
                  ) : (
                    "Register"
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-center mt-4" style={{ color: "#9ca3af" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: "#3b82f6" }}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
