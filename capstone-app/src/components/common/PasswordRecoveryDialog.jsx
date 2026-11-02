import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import * as authService from "@/services/authService";

/* ---------- styles ---------- */

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:outline-2 focus:outline-blue-600 disabled:bg-slate-50";
const inputInvalidClass = "border-red-400 bg-red-50 focus:outline-red-600";
const buttonClass =
  "flex w-full items-center justify-center gap-2 rounded-full bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
const labelClass = "block text-sm font-semibold text-slate-700";
const linkButtonClass =
  "w-full rounded-lg py-2 text-sm font-semibold disabled:cursor-not-allowed";

/* ---------- shared alert (used for every error / success message) ---------- */

const ALERT_VARIANTS = {
  error: {
    Icon: AlertCircle,
    role: "alert",
    className: "border-red-300 bg-red-50 text-red-900",
  },
  success: {
    Icon: CheckCircle2,
    role: "status",
    className: "border-green-300 bg-green-50 text-green-900",
  },
};

function Alert({ variant = "error", id, children }) {
  const { Icon, role, className } = ALERT_VARIANTS[variant];
  return (
    <div
      id={id}
      role={role}
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${className}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/* ---------- constants ---------- */

const maskPhone = (value) => {
  // Normalize +63 / 63 prefixes to the local 09 format, drop spaces and dashes
  const digits = value.replace(/[\s-]/g, "").replace(/^\+?63/, "0");
  if (digits.length <= 5) return "•".repeat(digits.length);
  return digits.slice(0, 2) + "•".repeat(digits.length - 5) + digits.slice(-3);
};

const STEP_INTRO = {
  phone: () => "Enter the mobile number registered to your patient account.",
  code: (phone) =>
    `Enter the four-digit code sent to ${maskPhone(phone)}. It expires after five minutes. You have three attempts.`,
  password: () =>
    "Your phone number is verified. Choose a new password within five minutes.",
};

const SUBMIT_LABEL = {
  phone: "Send code",
  code: "Verify code",
  password: "Save new password",
};

const EXPIRED_MESSAGE = {
  code: "This code expired. Request a new code.",
  password: "Your recovery session expired. Start again to request a new code.",
};

const EMPTY_FLOW = {
  recoveryId: "",
  resetToken: "",
  otp: "",
  password: "",
  confirm: "",
};

/* ---------- component ---------- */

export default function PasswordRecoveryDialog({ onClose }) {
  const [dialog, setDialog] = useState(null); // callback ref → effect runs once node exists
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [fields, setFields] = useState(EMPTY_FLOW);
  const [resendAt, setResendAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shaking, setShaking] = useState(false);

  const setField = (name) => (event) =>
    setFields((prev) => ({ ...prev, [name]: event.target.value }));

  // Modal lifecycle + focus restore
  useEffect(() => {
    if (!dialog) return;
    const previouslyFocused = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previouslyFocused?.focus();
    };
  }, [dialog]);

  // Countdown tick (resend timer + expiry)
  useEffect(() => {
    if (step !== "code" && step !== "password") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expired = expiresAt > 0 && now >= expiresAt;
  const phoneInvalid = step === "phone" && Boolean(error);

  const startExpiry = (seconds) => {
    const current = Date.now();
    setNow(current);
    setExpiresAt(current + seconds * 1000);
    return current;
  };

  const sendCode = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await authService.requestPasswordRecovery(phone);
      const current = startExpiry(result.expires_in);
      setFields({ ...EMPTY_FLOW, recoveryId: result.recovery_id });
      setResendAt(current + result.resend_after * 1000);
      setStep("code");
      setNotice("Your recovery code has been queued for SMS delivery.");
    } catch (err) {
      setError(err.message);
      if (step === "phone") setShaking(true);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (step === "phone") return sendCode();

    setError("");
    setNotice("");
    if (step === "password" && fields.password !== fields.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (step === "code") {
        const result = await authService.verifyPasswordRecovery(
          fields.recoveryId,
          fields.otp,
        );
        startExpiry(result.expires_in);
        setFields((prev) => ({
          ...prev,
          otp: "",
          resetToken: result.reset_token,
        }));
        setStep("password");
      } else {
        await authService.resetRecoveredPassword(
          fields.recoveryId,
          fields.resetToken,
          fields.password,
        );
        setFields(EMPTY_FLOW);
        setStep("success");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setStep("phone");
    setFields(EMPTY_FLOW);
    setError("");
    setNotice("");
    setExpiresAt(0);
  };

  const errorId = "recovery-error";
  const describedBy = error ? errorId : undefined;

  return (
    <dialog
      ref={setDialog}
      aria-labelledby="recovery-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="recovery-title" className="text-xl font-bold text-slate-900">
          {step === "success" ? "Password changed" : "Recover your account"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close password recovery"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {step === "success" ? (
        <div className="space-y-5">
          <Alert variant="success">
            Your password was changed successfully. Please log in with your new
            password. Your previous sessions have been signed out.
          </Alert>
          <button type="button" onClick={onClose} className={buttonClass}>
            Back to login
          </button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">
            {STEP_INTRO[step](phone)}
          </p>

          <div className="mb-4 space-y-3 empty:hidden">
            {error && (
              <Alert variant="error" id={errorId}>
                {error}
              </Alert>
            )}
            {expired && <Alert variant="error">{EXPIRED_MESSAGE[step]}</Alert>}
            {notice && <Alert variant="success">{notice}</Alert>}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {step === "phone" && (
              <label className={labelClass}>
                Registered mobile number
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  maxLength={25}
                  onChange={(event) => setPhone(event.target.value)}
                  onAnimationEnd={() => setShaking(false)}
                  required
                  placeholder="09XXXXXXXXX"
                  aria-invalid={phoneInvalid}
                  aria-describedby={phoneInvalid ? errorId : undefined}
                  disabled={busy}
                  className={[
                    inputClass,
                    phoneInvalid && inputInvalidClass,
                    shaking && "motion-safe:animate-shake",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              </label>
            )}

            {step === "code" && (
              <label className={labelClass}>
                Four-digit code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={fields.otp}
                  pattern="[0-9]{4}"
                  maxLength={4}
                  onChange={(event) =>
                    setFields((prev) => ({
                      ...prev,
                      otp: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  required
                  aria-describedby={describedBy}
                  disabled={busy || expired}
                  className={`${inputClass} tracking-[0.5em]`}
                />
              </label>
            )}

            {step === "password" && (
              <>
                <label className={labelClass}>
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={fields.password}
                    onChange={setField("password")}
                    minLength={8}
                    maxLength={72}
                    required
                    aria-describedby="password-hint"
                    disabled={busy || expired}
                    className={inputClass}
                  />
                </label>
                <p id="password-hint" className="text-xs text-slate-500">
                  Use at least eight characters, including a number.
                </p>
                <label className={labelClass}>
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={fields.confirm}
                    onChange={setField("confirm")}
                    minLength={8}
                    maxLength={72}
                    required
                    aria-describedby={describedBy}
                    disabled={busy || expired}
                    className={inputClass}
                  />
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={busy || (step !== "phone" && expired)}
              className={buttonClass}
            >
              {busy && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {busy ? "Please wait…" : SUBMIT_LABEL[step]}
            </button>
          </form>

          {step === "code" && (
            <button
              type="button"
              disabled={busy || resendSeconds > 0}
              onClick={sendCode}
              className={`mt-4 ${linkButtonClass} text-blue-800 hover:bg-blue-50 disabled:text-slate-400`}
            >
              {resendSeconds > 0
                ? `Resend code in ${resendSeconds}s`
                : "Resend code"}
            </button>
          )}

          {step !== "phone" && (
            <button
              type="button"
              onClick={restart}
              disabled={busy}
              className={`mt-2 ${linkButtonClass} text-slate-600 hover:underline`}
            >
              {step === "code" ? "Use another number" : "Start again"}
            </button>
          )}

          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
            Cannot access your registered number or receive a code? Visit clinic
            reception for identity verification and account recovery. Never
            share your code or password.
          </p>
        </>
      )}
    </dialog>
  );
}
