import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/common/AppIcons";
import api from "@/services/api";
import ToastNotifications from "@/components/common/ToastNotifications";
import useSmsToasts from "@/hooks/useSmsToasts";
import { getNameFields } from "@/utils/nameDisplay";

const PM_RESPONSIVE_CSS = `
  .pm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pm-table-row, .pm-table-head { display: grid; grid-template-columns: minmax(110px, 1fr) minmax(110px, 1fr) 48px 52px 110px minmax(100px, 1fr) 70px 150px; min-width: 950px; gap: 12px; }
  .pm-table-row > span { min-width: 0; overflow-wrap: anywhere; }
  .pm-name-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px 16px; margin: 0; flex: 1; min-width: 0; }
  .pm-name-grid dt { font-size: 11px; color: #6b7280; }
  .pm-name-grid dd { margin: 2px 0 0; font-size: 14px; font-weight: 600; color: #111827; overflow-wrap: anywhere; }
  .pm-cards-mobile { display: none; }
  @media (max-width: 900px) {
    .pm-table-row, .pm-table-head { display: none !important; }
    .pm-cards-mobile { display: flex !important; flex-direction: column; gap: 6px; padding: 10px; }
  }
  @media (max-width: 640px) {
    .pm-form-grid { grid-template-columns: 1fr !important; }
  }
`;

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1.5px solid #e5e7eb",
  fontSize: "14px",
  color: "#111827",
  background: "#fafafa",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "5px",
};

const PATIENTS_PER_PAGE = 10;

function ActivationSMS({ patient, onReplace, busy }) {
  if (!patient.must_change_password) return null;
  return <span style={{ display: 'block', fontSize: '12px', color: '#475569', marginTop: '5px' }}>
    Activation SMS: {patient.sms_provider_status || patient.sms_state || 'Replacement required'}
    {patient.is_active ? <button type="button" disabled={busy} onClick={() => onReplace(patient)}
      style={{ display: 'block', marginTop: '4px', cursor: 'pointer' }}>Issue replacement password</button> : null}
  </span>;
}

function statusBadge(isActive) {
  return isActive
    ? { bg: "#dcfce7", color: "#166534", label: "Active" }
    : { bg: "#fee2e2", color: "#dc2626", label: "Inactive" };
}

function ConfirmModal({ open, patientName, action, onConfirm, onCancel }) {
  if (!open) return null;
  const isDeactivate = action === "deactivate";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15,23,42,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "28px 24px",
          maxWidth: "360px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: isDeactivate ? "#fee2e2" : "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              name={isDeactivate ? "xCircle" : "checkCircle"}
              size={20}
              color={isDeactivate ? "#dc2626" : "#16a34a"}
            />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {isDeactivate ? "Deactivate Account" : "Reactivate Account"}
          </h3>
        </div>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {isDeactivate ? (
            <>
              Are you sure you want to deactivate{" "}
              <strong style={{ color: "#111827" }}>{patientName}</strong>? They
              will lose access to the system.
            </>
          ) : (
            <>
              Are you sure you want to reactivate{" "}
              <strong style={{ color: "#111827" }}>{patientName}</strong>? They
              will regain access to the system.
            </>
          )}
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "9px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "transparent",
              fontSize: "13px",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 2,
              padding: "9px",
              borderRadius: "8px",
              border: "none",
              background: isDeactivate ? "#dc2626" : "#16a34a",
              fontSize: "13px",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {isDeactivate ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientManager() {
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [smsBusy, setSmsBusy] = useState(false);
  const { toasts, dismissToast, showToast, showSmsToast, trackSmsStatuses } = useSmsToasts();

  const replacePassword = async (patient) => {
    if (!window.confirm(`Confirm you have verified ${patient.full_name}'s identity and registered mobile number. Issue a new temporary password? The old password and setup session will be invalidated.`)) return;
    setSmsBusy(true);
    try {
      const result = await api.post(`/admin/patients/${patient.user_id}/temporary-password`, { identity_confirmed: true });
      showSmsToast({ id: result.sms_job_id, state: result.sms_status, label: `Replacement password SMS for ${patient.full_name}` });
      await fetchPatients(true);
    } catch (err) { showToast(`Unable to request replacement password SMS. ${err.message}`, "error"); }
    finally { setSmsBusy(false); }
  };
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirm, setConfirm] = useState({
    open: false,
    userId: null,
    patientName: "",
    action: "",
  });

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    priority_category: "",
  });

  const fetchPatients = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFetchError("");
    try {
      const data = await api.get("/admin/patients");
      const list = data?.patients ?? [];
      setPatients(list);
      trackSmsStatuses(list.map((patient) => ({
        id: patient.sms_job_id,
        state: patient.sms_state,
        provider_status: patient.sms_provider_status,
        label: `Temporary password SMS for ${patient.full_name}`,
      })));
    } catch (err) {
      setFetchError(err.message || "Failed to load patient accounts.");
      if (!silent) setPatients([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [trackSmsStatuses]);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(() => fetchPatients(true), 15_000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddPatient = async () => {
    setFormError("");
    if (
      !form.first_name ||
      !form.last_name ||
      !form.phone ||
      !form.address ||
      !form.date_of_birth ||
      !form.gender
    ) {
      setFormError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post("/admin/patients", form);
      showSmsToast({ id: result.sms_job_id, state: result.sms_status, label: `Temporary password SMS for ${[form.first_name, form.middle_name, form.last_name, form.suffix].filter(Boolean).join(" ")}` });
      setShowForm(false);
      setForm({
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        phone: "",
        address: "",
        date_of_birth: "",
        gender: "",
        priority_category: "",
      });
      fetchPatients();
    } catch (err) {
      setFormError(err.message);
      showToast(`Unable to request the temporary password SMS. ${err.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirm = (patient, action) => {
    setConfirm({
      open: true,
      userId: patient.user_id,
      patientName: patient.full_name,
      action,
    });
  };

  const closeConfirm = () =>
    setConfirm({ open: false, userId: null, patientName: "", action: "" });

  const handleConfirmAction = async () => {
    const { userId, action } = confirm;
    closeConfirm();
    try {
      await api.patch(`/admin/patients/${userId}/${action}`);
      fetchPatients();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = patients.filter((p) => {
    if (!showInactive && !p.is_active) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.full_name || "").toLowerCase().includes(q) ||
        getNameFields(p).map(([, value]) => value).join(" ").toLowerCase().includes(q) ||
        (p.contact_number || p.phone || "").includes(q) ||
        (p.barangay || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, showInactive]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PATIENTS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PATIENTS_PER_PAGE,
    safePage * PATIENTS_PER_PAGE,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <style>{PM_RESPONSIVE_CSS}</style>
      <ToastNotifications toasts={toasts} onDismiss={dismissToast} />

      <ConfirmModal
        open={confirm.open}
        patientName={confirm.patientName}
        action={confirm.action}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Patient Accounts
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
            View and manage patient account status
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#6b7280",
              cursor: "pointer",
              whiteSpace: "nowrap", // prevent checkbox label from breaking oddly
            }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Show inactive
          </label>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: "none",
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="plus" size={16} color="#ffffff" />
            Add Patient
          </button>
        </div>
      </div>

      {showForm && (
        <div
          style={{
            background: "#f9fafb",
            border: "1.5px solid #e5e7eb",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            New Patient Account
          </h3>

          <div className="pm-form-grid" style={{ marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                style={inputStyle}
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                placeholder="Juan"
              />
            </div>
            <div>
              <label htmlFor="patient-create-middle-name" style={labelStyle}>Middle Name (optional)</label>
              <input
                id="patient-create-middle-name"
                style={inputStyle}
                value={form.middle_name}
                onChange={(e) => handleChange("middle_name", e.target.value)}
                maxLength={100}
                autoComplete="additional-name"
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                style={inputStyle}
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                placeholder="Dela Cruz"
              />
            </div>
            <div>
              <label htmlFor="patient-create-suffix" style={labelStyle}>Suffix (optional)</label>
              <input
                id="patient-create-suffix"
                style={inputStyle}
                value={form.suffix}
                onChange={(e) => handleChange("suffix", e.target.value)}
                maxLength={20}
                placeholder="Jr., Sr., III"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                style={inputStyle}
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="09XX XXX XXXX"
              />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth</label>
              <input
                type="date"
                style={inputStyle}
                value={form.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Gender</label>
              <select
                style={inputStyle}
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Address / Barangay</label>
              <select
                style={inputStyle}
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              >
                <option value="">Select Barangay</option>
                <option value="Abuanan">Abuanan</option>
                <option value="Alianza">Alianza</option>
                <option value="Atipuluan">Atipuluan</option>
                <option value="Bacong">Bacong</option>
                <option value="Bagroy">Bagroy</option>
                <option value="Balingasag">Balingasag</option>
                <option value="Binubuhan">Binubuhan</option>
                <option value="Busay">Busay</option>
                <option value="Calumangan">Calumangan</option>
                <option value="Caridad">Caridad</option>
                <option value="Don Jorge Araneta">Don Jorge Araneta</option>
                <option value="Dulao">Dulao</option>
                <option value="Ilijan">Ilijan</option>
                <option value="Lag-asan">Lag-asan</option>
                <option value="Ma-ao">Ma-ao</option>
                <option value="Mailum">Mailum</option>
                <option value="Malingin">Malingin</option>
                <option value="Napoles">Napoles</option>
                <option value="Pacol">Pacol</option>
                <option value="Poblacion">Poblacion</option>
                <option value="Sagasa">Sagasa</option>
                <option value="Sampinit">Sampinit</option>
                <option value="Tabunan">Tabunan</option>
                <option value="Taloc">Taloc</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority Status</label>
              <select
                style={inputStyle}
                value={form.priority_category}
                onChange={(e) =>
                  handleChange("priority_category", e.target.value)
                }
              >
                <option value="">None</option>
                <option value="senior">Senior Citizen</option>
                <option value="pwd">PWD (Person with Disability)</option>
                <option value="pregnant">Pregnant</option>
              </select>
            </div>
          </div>

          {formError && (
            <p
              style={{ margin: "0 0 12px", fontSize: "13px", color: "#dc2626" }}
            >
              {formError}
            </p>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: "9px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "transparent",
                fontSize: "13px",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddPatient}
              disabled={submitting}
              style={{
                flex: 2,
                padding: "9px",
                borderRadius: "8px",
                border: "none",
                background: "#4f46e5",
                fontSize: "13px",
                fontWeight: 600,
                color: "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      )}
      {/* Search */}
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <Icon name="search" size={15} color="#9ca3af" />
        </span>
        <input
          style={{
            width: "100%",
            padding: "9px 12px 9px 36px",
            borderRadius: "10px",
            border: "1.5px solid #e5e7eb",
            fontSize: "14px",
            color: "#111827",
            background: "#fafafa",
            boxSizing: "border-box",
            outline: "none",
            fontFamily: "inherit",
          }}
          placeholder="Search by name, phone number, or barangay..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Patient Table */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          overflowX: "auto",
        }}
      >
        <div
          className="pm-table-head"
          style={{
            padding: "8px 14px",
            background: "#f9fafb",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          {["Last name", "First name", "Middle initial", "Suffix", "Phone number", "Barangay", "Status", "Actions"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            Loading patients...
          </div>
        ) : fetchError ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p
              style={{ margin: "0 0 12px", fontSize: "13px", color: "#dc2626" }}
            >
              {fetchError}
            </p>
            <button
              onClick={fetchPatients}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                fontSize: "13px",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            {search
              ? "No patients match your search."
              : "No patient accounts found."}
          </div>
        ) : (
          <>
            {/* Desktop rows */}
            {paginated.map((patient) => {
              const sb = statusBadge(patient.is_active);
              const isInactive = !patient.is_active;
              return (
                <div
                  key={patient.user_id}
                  className="pm-table-row"
                  style={{
                    padding: "8px 14px",
                    borderBottom: "1px solid #f9fafb",
                    alignItems: "center",
                    opacity: isInactive ? 0.6 : 1,
                  }}
                >
                  {getNameFields(patient).map(([label, value]) => (
                    <span key={label} style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>{value}</span>
                  ))}
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {patient.contact_number || patient.phone || "—"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {patient.barangay || "—"}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      width: "fit-content",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "20px",
                      background: sb.bg,
                      color: sb.color,
                    }}
                  >
                    {sb.label}
                  </span>
                  <div>
                    {isInactive ? (
                      <button
                        onClick={() => openConfirm(patient, "reactivate")}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "7px",
                          border: "none",
                          background: "#dcfce7",
                          color: "#16a34a",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          width: "fit-content",
                        }}
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => openConfirm(patient, "deactivate")}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "7px",
                          border: "none",
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          width: "fit-content",
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                    <ActivationSMS patient={patient} onReplace={replacePassword} busy={smsBusy} />
                    {!!patient.patient_id && <Link to={`/staff/patients/${patient.patient_id}`} aria-label={`Recover account for ${patient.full_name}`} style={{ display: "block", marginTop: "5px", fontSize: "12px", color: "#1d4ed8" }}>Account recovery</Link>}
                  </div>
                </div>
              );
            })}

            {/* Mobile cards */}
            <div className="pm-cards-mobile">
              {paginated.map((patient) => {
                const sb = statusBadge(patient.is_active);
                const isInactive = !patient.is_active;
                return (
                  <div
                    key={`m-${patient.user_id}`}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "12px",
                      background: "#fafafa",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      opacity: isInactive ? 0.65 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <dl className="pm-name-grid">
                        {getNameFields(patient).map(([label, value]) => (
                          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                        ))}
                      </dl>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "20px",
                          background: sb.bg,
                          color: sb.color,
                          flexShrink: 0,
                        }}
                      >
                        {sb.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Phone number: {patient.contact_number || patient.phone || "—"}
                    </span>
                    <ActivationSMS patient={patient} onReplace={replacePassword} busy={smsBusy} />
                    {!!patient.patient_id && <Link to={`/staff/patients/${patient.patient_id}`} aria-label={`Recover account for ${patient.full_name}`} style={{ display: "block", marginTop: "5px", fontSize: "12px", color: "#1d4ed8" }}>Account recovery</Link>}
                    {patient.barangay && (
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {patient.barangay}
                      </span>
                    )}
                    <div style={{ marginTop: "4px" }}>
                      {isInactive ? (
                        <button
                          onClick={() => openConfirm(patient, "reactivate")}
                          style={{
                            padding: "7px 10px",
                            borderRadius: "7px",
                            border: "none",
                            background: "#dcfce7",
                            color: "#16a34a",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirm(patient, "deactivate")}
                          style={{
                            padding: "7px 10px",
                            borderRadius: "7px",
                            border: "none",
                            background: "#fee2e2",
                            color: "#dc2626",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination controls */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              padding: "8px 14px",
              borderTop: "1px solid #f3f4f6",
              background: "#f9fafb",
            }}
          >
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              Showing {(safePage - 1) * PATIENTS_PER_PAGE + 1}–
              {Math.min(safePage * PATIENTS_PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: "7px",
                  border: "1px solid #e5e7eb",
                  background: safePage <= 1 ? "#f3f4f6" : "#ffffff",
                  color: safePage <= 1 ? "#9ca3af" : "#374151",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: safePage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <span
                style={{ fontSize: "12px", color: "#374151", padding: "0 4px" }}
              >
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage >= totalPages}
                style={{
                  padding: "6px 12px",
                  borderRadius: "7px",
                  border: "1px solid #e5e7eb",
                  background: safePage >= totalPages ? "#f3f4f6" : "#ffffff",
                  color: safePage >= totalPages ? "#9ca3af" : "#374151",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
