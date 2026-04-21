import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useQueue } from "../hooks/useQueue";
import { ROUTES } from "../constants/routes";
import { QUEUE_STATUS } from "../constants/services";

import StatCard from "../components/common/StatCard";
import Icon from "../components/common/AppIcons";
import ConsultationModal from "../components/dashboards/doctor/ConsultationModal";
import api from "../services/api";

const INDIGO = "#4f46e5";
const NAVY = "#2d3a8c";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { queues, loading, error, fetchAllQueues, callNext, updateStatus } =
    useQueue();

  const [activeTab, setActiveTab] = useState("home");
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [servingPatient, setServingPatient] = useState(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [capacityCollapsed, setCapacityCollapsed] = useState(false);

  // Daily capacity state
  const [appointmentLimit, setAppointmentLimit] = useState(10);
  const [walkInLimit, setWalkInLimit] = useState(0);
  const [bookedCount, setBookedCount] = useState(0);
  const [walkInCount, setWalkInCount] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [pendingSettings, setPendingSettings] = useState(null);

  const fetchDailySettings = async () => {
    try {
      const data = await api.get(`/doctor/daily-settings?date=${TODAY}`);
      setAppointmentLimit(data.appointment_limit ?? 10);
      setWalkInLimit(data.walk_in_limit ?? 0);
      setBookedCount(data.booked_count ?? 0);
      setWalkInCount(data.walkin_count ?? 0);
    } catch (err) {
      if (import.meta.env.DEV) console.error("fetchDailySettings error:", err);
    }
  };

  const persistSettings = async (apptLimit, wiLimit) => {
    setSettingsLoading(true);
    try {
      await api.put("/doctor/daily-settings", {
        date: TODAY,
        appointment_limit: apptLimit,
        walk_in_limit: wiLimit,
      });
      setAppointmentLimit(apptLimit);
      setWalkInLimit(wiLimit);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      alert(err.message || "Failed to save settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleApplySettings = () => {
    if (appointmentLimit < bookedCount) {
      setPendingSettings({ appt: appointmentLimit, wi: walkInLimit });
      setShowLimitWarning(true);
    } else {
      persistSettings(appointmentLimit, walkInLimit);
    }
  };

  const handleConfirmWarning = () => {
    if (pendingSettings)
      persistSettings(pendingSettings.appt, pendingSettings.wi);
    setShowLimitWarning(false);
    setPendingSettings(null);
  };

  const handleCancelWarning = () => {
    fetchDailySettings(); // revert to last saved
    setShowLimitWarning(false);
    setPendingSettings(null);
  };

  useEffect(() => {
    fetchAllQueues();
    fetchDailySettings();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllQueues();
      fetchDailySettings();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    try {
      const next = await callNext();
      setServingPatient(next);
      setShowConsultModal(true);
      fetchAllQueues();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkDone = async (id) => {
    await updateStatus(id, QUEUE_STATUS.DONE);
    fetchAllQueues();
  };

  const handleSaveConsultation = async (notes) => {
    setConsultLoading(true);
    try {
      await api.post("/doctor/consultations", {
        queue_id: servingPatient?.id,
        ...notes,
      });
      setShowConsultModal(false);
      setServingPatient(null);
      fetchAllQueues();
    } catch (err) {
      alert(err.message);
    } finally {
      setConsultLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const waiting = queues.filter((q) => q.status === QUEUE_STATUS.WAITING);
  const serving = queues.filter((q) => q.status === QUEUE_STATUS.SERVING);
  const doneQueues = queues.filter((q) => q.status === QUEUE_STATUS.DONE);
  const done = doneQueues.length;
  const priority = queues.filter((q) => q.type === "priority").length;

  const walkInPercent =
    walkInLimit > 0
      ? Math.min(100, Math.round((walkInCount / walkInLimit) * 100))
      : 0;

  const apptPercent =
    appointmentLimit > 0
      ? Math.min(100, Math.round((bookedCount / appointmentLimit) * 100))
      : 0;
  const apptFull = bookedCount >= appointmentLimit && appointmentLimit > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column" }}>

      {/* ── Top Navbar ── */}
      <nav
        style={{
          background: "linear-gradient(90deg, #1a3a8f 0%, #1e4db7 100%)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/assets/Logo.jpg"
            alt="E-KALUSUGAN"
            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
          <span style={{ color: "white", fontWeight: 800, fontSize: "16px", letterSpacing: "0.1em" }}>
            E-KALUSUGAN
          </span>
        </div>

        {/* Right Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Analytics */}
          <button
            onClick={() => setActiveTab("analytics")}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: activeTab === "analytics" ? "rgba(255,255,255,0.2)" : "none",
              border: "none", color: "white",
              fontSize: "13px", fontWeight: 500, cursor: "pointer",
              padding: "7px 12px", borderRadius: "8px",
            }}
          >
            <Icon name="chart" size={16} color="white" />
            Analytics
          </button>

          {/* Appointment History */}
          <button
            onClick={() => setActiveTab("appointments")}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: activeTab === "appointments" ? "rgba(255,255,255,0.2)" : "none",
              border: "none", color: "white",
              fontSize: "13px", fontWeight: 500, cursor: "pointer",
              padding: "7px 12px", borderRadius: "8px",
            }}
          >
            <Icon name="appointment" size={16} color="white" />
            Appointment History
          </button>

          {/* Help */}
          <button
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", color: "white",
              fontSize: "13px", fontWeight: 500, cursor: "pointer",
              padding: "7px 12px", borderRadius: "8px",
            }}
          >
            <Icon name="info" size={16} color="white" />
            Help
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "rgba(255,255,255,0.15)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              color: "white",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              padding: "7px 16px", borderRadius: "24px",
              marginLeft: "8px",
            }}
          >
            <Icon name="user" size={16} color="white" />
            Logout
          </button>
        </div>
      </nav>

      {/* ── Home Tab ── */}
      {activeTab === "home" && (
        <>
          {/* Hero Section */}
          <section
            style={{
              position: "relative",
              minHeight: "320px",
              backgroundImage: "url('/assets/BGHero.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.42)" }} />
            <div style={{ position: "relative", zIndex: 1, padding: "40px 24px" }}>
              <h1
                style={{
                  margin: "0 0 2px",
                  fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                  fontWeight: 800, color: "#111827",
                  lineHeight: 1.2, letterSpacing: "-0.01em",
                }}
              >
                Your Health, Schedule.
              </h1>
              <h1
                style={{
                  margin: "0 0 16px",
                  fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                  fontWeight: 800, color: "#1e4db7",
                  lineHeight: 1.2, letterSpacing: "-0.01em",
                }}
              >
                No More Long Waits.
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(0.875rem, 2vw, 1rem)",
                  color: "#374151", maxWidth: "540px", lineHeight: 1.6,
                }}
              >
                Get your queue number online, check doctor availability, and track your wait
                time—all from your phone
              </p>
            </div>
          </section>

          {/* ── Daily Capacity (collapsible) ── */}
          <div style={{ padding: "20px 24px 0" }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {/* Header / toggle */}
              <button
                onClick={() => setCapacityCollapsed((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between", padding: "16px 20px",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: capacityCollapsed ? "none" : "1px solid #f3f4f6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon name="chart" size={18} color={INDIGO} />
                  <div style={{ textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                      Daily Capacity
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                      Today's patient limits — resets at midnight
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: "18px", color: "#9ca3af", transition: "transform 0.2s", transform: capacityCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
                  ▾
                </span>
              </button>

              {/* Body */}
              {!capacityCollapsed && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                    <button
                      onClick={handleApplySettings}
                      disabled={settingsLoading}
                      style={{
                        padding: "7px 18px", borderRadius: "8px", border: "none",
                        background: settingsSaved ? "#059669" : INDIGO,
                        color: "#fff", fontSize: "13px", fontWeight: 600,
                        cursor: settingsLoading ? "not-allowed" : "pointer",
                        opacity: settingsLoading ? 0.7 : 1,
                        transition: "background 0.2s",
                      }}
                    >
                      {settingsLoading ? "Saving..." : settingsSaved ? "Saved ✓" : "Apply"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                    {/* Appointment Limit */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                          Appointment Limit
                        </label>
                        <span
                          style={{
                            fontSize: "12px", fontWeight: 700,
                            color: appointmentLimit === 10 ? "#059669" : INDIGO,
                            background: appointmentLimit === 10 ? "#ecfdf5" : "#eef2ff",
                            padding: "2px 10px", borderRadius: "20px",
                          }}
                        >
                          {appointmentLimit === 10 ? "Maximum (10)" : `${appointmentLimit} / 10`}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={10} value={appointmentLimit}
                        onChange={(e) => setAppointmentLimit(parseInt(e.target.value))}
                        style={{ width: "100%", accentColor: INDIGO, cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>
                        <span>0</span><span>10 (max)</span>
                      </div>
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>
                          <span>Appointments today</span>
                          <span style={{ fontWeight: 600, color: "#111827" }}>
                            {bookedCount} / {appointmentLimit > 0 ? appointmentLimit : "—"}
                          </span>
                        </div>
                        <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%", borderRadius: "99px", width: `${apptPercent}%`,
                              background: apptPercent >= 100 ? "#dc2626" : apptPercent >= 80 ? "#f97316" : "#059669",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        {apptFull && (
                          <p style={{ margin: "8px 0 0", fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: "6px", textAlign: "center" }}>
                            ⚠ SLOTS FULL — No more appointments can be booked today
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Walk-In Capacity */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                          Walk-In Capacity
                        </label>
                        <span
                          style={{
                            fontSize: "12px", fontWeight: 700,
                            color: walkInLimit > 0 ? "#f97316" : "#9ca3af",
                            background: walkInLimit > 0 ? "#fff7ed" : "#f3f4f6",
                            padding: "2px 10px", borderRadius: "20px",
                          }}
                        >
                          {walkInLimit > 0 ? `${walkInLimit} slots` : "Not set"}
                        </span>
                      </div>
                      <input
                        type="number" min={0} max={999} value={walkInLimit}
                        onChange={(e) => setWalkInLimit(Math.min(999, Math.max(0, parseInt(e.target.value) || 0)))}
                        style={{ width: "80px", padding: "6px 10px", borderRadius: "7px", border: "1.5px solid #d1d5db", fontSize: "15px", fontWeight: 600, color: "#111827", outline: "none" }}
                      />
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginBottom: "5px" }}>
                          <span>Walk-ins today</span>
                          <span style={{ fontWeight: 600, color: "#111827" }}>
                            {walkInCount} / {walkInLimit > 0 ? walkInLimit : "—"}
                          </span>
                        </div>
                        <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%", borderRadius: "99px", width: `${walkInPercent}%`,
                              background: walkInPercent >= 100 ? "#dc2626" : walkInPercent >= 80 ? "#f97316" : "#059669",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        {walkInLimit > 0 && walkInCount >= walkInLimit && (
                          <p style={{ margin: "8px 0 0", fontSize: "11px", fontWeight: 700, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: "6px", textAlign: "center" }}>
                            ⚠ SLOTS FULL — No more walk-ins can be accepted today
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Now Queuing / Next Queuing ── */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            style={{ padding: "16px 24px 0" }}
          >
            {/* Now Queuing */}
            <div
              style={{
                background: "#f97316",
                borderRadius: "16px",
                padding: "24px 28px",
                boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em" }}>
                Now Queuing
              </p>
              <p style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
                {serving.length > 0 ? serving[0].queue_number : "—"}
              </p>
            </div>

            {/* Next Queuing */}
            <div
              style={{
                background: NAVY,
                borderRadius: "16px",
                padding: "24px 28px",
                boxShadow: "0 4px 16px rgba(45,58,140,0.25)",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.06em" }}>
                Next Queuing
              </p>
              <p style={{ margin: 0, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
                {waiting.length > 0 ? waiting[0].queue_number : "—"}
              </p>
            </div>
          </div>

          {/* ── Queue Cards Grid ── */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            style={{ padding: "16px 24px 0" }}
          >
            {/* Currently Serving */}
            <div
              style={{
                background: "white", borderRadius: "16px",
                padding: "22px", border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex", flexDirection: "column", gap: "14px",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", letterSpacing: "0.04em" }}>
                Currently Serving
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#111827" }}>
                  {serving.length > 0 ? serving[0].queue_number : "—"}
                </span>
                {serving.length > 0 && (
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                    {serving[0].patient_name ?? serving[0].full_name ?? ""}
                  </span>
                )}
              </div>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "#374151" }}>
                  Reason Consultation
                </p>
                <div style={{ height: "1.5px", background: "#1e4db7", borderRadius: "2px" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <button
                  onClick={() => serving.length > 0 && handleMarkDone(serving[0].id)}
                  disabled={serving.length === 0}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: "10px", border: "none",
                    background: serving.length > 0 ? NAVY : "#e5e7eb",
                    color: serving.length > 0 ? "white" : "#9ca3af",
                    fontSize: "12px", fontWeight: 700,
                    cursor: serving.length > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  Mark as Complete
                </button>
                <button
                  onClick={handleCallNext}
                  disabled={waiting.length === 0 || loading}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: "10px", border: "none",
                    background: waiting.length > 0 ? NAVY : "#e5e7eb",
                    color: waiting.length > 0 ? "white" : "#9ca3af",
                    fontSize: "12px", fontWeight: 700,
                    cursor: waiting.length > 0 && !loading ? "pointer" : "not-allowed",
                  }}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Competed List */}
            <div
              style={{
                background: "white", borderRadius: "16px",
                padding: "22px", border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", letterSpacing: "0.04em" }}>
                Competed List
              </p>
              {doneQueues.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center" }}>No completed patients yet.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {doneQueues.slice(0, 5).map((q) => (
                    <li key={q.id} style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                      #{q.patient_name ?? q.full_name ?? q.queue_number}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Average Time of Waiting */}
            <div
              style={{
                background: "white", borderRadius: "16px",
                padding: "22px", border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex", alignItems: "flex-start",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", width: "100%", letterSpacing: "0.04em" }}>
                Average Time of Waiting
              </p>
            </div>
          </div>

          {/* ── Name of the Next Patient ── */}
          <div style={{ padding: "16px 24px 32px" }}>
            <div
              style={{
                background: "white", borderRadius: "16px",
                padding: "22px", border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#374151", textAlign: "center", letterSpacing: "0.04em" }}>
                Name of the Next Patient
              </p>
              {waiting.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center" }}>No patients in queue.</p>
              ) : (
                <ol style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {waiting.slice(0, 8).map((q) => (
                    <li key={q.id} style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                      {q.patient_name ?? q.full_name ?? q.queue_number}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: "14px", padding: "0 24px" }}>{error}</p>}
        </>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === "analytics" && (
        <div style={{ flex: 1, padding: "28px 24px", maxWidth: "960px", margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setActiveTab("home")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", fontWeight: 500 }}
              >
                ← Back
              </button>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                Today's Analytics
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard icon="users"       label="Waiting"              value={waiting.length}          color={NAVY}      />
              <StatCard icon="heart"       label="Serving"              value={serving.length}          color="#059669"   />
              <StatCard icon="checkCircle" label="Completed"            value={done}                    color="#6b7280"   />
              <StatCard icon="star"        label="Priority"             value={priority}                color="#f97316"   />
              <StatCard icon="appointment" label="Appointments Today"   value={bookedCount}             color={INDIGO}    />
              <StatCard icon="queue"       label="Walk-ins Today"       value={walkInCount}             color="#f97316"   />
              <StatCard icon="users"       label="Total Patients Today" value={bookedCount + walkInCount} color="#1a3a8f" />
            </div>
          </div>
        </div>
      )}

      {/* ── Appointment History Tab ── */}
      {activeTab === "appointments" && (
        <div style={{ flex: 1, padding: "28px 24px", maxWidth: "960px", margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <button
              onClick={() => setActiveTab("home")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", fontWeight: 500 }}
            >
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#111827" }}>
              Appointment History
            </h2>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Appointment history coming soon.</p>
        </div>
      )}

      {/* ── Consultation Modal ── */}
      <ConsultationModal
        isOpen={showConsultModal}
        onClose={() => setShowConsultModal(false)}
        onSubmit={handleSaveConsultation}
        patient={servingPatient}
        loading={consultLoading}
      />

      {/* ── Limit Warning Modal ── */}
      {showLimitWarning && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#fff", borderRadius: "16px",
              padding: "28px 28px 24px", maxWidth: "420px", width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              Lower Appointment Limit?
            </h3>
            <p style={{ margin: "0 0 22px", fontSize: "14px", color: "#4b5563", lineHeight: 1.6 }}>
              You currently have <strong>{bookedCount}</strong> appointment{bookedCount !== 1 ? "s" : ""} booked today. Lowering the limit below this number will prevent new bookings but will <strong>not</strong> cancel existing appointments. Continue?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelWarning}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "1.5px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWarning}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
