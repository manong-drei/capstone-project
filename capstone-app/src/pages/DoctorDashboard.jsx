import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useQueue } from "../hooks/useQueue";
import { ROUTES } from "../constants/routes";
import { QUEUE_STATUS } from "../constants/services";

import NavBtn from "../components/common/NavBtn";
import StatCard from "../components/common/StatCard";
import PatientQueue from "../components/dashboards/doctor/PatientQueue";
import ConsultationModal from "../components/dashboards/doctor/ConsultationModal";
import api from "../services/api";

const INDIGO = "#4f46e5";
const NAVY = "#2d3a8c";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { queues, loading, error, fetchAllQueues, callNext, updateStatus } =
    useQueue();

  const [activeTab, setActiveTab] = useState("queue");
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [servingPatient, setServingPatient] = useState(null);
  const [consultLoading, setConsultLoading] = useState(false);

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

  const waiting = queues.filter(
    (q) => q.status === QUEUE_STATUS.WAITING,
  ).length;
  const serving = queues.filter(
    (q) => q.status === QUEUE_STATUS.SERVING,
  ).length;
  const done = queues.filter((q) => q.status === QUEUE_STATUS.DONE).length;
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
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex" }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          background: "#ffffff",
          borderRight: "1px solid #f3f4f6",
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ padding: "0 8px", marginBottom: "28px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 800,
              color: NAVY,
            }}
          >
            E-KALUSUGAN
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af" }}>
            Dentist Portal
          </p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: 1,
          }}
        >
          <NavBtn
            icon="queue"
            label="Patient Queue"
            active={activeTab === "queue"}
            onClick={() => setActiveTab("queue")}
            color={INDIGO}
          />
          <NavBtn
            icon="chart"
            label="Summary"
            active={activeTab === "summary"}
            onClick={() => setActiveTab("summary")}
            color={INDIGO}
          />
        </nav>

        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
          <div style={{ padding: "0 8px", marginBottom: "8px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Dr. {user?.last_name}
            </p>
            <p
              style={{ margin: "1px 0 0", fontSize: "11px", color: "#9ca3af" }}
            >
              Dentist
            </p>
          </div>
          <NavBtn
            icon="logout"
            label="Logout"
            onClick={handleLogout}
            color="#dc2626"
          />
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "28px 24px", maxWidth: "960px" }}>
        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Patient Queue
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                {new Date().toLocaleDateString("en-PH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* ── Daily Capacity Card ── */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Daily Capacity
                  </h3>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "12px",
                      color: "#9ca3af",
                    }}
                  >
                    Today's patient limits — resets at midnight
                  </p>
                </div>
                <button
                  onClick={handleApplySettings}
                  disabled={settingsLoading}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "7px",
                    border: "none",
                    background: settingsSaved ? "#059669" : INDIGO,
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: settingsLoading ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                    opacity: settingsLoading ? 0.7 : 1,
                  }}
                >
                  {settingsLoading
                    ? "Saving..."
                    : settingsSaved
                      ? "Saved ✓"
                      : "Apply"}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "28px",
                  alignItems: "stretch",
                }}
              >
                {/* Appointment Limit Slider */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      Appointment Limit
                    </label>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: appointmentLimit === 10 ? "#059669" : INDIGO,
                        background:
                          appointmentLimit === 10 ? "#ecfdf5" : "#eef2ff",
                        padding: "2px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      {appointmentLimit === 10
                        ? "Maximum (10)"
                        : `${appointmentLimit} / 10`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={appointmentLimit}
                    onChange={(e) =>
                      setAppointmentLimit(parseInt(e.target.value))
                    }
                    style={{
                      width: "100%",
                      accentColor: INDIGO,
                      cursor: "pointer",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      color: "#9ca3af",
                      marginTop: "3px",
                    }}
                  >
                    <span>0</span>
                    <span>10 (max)</span>
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "5px",
                      }}
                    >
                      <span>Appointments today</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>
                        {bookedCount} /{" "}
                        {appointmentLimit > 0 ? appointmentLimit : "—"}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        background: "#f3f4f6",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "99px",
                          width: `${apptPercent}%`,
                          background:
                            apptPercent >= 100
                              ? "#dc2626"
                              : apptPercent >= 80
                                ? "#f97316"
                                : "#059669",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    {apptFull && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#dc2626",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          textAlign: "center",
                          letterSpacing: "0.02em",
                        }}
                      >
                        ⚠ SLOTS FULL — No more appointments can be booked today
                      </p>
                    )}
                  </div>
                </div>

                {/* Walk-In Capacity */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      Walk-In Capacity
                    </label>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: walkInLimit > 0 ? "#f97316" : "#9ca3af",
                        background: walkInLimit > 0 ? "#fff7ed" : "#f3f4f6",
                        padding: "2px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      {walkInLimit > 0 ? `${walkInLimit} slots` : "Not set"}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={walkInLimit}
                    onChange={(e) => {
                      const val = Math.min(
                        999,
                        Math.max(0, parseInt(e.target.value) || 0),
                      );
                      setWalkInLimit(val);
                    }}
                    style={{
                      width: "80px",
                      padding: "6px 10px",
                      borderRadius: "7px",
                      border: "1.5px solid #d1d5db",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#111827",
                      outline: "none",
                    }}
                  />
                  <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "5px",
                      }}
                    >
                      <span>Walk-ins today</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>
                        {walkInCount} / {walkInLimit > 0 ? walkInLimit : "—"}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        background: "#f3f4f6",
                        borderRadius: "99px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "99px",
                          width: `${walkInPercent}%`,
                          background:
                            walkInPercent >= 100
                              ? "#dc2626"
                              : walkInPercent >= 80
                                ? "#f97316"
                                : "#059669",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    {walkInLimit > 0 && walkInCount >= walkInLimit && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#dc2626",
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          textAlign: "center",
                          letterSpacing: "0.02em",
                        }}
                      >
                        ⚠ SLOTS FULL — No more walk-ins can be accepted today
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* ── End Daily Capacity Card ── */}

            {error && (
              <p style={{ color: "#dc2626", fontSize: "14px" }}>{error}</p>
            )}
            {loading && (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                Refreshing queue...
              </p>
            )}

            <PatientQueue
              queues={queues}
              onCallNext={handleCallNext}
              onMarkDone={handleMarkDone}
              loading={loading}
            />
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === "summary" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Today's Summary
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "14px",
              }}
            >
              <StatCard
                icon="users"
                label="Waiting"
                value={waiting}
                color={NAVY}
              />
              <StatCard
                icon="heart"
                label="Serving"
                value={serving}
                color="#059669"
              />
              <StatCard
                icon="checkCircle"
                label="Completed"
                value={done}
                color="#6b7280"
              />
              <StatCard
                icon="star"
                label="Priority"
                value={priority}
                color="#f97316"
              />
              <StatCard
                icon="appointment"
                label="Appointments Today"
                value={bookedCount}
                color={INDIGO}
              />
              <StatCard
                icon="queue"
                label="Walk-ins Today"
                value={walkInCount}
                color="#f97316"
              />
              <StatCard
                icon="users"
                label="Total Patients Today"
                value={bookedCount + walkInCount}
                color="#1a3a8f"
              />
            </div>
          </div>
        )}
      </main>

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
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "28px 28px 24px",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Lower Appointment Limit?
            </h3>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: "14px",
                color: "#4b5563",
                lineHeight: 1.6,
              }}
            >
              You currently have <strong>{bookedCount}</strong> appointment
              {bookedCount !== 1 ? "s" : ""} booked today. Lowering the limit
              below this number will prevent new bookings but will{" "}
              <strong>not</strong> cancel existing appointments. Continue?
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleCancelWarning}
                style={{
                  padding: "8px 18px",
                  borderRadius: "7px",
                  border: "1.5px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWarning}
                style={{
                  padding: "8px 18px",
                  borderRadius: "7px",
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
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
