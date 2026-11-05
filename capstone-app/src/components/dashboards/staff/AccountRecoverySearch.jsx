import useLiveData from "@/hooks/useLiveData";
import { useCallback, useState } from "react";
import { Phone, User } from "lucide-react";
import api from "@/services/api";
import AccountRecovery from "./AccountRecovery";

const REQUIRED_PROFILE_FIELDS = ["first_name", "last_name", "barangay", "city"];
const MIN_NAME_LENGTH = 2;
const MIN_PHONE_DIGITS = 4;

const isRecoveryEligible = (patient) =>
  !!patient?.account?.is_active &&
  !patient.archived_into_patient_id &&
  !!patient.account.phone &&
  !!patient.date_of_birth &&
  REQUIRED_PROFILE_FIELDS.every((key) => patient[key]?.trim());

const looksLikePhoneNumber = (value) => /^\+?[\d\s-]+$/.test(value);

const validateSearchTerm = (value) => {
  if (looksLikePhoneNumber(value)) {
    return value.replace(/\D/g, "").length >= MIN_PHONE_DIGITS
      ? ""
      : "Enter at least two name characters or four mobile number digits.";
  }
  return value.length >= MIN_NAME_LENGTH
    ? ""
    : "Enter at least two name characters or four mobile number digits.";
};

const getDisplayName = (patient) =>
  [patient.first_name, patient.last_name].filter(Boolean).join(" ") ||
  "Unnamed patient";

export default function AccountRecoverySearch() {
  const [term, setTerm] = useState("");
  const [matches, setMatches] = useState(null);
  const [query, setQuery] = useState(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const resetResults = () => {
    setQuery(null);
    setBusy(false);
    setMatches(null);
    setError("");
  };

  const search = (event) => {
    event.preventDefault();
    const value = term.trim();
    const validationError = validateSearchTerm(value);
    if (validationError) { setError(validationError); return; }
    setBusy(true); setError(''); setMatches(null);
    setQuery(new URLSearchParams({ [looksLikePhoneNumber(value) ? 'phone' : 'name']: value }).toString());
    setSearchVersion(version => version + 1);
  };
  useLiveData(useCallback(async (signal, background) => {
    if (!background) setBusy(true);
    try {
      const result = await api.get('/patients/search?' + query, { signal });
      if (!signal.aborted) { setMatches(result.data || []); setError(''); }
    } catch (err) { if (!signal.aborted) setError(err.message); }
    finally { if (!signal.aborted) setBusy(false); }
  }, [query]), query !== null && selected === null, searchVersion);

  const openPatient = async (patientId) => {
    if (opening) return;

    setOpening(true);
    setError("");

    try {
      const result = await api.get(`/patients/${patientId}`);
      setSelected(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setOpening(false);
    }
  };

  const handleRecovered = (version) =>
    setSelected((previous) => ({
      ...previous,
      account: { ...previous.account, credential_version: version },
    }));

  return (
    <section
      id="account-recovery-search"
      aria-labelledby="recovery-search-title"
      className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"
    >
      <h2
        id="recovery-search-title"
        className="text-lg font-bold text-[#1a3a8f]"
      >
        Find a patient for account recovery
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Open the patient's profile to verify their identity in person before
        issuing a temporary password.
      </p>

      <form onSubmit={search} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="recovery-search"
            className="block text-sm font-semibold text-slate-700"
          >
            Patient name or mobile number
          </label>
          <input
            id="recovery-search"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              resetResults();
            }}
            disabled={busy}
            autoComplete="off"
            maxLength={100}
            aria-describedby="recovery-search-help"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-2 focus:outline-blue-600"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {busy ? "Searching…" : "Search patients"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {matches?.length === 0 && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          No matching patient records.
        </p>
      )}

      {!!matches?.length && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((patient) => (
            <li key={patient.patient_id}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => openPatient(patient.patient_id)}
                className="flex h-full w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm text-blue-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <User
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-[#1a3a8f]">
                    {getDisplayName(patient)}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                    <Phone
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    {patient.masked_contact ?? "No phone number"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <AccountRecovery
          patient={selected}
          eligible={isRecoveryEligible(selected)}
          onClose={() => setSelected(null)}
          onRecovered={handleRecovered}
        />
      )}
    </section>
  );
}
