import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Phone,
  UserKey,
  UserRound,
  X,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";

export default function AccountRecovery({
  returnFocusRef,
  patient,
  member,
  eligible,
  onRecovered,
  onClose,
}) {
  const { expired, token } = useAuth();
  const account = patient?.account ?? member;
  const person = patient ?? member;
  const dialogRef = useRef(null);
  const passwordRef = useRef(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [changePhone, setChangePhone] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  if (expired && !interrupted) {
    setInterrupted(true);
    setPassword("");
    setShowPassword(false);
    setResult(null);
  } else if (!expired && interrupted) setInterrupted(false);
  const canDiscard = useUnsavedChanges(!result && Boolean(newPhone || verified), busy);
  const close = async () => { if (await canDiscard()) onClose(); };
  const name = [
    person.first_name,
    person.middle_name,
    person.last_name,
    person.suffix,
  ]
    .filter(Boolean)
    .join(" ");
  const initials =
    [person.first_name?.[0], person.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  const birthDate = patient?.date_of_birth
    ? new Date(patient.date_of_birth)
    : null;
  const details = patient ? [
    {
      label: "Date of birth",
      value:
        birthDate && !Number.isNaN(birthDate.getTime())
          ? birthDate.toLocaleDateString("en-PH", {
              timeZone: "Asia/Manila",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Not recorded",
      Icon: CalendarDays,
    },
    {
      label: "Gender",
      value: patient.gender || "Not recorded",
      Icon: UserRound,
    },
    {
      label: "Mobile number",
      value: patient.contact_number || "Not recorded",
      Icon: Phone,
      fullWidth: true,
    },
    {
      label: "Address",
      value:
        [patient.barangay, patient.city].filter(Boolean).join(", ") ||
        "Not recorded",
      Icon: MapPin,
      fullWidth: true,
    },
  ] : [{ label: "Role", value: member.role, Icon: UserRound }];

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = returnFocusRef?.current || document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    passwordRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [returnFocusRef]);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(
      () => setResult(null),
      Math.max(0, new Date(result.expires_at).getTime() - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [result]);

  const recover = async (event) => {
    event.preventDefault();
    if (busy || expired || !eligible || !password || ((member || changePhone) && !verified) ||
        (changePhone && !newPhone.trim())) return;
    setBusy(true);
    setError("");
    const version = account.credential_version;
    try {
      const response = await api.post(
        patient ? `/patients/${patient.patient_id}/account-recovery` : `/admin/staff/${member.user_id}/account-recovery`,
        patient ? {
          expected_credential_version: version,
          confirmed_phone: account.phone,
          staff_password: password,
          ...(changePhone && { new_phone: newPhone.trim(), new_phone_verified: true }),
        } : {
          expected_credential_version: version,
          staff_password: password,
          identity_confirmed: true,
        },
      );
      onRecovered(version + 1, response.data.registered_phone);
      if (sessionStorage.getItem("ek_token") !== token) return;
      setResult(response.data);
      setNewPhone("");
      setVerified(false);
      setChangePhone(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPassword("");
      setShowPassword(false);
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="account-recovery-panel"
      aria-labelledby="account-recovery-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_1.5rem)] w-[calc(100%_-_1.5rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-0 font-[Poppins,sans-serif] text-slate-700 shadow-2xl shadow-slate-900/10 backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1a3a8f]">
            <UserKey size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="account-recovery-title"
              className="text-base font-semibold text-[#1a3a8f]"
            >
              {member ? "Workforce account recovery" : "Account recovery"}
            </h2>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close recovery"
          disabled={busy}
          onClick={close}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-[#1a3a8f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="grid min-w-0 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        {/* Patient details */}
        <section
          aria-labelledby="recovery-personal-info"
          className="min-w-0 border-b border-slate-200 p-5 sm:border-r sm:border-b-0 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-[#1a3a8f]"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                {patient ? `Patient #${patient.patient_id}` : `Account #${member.user_id}`}
              </p>
              <h3 className="mt-0.5 text-base font-semibold text-slate-900 [overflow-wrap:anywhere]">
                {name}
              </h3>
            </div>
          </div>
          <h3
            id="recovery-personal-info"
            className="mt-6 text-sm font-semibold text-slate-900"
          >
            Personal information
          </h3>
          <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-4">
            {details.map((detail) => (
              <div
                key={detail.label}
                className={`min-w-0 ${detail.fullWidth ? "col-span-2" : ""}`}
              >
                <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                  <detail.Icon
                    size={14}
                    className="shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  {detail.label}
                </dt>
                <dd className="mt-1 text-sm font-medium leading-relaxed text-slate-900 [overflow-wrap:anywhere]">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Action */}
        <div className="min-w-0 p-5 sm:p-6">
          {result ? (
            <div role="status" className="space-y-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2
                  size={18}
                  className="shrink-0 text-[#1a3a8f]"
                  aria-hidden="true"
                />
                <span>Temporary password issued</span>
              </p>
              <p className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-6 text-center font-mono text-3xl font-bold tracking-[0.2em] text-orange-700 [overflow-wrap:anywhere]">
                {result.temp_password}
              </p>
              <div className="space-y-2 text-xs leading-relaxed text-slate-600">
                <p>Registered login number <strong>{result.registered_phone}</strong></p>
                <p>
                  Hand this password directly to the account holder. It works for one
                  login until{" "}
                  {new Date(result.expires_at).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}{" "}
                  (Philippine time).
                </p>
                <p>
                  The account holder must choose a new password after login.{" "}
                  <span className="font-medium text-slate-900">
                    Closing this window hides the temporary password
                    permanently.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={recover} className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Issue a temporary password
                </h3>
              </div>
              {(member || changePhone) && <p className="text-sm text-slate-600">Registered login number <strong>{account.phone}</strong></p>}
              {patient && (
                <button type="button" aria-expanded={changePhone} disabled={busy} className="text-sm font-semibold text-blue-700 underline"
                  onClick={async () => {
                    if (changePhone && newPhone && !await canDiscard()) return;
                    setChangePhone(!changePhone);
                    setNewPhone("");
                    setVerified(false);
                  }}>
                  {changePhone ? "Keep current registered number" : "Change registered number"}
                </button>
              )}
              {changePhone && (
                <label className="block text-sm font-medium">
                  New registered mobile number
                  <input required type="tel" autoComplete="off" value={newPhone} disabled={busy}
                    onChange={(event) => { setNewPhone(event.target.value); setVerified(false); }}
                    className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" />
                </label>
              )}
              {(member || changePhone) && (
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" required checked={verified} disabled={busy}
                    onChange={(event) => setVerified(event.target.checked)} />
                  {changePhone
                    ? "I verified the patient’s identity and confirmed they have the new phone in person."
                    : "I verified the account holder’s identity in person."}
                </label>
              )}
              <div>
                <label
                  htmlFor="recovery-staff-password"
                  className="text-sm font-medium text-slate-900"
                >
                  Your password
                </label>
                <div className="relative mt-2">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    ref={passwordRef}
                    id="recovery-staff-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your staff password"
                    autoComplete="current-password"
                    maxLength={128}
                    value={password}
                    disabled={busy}
                    aria-describedby={`recovery-password-hint${error ? " recovery-error" : ""}`}
                    aria-invalid={error ? true : undefined}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pr-12 pl-11 text-base text-slate-900 transition-colors placeholder:text-sm placeholder:text-slate-400 hover:border-slate-400 focus:border-[#1a3a8f] focus:outline-2 focus:outline-[#1a3a8f]/25 disabled:bg-slate-50 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide staff password"
                        : "Show staff password"
                    }
                    disabled={busy}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-[#1a3a8f] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <p
                  id="recovery-error"
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              <p id="recovery-password-hint" className="rounded-xl bg-orange-50 px-3.5 py-3 text-xs leading-relaxed text-orange-900">
                Issuing a password replaces the old password and signs out
                existing sessions. The temporary password expires in{" "}
                <strong className="font-semibold">30 minutes</strong> and works
                for <strong className="font-semibold">one login</strong>.
              </p>
              <button
                type="submit"
                disabled={busy || !eligible || !password || ((member || changePhone) && !verified) || (changePhone && !newPhone.trim())}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a3a8f] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-700"
              >
                {busy ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <KeyRound size={18} aria-hidden="true" />
                )}
                {busy ? "Issuing…" : "Issue temporary password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}
