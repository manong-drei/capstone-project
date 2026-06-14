import { useState } from "react";
import StaffManager from "./StaffManager";
import PatientManager from "./PatientManager";

const BLUE = "#1a3a8f";

/**
 * AdminStaffTab
 * Account management tab with Staff / Patients sub-toggle.
 */
export default function AdminStaffTab() {
  const [accountTab, setAccountTab] = useState("Staff");

  return (
    <div className="ad-tab-pad" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
        Account Management
      </h3>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["Staff", "Patients"].map((t) => (
          <button
            key={t}
            onClick={() => setAccountTab(t)}
            style={{
              padding: "8px 22px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: 600, transition: "all 0.15s",
              background: accountTab === t ? BLUE : "#f1f5f9",
              color: accountTab === t ? "#fff" : "#64748b",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {accountTab === "Staff" ? <StaffManager /> : <PatientManager />}
    </div>
  );
}
