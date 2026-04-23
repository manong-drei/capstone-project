import { useState, useEffect } from "react";
import Icon from "../../common/AppIcons";
import api from "../../../services/api";

const ROLES = ["doctor", "staff", "admin"];

const STAFF_RESPONSIVE_CSS = `
  .sm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .sm-table-row, .sm-table-head { display: grid; grid-template-columns: 1fr 1fr 80px 80px 120px; }
  .sm-cards-mobile { display: none; }
  @media (max-width: 640px) {
    .sm-form-grid { grid-template-columns: 1fr !important; }
    .sm-table-row, .sm-table-head { display: none !important; }
    .sm-cards-mobile { display: flex !important; flex-direction: column; gap: 10px; padding: 14px; }
    .sm-empty-mobile { padding: 28px 16px !important; }
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

function roleBadge(role) {
  const map = {
    admin:  { bg: "#fef3c7", color: "#92400e" },
    doctor: { bg: "#ede9fe", color: "#5b21b6" },
    staff:  { bg: "#dcfce7", color: "#166534" },
  };
  return map[role] ?? { bg: "#f3f4f6", color: "#374151" };
}

function statusBadge(isActive) {
  return isActive
    ? { bg: "#dcfce7", color: "#166534", label: "Active" }
    : { bg: "#fee2e2", color: "#dc2626", label: "Inactive" };
}

// Inline confirmation modal
function ConfirmModal({ open, memberName, action, onConfirm, onCancel }) {
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
            ? <>Are you sure you want to deactivate <strong style={{ color: "#111827" }}>{memberName}</strong>? They will lose access to the system.</>
            : <>Are you sure you want to reactivate <strong style={{ color: "#111827" }}>{memberName}</strong>? They will regain access to the system.</>
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

// Edit staff modal
function EditStaffModal({ member, specializations, onSave, onClose }) {
  const [form, setForm] = useState({
    first_name: member.first_name || "",
    last_name: member.last_name || "",
    email: member.email || "",
    phone: member.phone || "",
    license_number: member.license_number || "",
    specialization_id: member.specialization_id ?? "",
    position: member.position || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setError("");
    if (!form.first_name || !form.last_name) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/staff/${member.user_id}`, form);
      onSave();
    } catch (err) {
      setError(err.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: "16px",
          padding: "24px", maxWidth: "480px", width: "100%",
          boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
          maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
            Edit Staff Account
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="close" size={18} color="#6b7280" />
          </button>
        </div>

        <div className="sm-form-grid" style={{ marginBottom: "12px" }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input style={inputStyle} value={form.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input style={inputStyle} value={form.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" style={inputStyle} value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>
        </div>

        {member.role === "doctor" && (
          <div className="sm-form-grid" style={{ marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>License Number</label>
              <input style={inputStyle} value={form.license_number} onChange={(e) => handleChange("license_number", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Specialization</label>
              {specializations.length > 0 ? (
                <select style={inputStyle} value={form.specialization_id} onChange={(e) => handleChange("specialization_id", e.target.value)}>
                  <option value="">-- None --</option>
                  {specializations.map((s) => (
                    <option key={s.specialization_id} value={s.specialization_id}>{s.specialization_name}</option>
                  ))}
                </select>
              ) : (
                <input type="number" style={inputStyle} value={form.specialization_id} onChange={(e) => handleChange("specialization_id", e.target.value)} />
              )}
            </div>
          </div>
        )}

        {member.role === "staff" && (
          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Position</label>
            <input style={inputStyle} value={form.position} onChange={(e) => handleChange("position", e.target.value)} />
          </div>
        )}

        {error && <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#dc2626" }}>{error}</p>}

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "9px", borderRadius: "8px",
            border: "1px solid #e5e7eb", background: "transparent",
            fontSize: "13px", color: "#374151", cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: "9px", borderRadius: "8px", border: "none",
            background: "#4f46e5", fontSize: "13px", fontWeight: 600,
            color: "#fff", cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [showInactive, setShowInactive] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, memberId: null, memberName: "", action: "" });
  const [editMember, setEditMember] = useState(null);

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "doctor",
    license_number: "",
    specialization_id: "",
    position: "",
  });

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { if (form.role === "doctor") fetchSpecializations(); }, [form.role]);

  const fetchStaff = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await api.get("/admin/staff");
      setStaff(data?.staff ?? []);
    } catch (err) {
      setFetchError(err.message || "Failed to load staff accounts.");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const data = await api.get("/admin/specializations");
      setSpecializations(data?.specializations ?? []);
    } catch {
      setSpecializations([]);
    }
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleRoleChange = (value) => {
    setForm((prev) => ({ ...prev, role: value, license_number: "", specialization_id: "", position: "" }));
  };

  const handleAddStaff = async () => {
    setFormError("");
    if (!form.username || !form.first_name || !form.last_name || !form.email || !form.phone || !form.password) {
      setFormError("All fields are required.");
      return;
    }
    if (form.role === "doctor" && !form.license_number) {
      setFormError("License number is required for doctors.");
      return;
    }
    if (form.role === "staff" && !form.position) {
      setFormError("Position is required for staff.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/staff", form);
      setShowForm(false);
      setForm({ username: "", first_name: "", last_name: "", email: "", phone: "", password: "", role: "doctor", license_number: "", specialization_id: "", position: "" });
      fetchStaff();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirm = (member, action) => {
    setConfirm({ open: true, memberId: member.user_id, memberName: `${member.first_name} ${member.last_name}`, action });
  };

  const closeConfirm = () => setConfirm({ open: false, memberId: null, memberName: "", action: "" });

  const handleConfirmAction = async () => {
    const { memberId, action } = confirm;
    closeConfirm();
    try {
      await api.patch(`/admin/staff/${memberId}/${action}`);
      fetchStaff();
    } catch (err) {
      alert(err.message);
    }
  };

  const visibleStaff = showInactive ? staff : staff.filter((m) => m.is_active);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{STAFF_RESPONSIVE_CSS}</style>

      <ConfirmModal
        open={confirm.open}
        memberName={confirm.memberName}
        action={confirm.action}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />

      {editMember && (
        <EditStaffModal
          member={editMember}
          specializations={specializations}
          onSave={() => { setEditMember(null); fetchStaff(); }}
          onClose={() => setEditMember(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            Staff Management
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}>
            Manage doctor, staff, and admin accounts
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6b7280", cursor: "pointer" }}>
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
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "10px", border: "none",
              background: "#4f46e5", color: "#ffffff", fontSize: "13px",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            <Icon name="plus" size={16} color="#ffffff" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <div style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "14px", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: "#111827" }}>
            New Staff Account
          </h3>

          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={form.role} onChange={(e) => handleRoleChange(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="sm-form-grid" style={{ marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input style={inputStyle} value={form.username} onChange={(e) => handleChange("username", e.target.value)} placeholder="e.g. dr.santos" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" style={inputStyle} value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="09XX XXX XXXX" />
            </div>
            <div>
              <label style={labelStyle}>First Name</label>
              <input style={inputStyle} value={form.first_name} onChange={(e) => handleChange("first_name", e.target.value)} placeholder="Juan" />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input style={inputStyle} value={form.last_name} onChange={(e) => handleChange("last_name", e.target.value)} placeholder="Dela Cruz" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" style={inputStyle} value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="doctor@bago.gov.ph" />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" style={inputStyle} value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Temporary password" />
            </div>
          </div>

          {form.role === "doctor" && (
            <div className="sm-form-grid" style={{ marginBottom: "12px" }}>
              <div>
                <label style={labelStyle}>License Number <span style={{ color: "#dc2626" }}>*</span></label>
                <input style={inputStyle} value={form.license_number} onChange={(e) => handleChange("license_number", e.target.value)} placeholder="PRC License No." />
              </div>
              <div>
                <label style={labelStyle}>Specialization</label>
                {specializations.length > 0 ? (
                  <select style={inputStyle} value={form.specialization_id} onChange={(e) => handleChange("specialization_id", e.target.value)}>
                    <option value="">-- None --</option>
                    {specializations.map((s) => (
                      <option key={s.specialization_id} value={s.specialization_id}>{s.specialization_name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="number" style={inputStyle} value={form.specialization_id} onChange={(e) => handleChange("specialization_id", e.target.value)} placeholder="Specialization ID (optional)" />
                )}
              </div>
            </div>
          )}

          {form.role === "staff" && (
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Position <span style={{ color: "#dc2626" }}>*</span></label>
              <input style={inputStyle} value={form.position} onChange={(e) => handleChange("position", e.target.value)} placeholder="e.g. Nurse, Clerk" />
            </div>
          )}

          {formError && <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#dc2626" }}>{formError}</p>}

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowForm(false)} style={{
              flex: 1, padding: "9px", borderRadius: "8px",
              border: "1px solid #e5e7eb", background: "transparent",
              fontSize: "13px", color: "#374151", cursor: "pointer",
            }}>
              Cancel
            </button>
            <button onClick={handleAddStaff} disabled={submitting} style={{
              flex: 2, padding: "9px", borderRadius: "8px", border: "none",
              background: "#4f46e5", fontSize: "13px", fontWeight: 600,
              color: "#fff", cursor: submitting ? "not-allowed" : "pointer",
            }}>
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden" }}>
        <div className="sm-table-head" style={{ padding: "12px 20px", background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
          {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>Loading staff...</div>
        ) : fetchError ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#dc2626" }}>{fetchError}</p>
            <button onClick={fetchStaff} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", fontSize: "13px", cursor: "pointer", color: "#374151" }}>
              Retry
            </button>
          </div>
        ) : visibleStaff.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
            No staff accounts found.
          </div>
        ) : (
          <>
            {/* Desktop table rows */}
            {visibleStaff.map((member) => {
              const badge = roleBadge(member.role);
              const sb = statusBadge(member.is_active);
              const isInactive = !member.is_active;
              return (
                <div
                  key={member.user_id}
                  className="sm-table-row"
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #f9fafb",
                    alignItems: "center",
                    opacity: isInactive ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                    {member.first_name} {member.last_name}
                  </span>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>{member.email}</span>
                  <span style={{
                    display: "inline-flex", width: "fit-content",
                    fontSize: "11px", fontWeight: 600,
                    padding: "3px 8px", borderRadius: "20px",
                    background: badge.bg, color: badge.color,
                  }}>
                    {member.role}
                  </span>
                  <span style={{
                    display: "inline-flex", width: "fit-content",
                    fontSize: "11px", fontWeight: 600,
                    padding: "3px 8px", borderRadius: "20px",
                    background: sb.bg, color: sb.color,
                  }}>
                    {sb.label}
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {!isInactive && (
                      <button
                        onClick={() => { fetchSpecializations(); setEditMember(member); }}
                        style={{
                          padding: "5px 10px", borderRadius: "7px", border: "none",
                          background: "#e0e7ff", color: "#4338ca",
                          fontSize: "11px", fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {isInactive ? (
                      <button
                        onClick={() => openConfirm(member, "reactivate")}
                        style={{
                          padding: "5px 10px", borderRadius: "7px", border: "none",
                          background: "#dcfce7", color: "#16a34a",
                          fontSize: "11px", fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => openConfirm(member, "deactivate")}
                        style={{
                          padding: "5px 10px", borderRadius: "7px", border: "none",
                          background: "#fee2e2", color: "#dc2626",
                          fontSize: "11px", fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Mobile cards */}
            <div className="sm-cards-mobile">
              {visibleStaff.map((member) => {
                const badge = roleBadge(member.role);
                const isInactive = !member.is_active;
                return (
                  <div
                    key={`m-${member.user_id}`}
                    style={{
                      border: "1px solid #e5e7eb", borderRadius: "10px",
                      padding: "12px", background: "#fafafa",
                      display: "flex", flexDirection: "column", gap: "6px",
                      opacity: isInactive ? 0.65 : 1,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                        {member.first_name} {member.last_name}
                      </span>
                      <span style={{
                        fontSize: "11px", fontWeight: 600, padding: "3px 8px",
                        borderRadius: "20px", background: badge.bg, color: badge.color, flexShrink: 0,
                      }}>
                        {member.role}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280", wordBreak: "break-all" }}>{member.email}</span>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      {!isInactive && (
                        <button
                          onClick={() => { fetchSpecializations(); setEditMember(member); }}
                          style={{
                            padding: "7px 10px", borderRadius: "7px", border: "none",
                            background: "#e0e7ff", color: "#4338ca",
                            fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {isInactive ? (
                        <button
                          onClick={() => openConfirm(member, "reactivate")}
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
                          onClick={() => openConfirm(member, "deactivate")}
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
