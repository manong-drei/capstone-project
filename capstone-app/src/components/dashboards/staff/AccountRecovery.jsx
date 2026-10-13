import { useEffect, useState } from "react";
import api from "@/services/api";

const CHECKS = [
  ["patient_present", "The patient is physically present at the clinic."],
  ["first_name", "First name matches the patient record."],
  ["last_name", "Last name matches the patient record."],
  ["phone", "Phone number matches the registered login number."],
  ["address", "Address matches the recorded barangay and city."],
  ["date_of_birth", "Birthday matches the patient record."],
];
const buttonClass = "rounded-xl border border-blue-700 px-4 py-2.5 text-sm font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

export default function AccountRecovery({ patient, onRecovered }) {
  const [open, setOpen] = useState(false);
  const [verification, setVerification] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const eligible = !!patient.account?.is_active && !patient.archived_into_patient_id &&
    !!patient.account.phone && !!patient.date_of_birth &&
    ["first_name", "last_name", "barangay", "city"].every((key) => patient[key]?.trim());
  const verified = CHECKS.every(([key]) => verification[key] === true);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), Math.max(0, new Date(result.expires_at).getTime() - Date.now()));
    return () => clearTimeout(timer);
  }, [result]);

  const close = () => {
    setOpen(false);
    setVerification({});
    setResult(null);
    setError("");
  };

  const recover = async () => {
    if (busy || !eligible || !verified || !window.confirm("Issue a temporary password for this patient? Their old password and all existing sessions will be invalidated. Confirm that you have verified their identity in person.")) return;
    setBusy(true);
    setError("");
    const version = patient.account.credential_version;
    try {
      const response = await api.post(`/patients/${patient.patient_id}/account-recovery`, {
        expected_credential_version: version,
        verification,
      });
      setResult(response.data);
      setVerification({});
      onRecovered(version + 1);
    } catch (err) { setError(err.message); setVerification({}); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="account-recovery-title" className="mt-6 rounded-xl border border-blue-200 bg-white p-5 text-slate-700">
    <h2 id="account-recovery-title" className="text-lg font-bold text-[#1a3a8f]">Account recovery</h2>
    {!eligible && <p className="mt-2 text-sm">Recovery requires an active patient account and a complete identity record. Ask an admin to resolve missing details or account status.</p>}
    {!open && <button type="button" disabled={!eligible} onClick={() => setOpen(true)} className={`${buttonClass} mt-3`}>Start account recovery</button>}
    {open && <>
      {result ? <div role="status" className="mt-4 rounded-xl bg-blue-50 p-4">
        <p className="font-semibold">Hand this temporary password directly to the verified patient.</p>
        <p className="mt-2">Registered login number: <strong>{result.registered_phone}</strong></p>
        <p className="mt-2">Temporary password: <strong className="font-mono text-2xl tracking-widest">{result.temp_password}</strong></p>
        <p className="mt-2 text-sm">Expires: {new Date(result.expires_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })} (Philippine time).</p>
        <p className="mt-2 text-sm">Valid for one login. The patient must then choose a new password within 15 minutes. Closing this section hides the password permanently.</p>
      </div> : <>
        <p className="mt-3 text-sm">Ask the patient to provide their details and confirm each match. Stop if anything differs or their identity remains uncertain.</p>
        <p className="mt-2 text-sm">Registered login number: <strong>{patient.account.phone}</strong></p>
        <fieldset disabled={busy} className="mt-4 space-y-3">
          <legend className="mb-2 font-semibold">Identity verification</legend>
          {CHECKS.map(([key, label]) => <label key={key} className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={verification[key] === true} onChange={(event) => setVerification((previous) => ({ ...previous, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-blue-700" />
            <span>{label}</span>
          </label>)}
        </fieldset>
        <p className="mt-4 text-sm">Issuing a password signs out existing sessions. The temporary password expires in 30 minutes and works for one login.</p>
      </>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {!result && <button type="button" onClick={recover} disabled={busy || !eligible || !verified} className={`${buttonClass} bg-blue-700 text-white`}>{busy ? "Issuing…" : "Issue temporary password"}</button>}
        <button type="button" onClick={close} disabled={busy} className={buttonClass}>{result ? "Hide temporary password" : "Close recovery"}</button>
      </div>
    </>}
  </section>;
}
