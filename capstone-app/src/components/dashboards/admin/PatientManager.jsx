import { useState, useEffect } from "react";
import Icon from "../../common/AppIcons";
import api from "../../../services/api";

const PM_RESPONSIVE_CSS = `
  .pm-table-row, .pm-table-head { display: grid; grid-template-columns: 1.5fr 1fr 1fr 80px 110px; }
  .pm-cards-mobile { display: none; }
  @media (max-width: 640px) {
    .pm-table-row, .pm-table-head { display: none !important; }
    .pm-cards-mobile { display: flex !important; flex-direction: column; gap: 10px; padding: 14px; }
  }
`;

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
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff", borderRadius: "16px",
          padding: "28px 24px", maxWidth: "360px", width: "100%",
          boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "10px",
            background: isDeactivate ? "#fee2e2" : "#dcfce7",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name={isDeactivate ? "xCircle" : "checkCircle"} size={20}
              color={isDeactivate ? "#dc2626" : "#16a34a"} />
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
            {isDeactivate ? "Deactivate Account" : "Reactivate Account"}
          </h3>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>
          {isDeactivate
            ? <>Are you sure you want to deactivate <strong style={{ color: "#111827" }}>{patientName}</strong>? They will lose access to the system.</>
            : <>Are you sure you want to reactivate <strong style={{ color: "#111827" }}>{patientName}</strong>? They will regain access to the system.</>
          }
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "9px", borderRadius: "8px",
            border: "1px solid #e5e7eb", background: "transparent",
            fontSize: "13px", color: "#374151", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 2, padding: "9px", borderRadius: "8px", border: "none",
            background: isDeactivate ? "#dc2626" : "#16a34a",
            fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer",
          }}>
            {isDeactivate ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientManager() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState({ open: false, userId: null, patientName: "", action: "" });

  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await api.get("/admin/patients");
      setPatients(data?.patients ?? []);
    } catch (err) {
      setFetchError(err.message || "Failed to load patient accounts.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (patient, action) => {
    setConfirm({ open: true, userId: patient.user_id, patientName: patient.full_name, action });
  };

  const closeConfirm = () => setConfirm({ open: false, userId: null, patientName: "", action: "" });

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
        (p.contact_number || "").includes(q) ||
        (p.barangay || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{PM_RESPONSIVE_CSS}</style>

      <ConfirmModal
        open={confirm.open}
        patientName={confirm.patientName}
        action={confirm.action}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            Patient Accounts
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
            View and manage patient account status
          </p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          Show inactive
        </label>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="search" size={15} color="#9ca3af" />
        </span>
        <input
          style={{
            width: "100%", padding: "9px 12px 9px 36px",
            borderRadius: "10px", border: "1.5px solid #e5e7eb",
            fontSize: "14px", color: "#111827", background: "#fafafa",
            boxSizing: "border-box", outline: "none", fontFamily: "inherit",
          }}
          placeholder="Search by name, contact, or barangay..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Patient Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden" }}>
        <div className="pm-table-head" style={{ padding: "12px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
          {["Full Name", "Contact", "Barangay", "Status", "Action"].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
            Loading patients...
          </div>
        ) : fetchError ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#dc2626" }}>{fetchError}</p>
            <button onClick={fetchPatients} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", fontSize: "13px", cursor: "pointer", color: "#374151" }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
            {search ? "No patients match your search." : "No patient accounts found."}
          </div>
        ) : (
          <>
            {/* Desktop rows */}
            {filtered.map((patient) => {
              const sb = statusBadge(patient.is_active);
              const isInactive = !patient.is_active;
              return (
                <div
                  key={patient.user_id}
                  className="pm-table-row"
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #f9fafb",
                    alignItems: "center",
                    opacity: isInactive ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                    {patient.full_name || "—"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {patient.contact_number || patient.phone || "—"}
                  </span>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {patient.barangay || "—"}
                  </span>
                  <span style={{
                    display: "inline-flex", width: "fit-content",
                    fontSize: "11px", fontWeight: 600,
                    padding: "3px 8px", borderRadius: "20px",
                    background: sb.bg, color: sb.color,
                  }}>
                    {sb.label}
                  </span>
                  {isInactive ? (
                    <button
                      onClick={() => openConfirm(patient, "reactivate")}
                      style={{
                        padding: "5px 10px", borderRadius: "7px", border: "none",
                        background: "#dcfce7", color: "#16a34a",
                        fontSize: "11px", fontWeight: 600, cursor: "pointer", width: "fit-content",
                      }}
                    >
                      Reactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => openConfirm(patient, "deactivate")}
                      style={{
                        padding: "5px 10px", borderRadius: "7px", border: "none",
                        background: "#fee2e2", color: "#dc2626",
                        fontSize: "11px", fontWeight: 600, cursor: "pointer", width: "fit-content",
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              );
            })}

            {/* Mobile cards */}
            <div className="pm-cards-mobile">
              {filtered.map((patient) => {
                const sb = statusBadge(patient.is_active);
                const isInactive = !patient.is_active;
                return (
                  <div
                    key={`m-${patient.user_id}`}
                    style={{
                      border: "1px solid #e5e7eb", borderRadius: "10px",
                      padding: "12px", background: "#fafafa",
                      display: "flex", flexDirection: "column", gap: "6px",
                      opacity: isInactive ? 0.65 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                        {patient.full_name || "—"}
                      </span>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "3px 8px",
                        borderRadius: "20px", background: sb.bg, color: sb.color, flexShrink: 0,
                      }}>
                        {sb.label}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      {patient.contact_number || patient.phone || "—"}
                    </span>
                    {patient.barangay && (
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>{patient.barangay}</span>
                    )}
                    <div style={{ marginTop: "4px" }}>
                      {isInactive ? (
                        <button
                          onClick={() => openConfirm(patient, "reactivate")}
                          style={{
                            padding: "7px 10px", borderRadius: "7px", border: "none",
                            background: "#dcfce7", color: "#16a34a",
                            fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirm(patient, "deactivate")}
                          style={{
                            padding: "7px 10px", borderRadius: "7px", border: "none",
                            background: "#fee2e2", color: "#dc2626",
                            fontSize: "12px", fontWeight: 600, cursor: "pointer",
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
      </div>
    </div>
  );
}
