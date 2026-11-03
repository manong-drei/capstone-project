import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Phone,
  Search,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { DENTAL_SERVICES as SERVICES } from "@/constants/medicalServices";
import api from "@/services/api";

const inputClass =
  "w-full min-w-0 scroll-mt-24 rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2";

function RequiredMark() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 text-red-600 after:content-['*']"
    />
  );
}

function FieldError({ field, message }) {
  return message ? (
    <p
      id={`walkin-${field}-error`}
      className="mt-1.5 text-xs font-medium text-red-700"
    >
      {message}
    </p>
  ) : null;
}
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

export default function WalkInForm({ onSuccess, doctorLeaveEnd }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middle_name: "",
    suffix: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    contact: "",
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [manualPriority, setIsPriority] = useState(false);
  const [priorityCategory, setPriorityCategory] = useState("");
  const [lookup, setLookup] = useState("");
  const [matches, setMatches] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });
  const [year, month, day] = today.split("-").map(Number);
  const [birthYear, birthMonth, birthDay] = form.dateOfBirth
    .split("-")
    .map(Number);
  const age =
    year -
    birthYear -
    (month < birthMonth || (month === birthMonth && day < birthDay) ? 1 : 0);
  const isSenior = Boolean(form.dateOfBirth) && age >= 60;
  const isPriority = isSenior || manualPriority;
  const assignedPriorityCategory = isSenior ? "senior" : priorityCategory;
  const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

  useEffect(() => {
    if (selectedPatient) return;
    const term = lookup.trim();
    const isPhoneLookup = /^\+?[\d\s-]+$/.test(term);
    const digits = (term ? (isPhoneLookup ? term : "") : form.contact).replace(
      /\D/g,
      "",
    );
    const phone =
      digits.length === 10 && digits.startsWith("9") ? `0${digits}` : digits;
    const params = new URLSearchParams();
    if (term) {
      if (isPhoneLookup && phone.length >= 4) params.set("phone", phone);
      else if (!isPhoneLookup && term.length >= 2) params.set("name", term);
    } else {
      if (fullName.length >= 2) params.set("name", fullName);
      if (phone.length >= 4) params.set("phone", phone);
    }
    if (form.dateOfBirth) params.set("date_of_birth", form.dateOfBirth);
    if (!params.size) {
      const reset = setTimeout(() => {
        setMatches([]);
        setSearching(false);
      }, 0);
      return () => clearTimeout(reset);
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/patients/search?${params}`);
        if (active) setMatches(res.data || []);
      } catch {
        if (active) setMatches([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [lookup, fullName, form.contact, form.dateOfBirth, selectedPatient]);

  const selectPatient = async (id) => {
    setError("");
    try {
      const { data } = await api.get(`/patients/${id}`);
      setSelectedPatient(data);
      setForm({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        middle_name: data.middle_name || "",
        suffix: data.suffix || "",
        dateOfBirth: String(data.date_of_birth || "").slice(0, 10),
        gender: String(data.gender || "").toLowerCase(),
        address: data.barangay || "",
        contact: String(data.contact_number || "").replace(/^(\+?63|0)/, ""),
      });
      setMatches([]);
      setLookup("");
      setSearching(false);
      setConfirmNew(false);
    } catch (err) {
      setError(err.message);
    }
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
    setSelectedServices((previous) =>
      previous.includes(id)
        ? previous.filter((service) => service !== id)
        : [...previous, id],
    );
  };

  const validate = () => {
    const errors = {};
    if (!selectedServices.length || selectedServices.length > 2)
      errors.services = "Choose 1 or 2 dental services.";
    if (!selectedPatient && matches.length && !confirmNew)
      errors.confirmNew =
        "Select an existing patient above or confirm that this is a new patient.";
    if (!form.firstName.trim())
      errors.firstName = "Enter the patient's first name.";
    if (!form.lastName.trim())
      errors.lastName = "Enter the patient's last name.";
    if (!form.dateOfBirth)
      errors.dateOfBirth = "Enter the patient's date of birth.";
    else if (form.dateOfBirth > today)
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    if (!form.gender) errors.gender = "Select a gender.";
    if (!form.address.trim()) errors.address = "Select a barangay.";
    if (!/^9\d{9}$/.test(form.contact))
      errors.contact = "Enter 10 digits starting with 9, after +63.";
    if (isPriority && !assignedPriorityCategory)
      errors.priority = "Select a priority category.";
    return errors;
  };
  const fieldErrors = submitted ? validate() : {};
  const fieldAttributes = (field, helpId) => ({
    "aria-invalid": fieldErrors[field] ? true : undefined,
    "aria-describedby":
      [helpId, fieldErrors[field] && `walkin-${field}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
  });
  const fieldClass = (field) =>
    `${inputClass} ${fieldErrors[field] ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitted(true);
    if (Object.keys(validate()).length) {
      const formElement = event.currentTarget;
      requestAnimationFrame(() => {
        const invalid = formElement.querySelector('[aria-invalid="true"]');
        const field = invalid?.matches("fieldset")
          ? invalid.querySelector("input:not(:disabled), select:not(:disabled)")
          : invalid;
        field?.focus({ preventScroll: true });
        field?.scrollIntoView({ block: "center" });
      });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/queue/walkin", {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        middle_name: form.middle_name.trim(),
        suffix: form.suffix.trim(),
        date_of_birth: form.dateOfBirth,
        gender: form.gender,
        address: form.address,
        contact: "+63" + form.contact,
        patient_id: selectedPatient?.patient_id,
        create_new_confirmed: confirmNew,
        priority_category: isPriority ? assignedPriorityCategory : null,
        type: isPriority ? "priority" : "regular",
        category: "dental",
        services: selectedServices,
      });
      setSuccess(
        `Dental walk-in registered — queue number ${res.queue.queue_number}. Initial position: ${res.queue.sms_initial_position}. ` +
          (res.queue.sms_alert_state === "suppressed"
            ? "Tell the patient: Please stay nearby; no queue SMS will be sent."
            : "Tell the patient: One SMS will be sent as your turn approaches. Order may change."),
      );
      setForm({
        firstName: "",
        lastName: "",
        middle_name: "",
        suffix: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        contact: "",
      });
      setSelectedServices([]);
      setIsPriority(false);
      setPriorityCategory("");
      setSelectedPatient(null);
      setMatches([]);
      setLookup("");
      setConfirmNew(false);
      setSubmitted(false);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to register patient.");
      if (err.message?.includes("Possible existing patient"))
        setLookup(fullName);
    } finally {
      setLoading(false);
    }
  };

  const dentalVisits =
    selectedPatient?.visits?.filter((visit) => visit.category === "dental") ??
    [];

  return (
    <section
      id="walk-in-registration"
      aria-labelledby="walk-in-title"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <UserPlus size={20} aria-hidden="true" />
        </span>
        <div>
          <h3
            id="walk-in-title"
            className="text-sm font-semibold text-slate-900"
          >
            Register dental walk-in
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Find an existing record before creating a new patient.
          </p>
        </div>
      </div>
      <form
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4 p-5"
        aria-label="Dental walk-in registration"
      >
        <p className="text-xs text-slate-500">
          Fields marked with an asterisk (*) are required.
        </p>
        {doctorLeaveEnd && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            The dentist is on approved leave through{" "}
            {new Date(`${doctorLeaveEnd}T00:00:00+08:00`).toLocaleDateString(
              "en-PH",
              { timeZone: "Asia/Manila", dateStyle: "medium" },
            )}
            . Dental walk-in registration is paused.
          </p>
        )}
        {Object.keys(fieldErrors).length > 0 && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700"
          >
            <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
            Please check the highlighted fields, then submit again.
          </p>
        )}
        <fieldset disabled={loading} className="min-w-0 space-y-4">
          <fieldset
            {...fieldAttributes("services", "walkin-services-help")}
            className={`min-w-0 rounded-xl border p-3 ${fieldErrors.services ? "border-red-500 bg-red-50" : selectedServices.length ? "border-blue-200 bg-blue-50/50" : "border-slate-200"}`}
          >
            <legend className="px-1 text-sm font-bold text-slate-900">
              Dental services
              <RequiredMark />
            </legend>
            <p
              id="walkin-services-help"
              className="mb-2 text-xs font-medium text-slate-700"
            >
              Choose 1 or 2 services before issuing a ticket.{" "}
              <span className="font-bold">
                {selectedServices.length}/2 selected
              </span>
            </p>
            <div className="grid max-h-40 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
              {SERVICES.map(({ id, label, group }) => (
                <label
                  key={id}
                  className={`flex items-start gap-2 rounded-lg border p-2 text-xs leading-relaxed transition ${selectedServices.includes(id) ? "border-blue-400 bg-white font-semibold text-blue-900" : "border-transparent text-slate-700 hover:bg-white"}`}
                >
                  <input
                    type="checkbox"
                    {...fieldAttributes("services", "walkin-services-help")}
                    checked={selectedServices.includes(id)}
                    onChange={() => toggleService(id)}
                    disabled={
                      !selectedServices.includes(id) &&
                      selectedServices.length >= 2
                    }
                    className="mt-0.5 shrink-0 accent-blue-700"
                  />
                  <span>
                    {label}
                    {group && (
                      <span className="block text-[10px] font-normal text-slate-500">
                        {group}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <FieldError field="services" message={fieldErrors.services} />
          </fieldset>
          <div>
            <label
              htmlFor="patient-lookup"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Find an existing patient
            </label>
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-3 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="patient-lookup"
                value={lookup}
                onChange={(event) => {
                  setLookup(event.target.value);
                  setConfirmNew(false);
                }}
                disabled={!!selectedPatient}
                placeholder="Search name or mobile number"
                aria-describedby="patient-lookup-help"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>
            <p
              id="patient-lookup-help"
              className="mt-1.5 text-xs text-slate-500"
            >
              Search by name or any 4 or more digits of a mobile number.
            </p>
            {searching && (
              <p
                role="status"
                className="mt-2 flex items-center gap-2 text-xs text-slate-500"
              >
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Searching patient records…
              </p>
            )}
            {!selectedPatient && matches.length > 0 && (
              <div
                className={`mt-3 space-y-2 rounded-xl border p-3 ${fieldErrors.confirmNew ? "border-red-500 bg-red-50" : "border-amber-200 bg-amber-50"}`}
              >
                <p className="text-xs font-semibold text-amber-900">
                  Possible existing patients
                </p>
                {matches.map((patient) => (
                  <button
                    key={patient.patient_id}
                    type="button"
                    onClick={() => selectPatient(patient.patient_id)}
                    className="block w-full rounded-lg border border-amber-100 bg-white px-3 py-2 text-left text-xs leading-relaxed text-slate-700 hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    {[
                      patient.first_name,
                      patient.middle_name,
                      patient.last_name,
                      patient.suffix,
                    ]
                      .filter(Boolean)
                      .join(" ")}{" "}
                    · {String(patient.date_of_birth || "").slice(0, 10)} ·{" "}
                    {patient.masked_contact || "No phone"}
                  </button>
                ))}
                <label className="flex items-start gap-2 pt-1 text-xs leading-relaxed text-amber-900">
                  <input
                    type="checkbox"
                    required
                    {...fieldAttributes("confirmNew")}
                    checked={confirmNew}
                    onChange={(event) => setConfirmNew(event.target.checked)}
                    className="mt-0.5 accent-blue-700"
                  />
                  <span>
                    I checked these records; create a new patient.
                    <RequiredMark />
                  </span>
                </label>
                <FieldError
                  field="confirmNew"
                  message={fieldErrors.confirmNew}
                />
              </div>
            )}
            {selectedPatient && (
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    Returning patient #{selectedPatient.patient_id}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setSubmitted(false);
                      setForm({
                        firstName: "",
                        lastName: "",
                        middle_name: "",
                        suffix: "",
                        dateOfBirth: "",
                        gender: "",
                        address: "",
                        contact: "",
                      });
                    }}
                    className="flex items-center gap-1 rounded-md p-1 hover:bg-blue-100"
                  >
                    <X size={14} aria-hidden="true" />
                    Clear selection
                  </button>
                </div>
                <Link
                  to={`/staff/patients/${selectedPatient.patient_id}`}
                  className="mt-2 inline-block font-medium underline underline-offset-2"
                >
                  Open patient profile
                </Link>
                <p className="mt-2 font-medium">
                  Previous dental visits: {dentalVisits.length}
                </p>
                {dentalVisits.slice(0, 3).map((visit) => (
                  <p key={visit.id} className="mt-1 text-blue-700">
                    {new Date(visit.created_at).toLocaleDateString("en-PH", {
                      timeZone: "Asia/Manila",
                    })}{" "}
                    · {visit.queue_number} · {visit.status}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-900">
              <UserRound
                size={16}
                className="text-blue-700"
                aria-hidden="true"
              />
              Patient details
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="walkin-first-name"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  First name
                  <RequiredMark />
                </label>
                <input
                  id="walkin-first-name"
                  required
                  {...fieldAttributes("firstName")}
                  autoComplete="given-name"
                  maxLength={100}
                  value={form.firstName}
                  onChange={set("firstName")}
                  placeholder="First name"
                  className={fieldClass("firstName")}
                />
                <FieldError field="firstName" message={fieldErrors.firstName} />
              </div>
              <div>
                <label
                  htmlFor="walkin-last-name"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Last name
                  <RequiredMark />
                </label>
                <input
                  id="walkin-last-name"
                  required
                  {...fieldAttributes("lastName")}
                  autoComplete="family-name"
                  maxLength={100}
                  value={form.lastName}
                  onChange={set("lastName")}
                  placeholder="Last name"
                  className={fieldClass("lastName")}
                />
                <FieldError field="lastName" message={fieldErrors.lastName} />
              </div>
              <div>
                <label
                  htmlFor="walkin-middle-name"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Middle name (optional)
                </label>
                <input
                  id="walkin-middle-name"
                  autoComplete="additional-name"
                  maxLength={100}
                  value={form.middle_name}
                  onChange={set("middle_name")}
                  placeholder="e.g. Santos"
                  className={fieldClass("middle_name")}
                />
              </div>
              <div>
                <label
                  htmlFor="walkin-suffix"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Suffix (optional)
                </label>
                <input
                  id="walkin-suffix"
                  autoComplete="honorific-suffix"
                  maxLength={20}
                  value={form.suffix}
                  onChange={set("suffix")}
                  placeholder="e.g. Jr., Sr., III"
                  className={fieldClass("suffix")}
                />
              </div>
              <div>
                <label
                  htmlFor="walkin-dob"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Date of birth
                  <RequiredMark />
                </label>
                <input
                  id="walkin-dob"
                  type="date"
                  required
                  {...fieldAttributes("dateOfBirth")}
                  max={today}
                  value={form.dateOfBirth}
                  onChange={set("dateOfBirth")}
                  className={fieldClass("dateOfBirth")}
                />
                <FieldError
                  field="dateOfBirth"
                  message={fieldErrors.dateOfBirth}
                />
              </div>
              <div>
                <label
                  htmlFor="walkin-gender"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Gender
                  <RequiredMark />
                </label>
                <select
                  id="walkin-gender"
                  required
                  {...fieldAttributes("gender")}
                  value={form.gender}
                  onChange={set("gender")}
                  className={fieldClass("gender")}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <FieldError field="gender" message={fieldErrors.gender} />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="walkin-address"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Barangay, Bago City
                  <RequiredMark />
                </label>
                <select
                  id="walkin-address"
                  required
                  {...fieldAttributes("address")}
                  value={form.address}
                  onChange={set("address")}
                  className={fieldClass("address")}
                >
                  <option value="">Select barangay</option>
                  {form.address &&
                    !BAGO_BARANGAYS.some(
                      (name) => form.address === `Barangay ${name}, Bago City`,
                    ) && <option value={form.address}>{form.address}</option>}
                  {BAGO_BARANGAYS.map((name) => (
                    <option key={name} value={`Barangay ${name}, Bago City`}>
                      {name}
                    </option>
                  ))}
                </select>
                <FieldError field="address" message={fieldErrors.address} />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="walkin-contact"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Confirmed mobile number
                  <RequiredMark />
                </label>
                <div
                  className={`flex overflow-hidden rounded-xl border focus-within:ring-2 ${fieldErrors.contact ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-100" : "border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-100"}`}
                >
                  <span className="flex items-center gap-2 border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                    <Phone size={14} aria-hidden="true" />
                    +63
                  </span>
                  <input
                    id="walkin-contact"
                    type="tel"
                    required
                    {...fieldAttributes("contact", "walkin-contact-help")}
                    inputMode="numeric"
                    pattern="9[0-9]{9}"
                    maxLength={10}
                    value={form.contact}
                    onChange={set("contact")}
                    placeholder="9XXXXXXXXX"
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
                  />
                </div>
                <p
                  id="walkin-contact-help"
                  className="mt-1.5 text-[11px] text-slate-500"
                >
                  Use 10 digits starting with 9. Confirm this number with the
                  patient.
                </p>
                <FieldError field="contact" message={fieldErrors.contact} />
              </div>
            </div>
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-slate-700">
              Queue type
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: "Regular" },
                { value: true, label: "Priority" },
              ].map(({ value, label }) => (
                <label
                  key={label}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
                    isPriority === value
                      ? value
                        ? "border-[#c2410c] bg-orange-50 text-[#c2410c]"
                        : "border-blue-300 bg-blue-50 text-blue-800"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="walkin-queue-type"
                    disabled={isSenior}
                    checked={isPriority === value}
                    onChange={() => {
                      setIsPriority(value);
                      setPriorityCategory("");
                      setError("");
                    }}
                    className={value ? "accent-[#c2410c]" : "accent-blue-700"}
                  />
                  {label}
                </label>
              ))}
            </div>

            {isSenior && (
              <p className="mt-2 text-xs font-medium text-[#c2410c]">
                Senior Citizen priority assigned automatically: patient is {age}{" "}
                years old today.
              </p>
            )}

            {isPriority && (
              <div className="mt-3">
                <label
                  htmlFor="walkin-priority"
                  className="mb-1.5 block text-xs font-medium text-slate-600"
                >
                  Priority category
                  <RequiredMark />
                </label>
                <select
                  id="walkin-priority"
                  required
                  {...fieldAttributes("priority")}
                  disabled={isSenior}
                  value={assignedPriorityCategory}
                  onChange={(event) => {
                    setPriorityCategory(event.target.value);
                    setError("");
                  }}
                  className={fieldClass("priority")}
                >
                  <option value="">Select priority category</option>
                  <option value="senior">Senior Citizen (60+)</option>
                  <option value="pwd">PWD (Person with Disability)</option>
                  <option value="pregnant">Pregnant</option>
                </select>
                <FieldError field="priority" message={fieldErrors.priority} />
              </div>
            )}
          </fieldset>
        </fieldset>
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700"
          >
            <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800"
          >
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            {success}
          </p>
        )}
        <p id="walkin-submit-help" className="text-xs text-slate-500">
          {selectedServices.length
            ? `Selected services: ${SERVICES.filter(({ id }) =>
                selectedServices.includes(id),
              )
                .map(({ label }) => label)
                .join(", ")}`
            : "Choose the patient's dental services and confirm their details before registering."}
        </p>
        <button
          type="submit"
          aria-describedby="walkin-submit-help"
          disabled={loading || !!doctorLeaveEnd}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e4db7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <UserPlus size={17} aria-hidden="true" />
          )}
          {loading
            ? "Registering patient…"
            : "Register and assign dental queue"}
        </button>
      </form>
    </section>
  );
}
