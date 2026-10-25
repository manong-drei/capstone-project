import { lazy, Suspense, useState } from "react";
const StaffManager = lazy(() => import("./StaffManager"));
const PatientManager = lazy(() => import("./PatientManager"));

const BLUE = "#1a3a8f";

/**
 * AdminStaffTab
 * Account management tab with Staff / Patients sub-toggle.
 */
export default function AdminStaffTab() {
  const [accountTab, setAccountTab] = useState("Staff");

  return (
    <div className="ad-tab-pad" style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
          Account Management
        </h3>
        <div role="group" aria-label="Account type" className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {["Staff", "Patients"].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={accountTab === t}
              onClick={() => setAccountTab(t)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              style={{
                padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: 600, transition: "all 0.15s",
                background: accountTab === t ? BLUE : "#f1f5f9",
                color: accountTab === t ? "#fff" : "#64748b",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <Suspense fallback={<p role="status" style={{ minHeight: "280px" }}>Loading accounts…</p>}>
        {accountTab === "Staff" ? <StaffManager /> : <PatientManager />}
      </Suspense>
    </div>
  );
}
