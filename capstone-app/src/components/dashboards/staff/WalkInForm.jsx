import { useState } from "react";
import { DENTAL_SERVICES as SERVICES } from "@/constants/medicalServices";
import api from "@/services/api";
import { createGeneralWalkIn } from "@/services/queueService";

const BLUE = "#1e4db7";
const NAVY = "#1e2d6b";

const BAGO_BARANGAYS = [
  "Abuanan","Alianza","Atipuluan","Bacong","Bagroy","Balingasag","Binubuhan",
  "Busay","Calumangan","Caridad","Don Jorge Araneta","Dulao","Ilijan","Lag-asan",
  "Ma-ao","Mailum","Malingin","Napoles","Pacol","Poblacion","Sagasa","Sampinit",
  "Tabunan","Taloc",
];

/* ── Small form field primitives ── */

function FormField({ icon, placeholder, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: "13px", pointerEvents: "none", display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "10px", border: `1.5px solid ${focused ? BLUE : "#dde1ec"}`, fontSize: "14px", color: "#111827", background: "#ffffff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: focused ? `0 0 0 3px rgba(30,77,183,0.12)` : "none", transition: "border-color 0.15s, box-shadow 0.15s" }}
      />
    </div>
  );
}

function ContactField({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${focused ? BLUE : "#dde1ec"}`, borderRadius: "10px", background: "#ffffff", overflow: "hidden", boxShadow: focused ? `0 0 0 3px rgba(30,77,183,0.12)` : "none", transition: "border-color 0.15s, box-shadow 0.15s" }}>
      <span style={{ padding: "12px 10px 12px 14px", fontSize: "14px", fontWeight: 600, color: "#374151", background: "#f4f5f9", borderRight: "1.5px solid #dde1ec", flexShrink: 0, userSelect: "none" }}>
        +63
      </span>
      <input
        type="tel"
        placeholder="9XX XXX XXXX"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, padding: "12px 14px", border: "none", outline: "none", fontSize: "14px", color: "#111827", fontFamily: "inherit", background: "transparent" }}
      />
    </div>
  );
}

function GenderField({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: "13px", pointerEvents: "none", display: "flex", alignItems: "center" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M12 12v8M8 20h8" />
        </svg>
      </span>
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "10px", border: `1.5px solid ${focused ? BLUE : "#dde1ec"}`, fontSize: "14px", color: value ? "#111827" : "#9ca3af", background: "#ffffff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: focused ? `0 0 0 3px rgba(30,77,183,0.12)` : "none", transition: "border-color 0.15s, box-shadow 0.15s", appearance: "none", cursor: "pointer" }}
      >
        <option value="" disabled>Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
      <span style={{ position: "absolute", right: "13px", pointerEvents: "none", display: "flex", alignItems: "center", color: "#9ca3af" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
}

/* ── Main WalkInForm ── */

/**
 * WalkInForm
 * Right column of the staff dashboard. Staff fill this out to register a
 * walk-in patient and assign them a queue number.
 *
 * Props:
 *   onSuccess — called after a successful submission (triggers queue refresh)
 *   category  — "dental" | "general" (controls which services are shown)
 */
export default function WalkInForm({ onSuccess, category = "dental" }) {
  const isGeneral = category === "general";

  const [form, setForm] = useState({ fullName: "", age: "", gender: "", address: "", contact: "" });
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPriority, setIsPriority] = useState(false);
  const [priorityCategory, setPriorityCategory] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [servicesFocused, setServicesFocused] = useState(false);

  const set = (field) => (e) => {
    setError("");
    setSuccess("");
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  const toggleService = (id) => {
    setError("");
    setSuccess("");
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const selectedServiceLabels = SERVICES
    .filter((s) => selectedServices.includes(s.id))
    .map((s) => s.label);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!form.fullName.trim()) return setError("Full name is required.");
    if (!form.age || isNaN(form.age) || form.age < 1 || form.age > 120) return setError("A valid age is required.");
    if (!form.gender) return setError("Please select a gender.");
    if (!form.address.trim()) return setError("Address is required.");
    if (!form.contact.trim()) return setError("Contact number is required.");
    if (!isGeneral && selectedServices.length === 0) return setError("Please select at least one service.");
    if (isPriority && !priorityCategory) return setError("Please select a priority category.");

    setLoading(true);
    try {
      const payload = {
        full_name: form.fullName,
        age: parseInt(form.age),
        gender: form.gender,
        address: form.address,
        contact: "+63" + form.contact.replace(/^0+/, ""),
        type: isPriority ? "priority" : "regular",
      };
      const res = isGeneral
        ? await createGeneralWalkIn(payload)
        : await api.post("/queue/walkin", { ...payload, category: "dental", services: selectedServices });
      const queueNumber = res?.queue?.queue_number ?? "assigned";
      setSuccess(`${isGeneral ? "General" : "Dental"} walk-in registered — queue number ${queueNumber}.`);
      setForm({ fullName: "", age: "", gender: "", address: "", contact: "" });
      setSelectedServices([]);
      setIsPriority(false);
      setPriorityCategory("");
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to register patient.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#eef0f7", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.06)" }}>
      {/* Full Name */}
      <FormField
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
        placeholder="Full name"
        value={form.fullName}
        onChange={set("fullName")}
      />

      {/* Age + Gender */}
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: "0 0 120px" }}>
          <FormField
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
            placeholder="Age"
            type="number"
            value={form.age}
            onChange={set("age")}
          />
        </div>
        <GenderField value={form.gender} onChange={set("gender")} />
      </div>

      {/* Address dropdown */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: "13px", pointerEvents: "none", display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            onFocus={() => setAddressFocused(true)}
            onBlur={() => setTimeout(() => setAddressFocused(false), 200)}
            style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "10px", border: `1.5px solid ${showDropdown || addressFocused ? BLUE : "#dde1ec"}`, fontSize: "14px", color: form.address ? "#111827" : "#9ca3af", background: "#ffffff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: showDropdown || addressFocused ? `0 0 0 3px rgba(30,77,183,0.12)` : "none", transition: "border-color 0.15s, box-shadow 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {form.address || "Address"}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ transition: "transform 0.2s", transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {showDropdown && (
          <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", marginTop: "4px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
            <ul style={{ margin: 0, padding: "4px 0", listStyle: "none", maxHeight: "240px", overflowY: "auto" }}>
              {BAGO_BARANGAYS.map((brgy) => {
                const fullAddress = `Barangay ${brgy}, Bago City`;
                const isSelected = form.address === fullAddress;
                return (
                  <li key={brgy}>
                    <button
                      type="button"
                      style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: "14px", background: isSelected ? "#eff6ff" : "transparent", color: isSelected ? "#1d4ed8" : "#374151", fontWeight: isSelected ? "600" : "400", border: "none", cursor: "pointer", outline: "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#eff6ff"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      onClick={() => { set("address")({ target: { value: fullAddress } }); setShowDropdown(false); }}
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

      {/* Contact */}
      <ContactField value={form.contact} onChange={set("contact")} />

      {/* Services (dental only) */}
      {!isGeneral && (
        <div style={{ position: "relative" }}>
          <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#374151" }}>
            Services <span style={{ color: "#9ca3af", fontWeight: 400 }}>(select all that apply)</span>
          </p>
          <button
            type="button"
            onClick={() => setShowServicesDropdown(!showServicesDropdown)}
            onFocus={() => setServicesFocused(true)}
            onBlur={() => setTimeout(() => setServicesFocused(false), 200)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: `1.5px solid ${showServicesDropdown || servicesFocused ? BLUE : "#dde1ec"}`, fontSize: "14px", color: selectedServices.length > 0 ? "#111827" : "#9ca3af", background: "#ffffff", outline: "none", fontFamily: "inherit", boxSizing: "border-box", boxShadow: showServicesDropdown || servicesFocused ? `0 0 0 3px rgba(30,77,183,0.12)` : "none", transition: "border-color 0.15s, box-shadow 0.15s", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedServices.length > 0 ? selectedServiceLabels.join(", ") : "Select services"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {selectedServices.length > 0 && (
                <span style={{ background: "#eff6ff", color: BLUE, borderRadius: "999px", padding: "2px 8px", fontSize: "11px", fontWeight: 700 }}>
                  {selectedServices.length}
                </span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ transition: "transform 0.2s", transform: showServicesDropdown ? "rotate(180deg)" : "rotate(0deg)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {showServicesDropdown && (
            <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", marginTop: "4px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
              <ul style={{ margin: 0, padding: "4px 0", listStyle: "none", maxHeight: "260px", overflowY: "auto" }}>
                {SERVICES.map(({ id, label, group }) => {
                  const active = selectedServices.includes(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleService(id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "none", background: active ? "#eff6ff" : "#ffffff", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                      >
                        <span style={{ width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${active ? BLUE : "#cbd5e1"}`, background: active ? BLUE : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {active && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                        <span style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <span style={{ fontSize: "13px", color: active ? BLUE : "#374151", fontWeight: active ? 600 : 500 }}>{label}</span>
                          {group && <span style={{ fontSize: "11px", color: "#9ca3af" }}>{group}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {selectedServices.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setSelectedServices([]); setError(""); setSuccess(""); }}
                  style={{ width: "100%", padding: "9px 14px", border: "none", borderTop: "1px solid #f3f4f6", background: "#f9fafb", color: "#dc2626", cursor: "pointer", fontSize: "12px", fontWeight: 600, textAlign: "left" }}
                >
                  Clear selected services
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Queue Type */}
      <div>
        <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#374151" }}>Queue Type</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {[{ value: false, label: "Regular", color: NAVY }, { value: true, label: "Priority", color: "#f97316" }].map(({ value, label, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => { setIsPriority(value); setPriorityCategory(""); setError(""); }}
              style={{ padding: "9px", borderRadius: "10px", border: `2px solid ${isPriority === value ? color : "#dde1ec"}`, background: isPriority === value ? `${color}12` : "#ffffff", cursor: "pointer", fontWeight: isPriority === value ? 600 : 400, fontSize: "13px", color: isPriority === value ? color : "#6b7280", transition: "all 0.15s" }}
            >
              {label}
            </button>
          ))}
        </div>
        {isPriority && (
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "5px" }}>
            {[{ value: "senior", label: "Senior Citizen (60+)" }, { value: "pwd", label: "PWD (Person with Disability)" }, { value: "pregnant", label: "Pregnant" }].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setPriorityCategory(value); setError(""); }}
                style={{ padding: "8px 12px", borderRadius: "8px", border: `1.5px solid ${priorityCategory === value ? "#f97316" : "#dde1ec"}`, background: priorityCategory === value ? "#fff7ed" : "#ffffff", cursor: "pointer", fontSize: "12px", color: priorityCategory === value ? "#f97316" : "#374151", fontWeight: priorityCategory === value ? 600 : 400, textAlign: "left", transition: "all 0.12s" }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error / Success */}
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#dc2626" }}>{error}</div>}
      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", color: "#15803d", fontWeight: 500 }}>✓ {success}</div>}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: `linear-gradient(90deg, ${NAVY} 0%, ${BLUE} 100%)`, color: "#ffffff", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1, boxShadow: "0 3px 12px rgba(30,45,107,0.3)", transition: "transform 0.15s, box-shadow 0.15s", letterSpacing: "0.01em" }}
        onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 5px 18px rgba(30,45,107,0.42)"; } }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 3px 12px rgba(30,45,107,0.3)"; }}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <svg className="ek-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            Registering...
          </span>
        ) : isGeneral ? "Register General Walk-in" : "Get Queue"}
      </button>
    </div>
  );
}
