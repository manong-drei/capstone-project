import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";

export default function AccountRecoverySearch() {
  const [term, setTerm] = useState("");
  const [matches, setMatches] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const search = async (event) => {
    event.preventDefault();
    const value = term.trim();
    const phoneSearch = /^\+?[\d\s-]+$/.test(value);
    if ((!phoneSearch && value.length < 2) || (phoneSearch && value.replace(/\D/g, "").length < 4)) {
      setError("Enter at least two name characters or four mobile number digits.");
      return;
    }
    setBusy(true);
    setError("");
    setMatches(null);
    try {
      const params = new URLSearchParams({ [phoneSearch ? "phone" : "name"]: value });
      const result = await api.get(`/patients/search?${params}`);
      setMatches(result.data || []);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <section id="account-recovery-search" aria-labelledby="recovery-search-title" className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
    <h2 id="recovery-search-title" className="text-lg font-bold text-[#1a3a8f]">Find a patient for account recovery</h2>
    <p className="mt-2 text-sm text-slate-600">Open the patient's profile to verify their identity in person before issuing a temporary password.</p>
    <form onSubmit={search} className="mt-4 flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <label htmlFor="recovery-search" className="block text-sm font-semibold text-slate-700">Patient name or mobile number</label>
        <input id="recovery-search" value={term} onChange={(event) => { setTerm(event.target.value); setMatches(null); setError(""); }} disabled={busy} autoComplete="off" maxLength={100} aria-describedby="recovery-search-help" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-2 focus:outline-blue-600" />
      </div>
      <button type="submit" disabled={busy} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50">{busy ? "Searching…" : "Search patients"}</button>
    </form>
    <p id="recovery-search-help" className="mt-2 text-xs text-slate-500">Use a name or any four or more mobile number digits.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {matches?.length === 0 && <p role="status" className="mt-3 text-sm text-slate-600">No matching patient records.</p>}
    {!!matches?.length && <ul className="mt-4 space-y-2">
      {matches.map((patient) => <li key={patient.patient_id}>
        <Link to={`/staff/patients/${patient.patient_id}`} className="block rounded-xl border border-slate-200 p-3 text-sm text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">
          <span className="font-semibold">{[patient.first_name, patient.middle_name, patient.last_name, patient.suffix].filter(Boolean).join(" ")}</span> · {patient.masked_contact || "No mobile recorded"}
          {patient.date_of_birth && <span className="block mt-1 text-xs text-slate-600">Birthday: {new Date(patient.date_of_birth).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}</span>}
        </Link>
      </li>)}
    </ul>}
  </section>;
}
