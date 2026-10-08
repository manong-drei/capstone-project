import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, LoaderCircle, Phone, Search, UserPlus, UserRound, X } from "lucide-react";
import { DENTAL_SERVICES as SERVICES } from "@/constants/medicalServices";
import api from "@/services/api";

const inputClass = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
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

export default function WalkInForm({ onSuccess }) {

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    contact: "",
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [priorityCategory, setPriorityCategory] = useState("");
  const [lookup, setLookup] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (selectedPatient) return;
    const term = lookup.trim();
    const digits = (term || form.contact).replace(/\D/g, "");
    const phone = digits.length === 10 && digits.startsWith("9") ? `0${digits}` : digits;
    if (term.length < 2 && form.fullName.trim().length < 2 && phone.length < 10 && !form.dateOfBirth) {
      const reset = setTimeout(() => { setMatches([]); setSearching(false); }, 0);
      return () => clearTimeout(reset);
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams();
        if (term) {
          if (phone.length >= 10 && /^\+?[\d\s-]+$/.test(term)) params.set("phone", phone);
          else params.set("name", term);
        } else {
          if (form.fullName.trim().length >= 2) params.set("name", form.fullName.trim());
          if (phone.length >= 10) params.set("phone", phone);
        }
        if (form.dateOfBirth) params.set("date_of_birth", form.dateOfBirth);
        const res = await api.get(`/patients/search?${params}`);
        if (active) setMatches(res.data || []);
      } catch { if (active) setMatches([]); }
      finally { if (active) setSearching(false); }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [lookup, form.fullName, form.contact, form.dateOfBirth, selectedPatient]);

  const selectPatient = async (id) => {
    setError("");
    try {
      const { data } = await api.get(`/patients/${id}`);
      setSelectedPatient(data);
      setForm({
        fullName: `${data.first_name} ${data.last_name}`,
        dateOfBirth: String(data.date_of_birth || "").slice(0, 10),
        gender: String(data.gender || "").toLowerCase(),
        address: data.barangay || "",
        contact: String(data.contact_number || "").replace(/^(\+?63|0)/, ""),
      });
      setMatches([]);
      setLookup("");
      setSearching(false);
      setConfirmNew(false);
    } catch (err) { setError(err.message); }
  };

  const set = (field) => (event) => {
    setError("");
    setSuccess("");
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setConfirmNew(false);
  };

  const toggleService = (id) => {
    setError("");
    setSuccess("");
    setSelectedServices((previous) => previous.includes(id) ? previous.filter((service) => service !== id) : [...previous, id]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.fullName.trim()) return setError("Full name is required.");
    if (!form.dateOfBirth) return setError("Date of birth is required.");
    if (new Date(form.dateOfBirth) > new Date()) return setError("Date of birth cannot be in the future.");
    if (!form.gender) return setError("Please select a gender.");
    if (!form.address.trim()) return setError("Address is required.");
    if (!/^9\d{9}$/.test(form.contact)) return setError("Enter a valid 10-digit mobile number starting with 9.");
    if (!selectedPatient && matches.length && !confirmNew) return setError("Possible patient match found. Select a record or confirm a new one below.");
    if (!selectedServices.length || selectedServices.length > 2) return setError("Select one or two dental services.");
    if (isPriority && !priorityCategory) return setError("Please select a priority category.");
    setLoading(true);
    try {
      const res = await api.post("/queue/walkin", {
        full_name: form.fullName,
        date_of_birth: form.dateOfBirth,
        gender: form.gender,
        address: form.address,
        contact: "+63" + form.contact,
        patient_id: selectedPatient?.patient_id,
        create_new_confirmed: confirmNew,
        priority_category: isPriority ? priorityCategory : null,
        type: isPriority ? "priority" : "regular",
        category: "dental",
        services: selectedServices,
      });
      setSuccess(`Dental walk-in registered — queue number ${res.queue.queue_number}. Initial position: ${res.queue.sms_initial_position}. ` +
        (res.queue.sms_alert_state === "suppressed"
          ? "Tell the patient: Please stay nearby; no queue SMS will be sent."
          : "Tell the patient: One SMS will be sent as your turn approaches. Order may change."));
      setForm({ fullName: "", dateOfBirth: "", gender: "", address: "", contact: "" });
      setSelectedServices([]);
      setIsPriority(false);
      setPriorityCategory("");
      setSelectedPatient(null);
      setMatches([]);
      setLookup("");
      setConfirmNew(false);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to register patient.");
      if (err.message?.includes("Possible existing patient")) setLookup(form.fullName);
    } finally {
      setLoading(false);
    }
  };

  const dentalVisits = selectedPatient?.visits?.filter((visit) => visit.category === "dental") ?? [];

  return (
    <section id="walk-in-registration" aria-labelledby="walk-in-title" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-700"><UserPlus size={20} aria-hidden="true" /></span>
        <div><h3 id="walk-in-title" className="text-sm font-semibold text-slate-900">Register dental walk-in</h3><p className="mt-1 text-xs text-slate-500">Find an existing record before creating a new patient.</p></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 p-5" aria-label="Dental walk-in registration">
        <fieldset disabled={loading} className="min-w-0 space-y-5">
          <div>
            <label htmlFor="patient-lookup" className="mb-1.5 block text-xs font-semibold text-slate-700">Find an existing patient</label>
            <div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden="true" />
              <input id="patient-lookup" value={lookup} onChange={(event) => { setLookup(event.target.value); setConfirmNew(false); }} disabled={!!selectedPatient} placeholder="Search name or mobile number" autoComplete="off" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            </div>
            {searching && <p role="status" className="mt-2 flex items-center gap-2 text-xs text-slate-500"><LoaderCircle size={14} className="animate-spin" aria-hidden="true" />Searching patient records…</p>}
            {!selectedPatient && matches.length > 0 && (
              <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900">Possible existing patients</p>
                {matches.map((patient) => <button key={patient.patient_id} type="button" onClick={() => selectPatient(patient.patient_id)} className="block w-full rounded-lg border border-amber-100 bg-white px-3 py-2 text-left text-xs leading-relaxed text-slate-700 hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-600">{patient.first_name} {patient.last_name} · {String(patient.date_of_birth || "").slice(0, 10)} · {patient.masked_contact || "No phone"}</button>)}
                <label className="flex items-start gap-2 pt-1 text-xs leading-relaxed text-amber-900"><input type="checkbox" checked={confirmNew} onChange={(event) => setConfirmNew(event.target.checked)} className="mt-0.5 accent-blue-700" />I checked these records; create a new patient.</label>
              </div>
            )}
            {selectedPatient && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Returning patient #{selectedPatient.patient_id}</p><button type="button" onClick={() => { setSelectedPatient(null); setForm({ fullName: "", dateOfBirth: "", gender: "", address: "", contact: "" }); }} className="flex items-center gap-1 rounded-md p-1 hover:bg-blue-100"><X size={14} aria-hidden="true" />Clear selection</button></div>
              <Link to={`/staff/patients/${selectedPatient.patient_id}`} className="mt-2 inline-block font-medium underline underline-offset-2">Open patient profile</Link>
              <p className="mt-2 font-medium">Previous dental visits: {dentalVisits.length}</p>
              {dentalVisits.slice(0, 3).map((visit) => <p key={visit.id} className="mt-1 text-blue-700">{new Date(visit.created_at).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })} · {visit.queue_number} · {visit.status}</p>)}
            </div>}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-900"><UserRound size={16} className="text-blue-700" aria-hidden="true" />Patient details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label htmlFor="walkin-name" className="mb-1.5 block text-xs font-medium text-slate-600">Full name</label><input id="walkin-name" required autoComplete="name" value={form.fullName} onChange={set("fullName")} placeholder="First and last name" className={inputClass} /></div>
              <div><label htmlFor="walkin-dob" className="mb-1.5 block text-xs font-medium text-slate-600">Date of birth</label><input id="walkin-dob" type="date" required value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inputClass} /></div>
              <div><label htmlFor="walkin-gender" className="mb-1.5 block text-xs font-medium text-slate-600">Gender</label><select id="walkin-gender" required value={form.gender} onChange={set("gender")} className={inputClass}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              <div className="sm:col-span-2"><label htmlFor="walkin-address" className="mb-1.5 block text-xs font-medium text-slate-600">Barangay, Bago City</label><select id="walkin-address" required value={form.address} onChange={set("address")} className={inputClass}><option value="">Select barangay</option>{form.address && !BAGO_BARANGAYS.some((name) => form.address === `Barangay ${name}, Bago City`) && <option value={form.address}>{form.address}</option>}{BAGO_BARANGAYS.map((name) => <option key={name} value={`Barangay ${name}, Bago City`}>{name}</option>)}</select></div>
              <div className="sm:col-span-2"><label htmlFor="walkin-contact" className="mb-1.5 block text-xs font-medium text-slate-600">Confirmed mobile number</label><div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"><span className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"><Phone size={14} aria-hidden="true" />+63</span><input id="walkin-contact" type="tel" required inputMode="numeric" pattern="9[0-9]{9}" maxLength={10} value={form.contact} onChange={set("contact")} placeholder="9XXXXXXXXX" aria-describedby="walkin-contact-help" className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none" /></div><p id="walkin-contact-help" className="mt-1.5 text-[11px] text-slate-500">Confirm this number with the patient before registration.</p></div>
            </div>
          </div>
          <fieldset className="rounded-xl border border-slate-200 p-3">
            <legend className="px-1 text-xs font-semibold text-slate-700">Dental services <span className="font-normal text-slate-400">· Select up to 2</span></legend>
            <div className="grid max-h-48 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">{SERVICES.map(({ id, label, group }) => <label key={id} className={`flex items-start gap-2 rounded-lg p-2 text-xs leading-relaxed transition ${selectedServices.includes(id) ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50"}`}><input type="checkbox" checked={selectedServices.includes(id)} onChange={() => toggleService(id)} disabled={!selectedServices.includes(id) && selectedServices.length >= 2} className="mt-0.5 shrink-0 accent-blue-700" /><span>{label}{group && <span className="block text-[10px] text-slate-400">{group}</span>}</span></label>)}</div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-slate-700">Queue type</legend>
            <div className="grid grid-cols-2 gap-2">{[{ value: false, label: "Regular" }, { value: true, label: "Priority" }].map(({ value, label }) => <label key={label} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${isPriority === value ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600"}`}><input type="radio" name="walkin-queue-type" checked={isPriority === value} onChange={() => { setIsPriority(value); setPriorityCategory(""); setError(""); }} className="accent-blue-700" />{label}</label>)}</div>
            {isPriority && <div className="mt-3"><label htmlFor="walkin-priority" className="mb-1.5 block text-xs font-medium text-slate-600">Priority category</label><select id="walkin-priority" required value={priorityCategory} onChange={(event) => { setPriorityCategory(event.target.value); setError(""); }} className={inputClass}><option value="">Select priority category</option><option value="senior">Senior citizen (60+)</option><option value="pwd">PWD (Person with Disability)</option><option value="pregnant">Pregnant</option></select></div>}
          </fieldset>
        </fieldset>
        {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700"><AlertCircle size={16} className="shrink-0" aria-hidden="true" />{error}</p>}
        {success && <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{success}</p>}
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e4db7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <UserPlus size={17} aria-hidden="true" />}{loading ? "Registering patient…" : "Register and assign dental queue"}</button>
      </form>
    </section>
  );
}
