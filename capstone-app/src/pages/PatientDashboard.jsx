import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useQueue } from "../hooks/useQueue";
import { ROUTES } from "../constants/routes";
import { QUEUE_STATUS } from "../constants/services";

import StatCard from "../components/common/StatCard";
import ActionCard from "../components/common/ActionCard";
import NavBtn from "../components/common/NavBtn";
import Icon from "../components/common/AppIcons";
import GetQueueModal from "../components/dashboards/patient/GetQueueModal";
import QueueStatus from "../components/dashboards/patient/QueueStatus";

import * as appointmentService from "../services/appointmentService";
import * as queueService from "../services/queueService";

const INDIGO = "#4f46e5";
const ORANGE = "#f97316";
const NAVY = "#2d3a8c";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { queue, loading, error, fetchMyQueue, submitQueue } = useQueue();

  const [activeTab, setActiveTab] = useState("home");
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);

  useEffect(() => {
    fetchMyQueue();
  }, []);

  useEffect(() => {
    if (activeTab === "appointments") loadAppointments();
  }, [activeTab]);

  const loadAppointments = async () => {
    setApptLoading(true);
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(data?.appointments ?? []);
    } catch {
      setAppointments([]);
    } finally {
      setApptLoading(false);
    }
  };

  const handleGetQueue = async (payload) => {
    try {
      await submitQueue(payload);
      setShowQueueModal(false);
    } catch {
      /* error shown by hook */
    }
  };

  const handleCancelQueue = async () => {
    if (!window.confirm("Cancel your queue number?")) return;
    try {
      await queueService.cancelQueue(queue.id);
      fetchMyQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const hasActiveQueue =
    queue &&
    queue.status !== QUEUE_STATUS.DONE &&
    queue.status !== QUEUE_STATUS.CANCELLED;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex" }}>
      {/* ── Sidebar (desktop) ── */}
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
        className="sidebar-desktop"
      >
        {/* Brand */}
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
            Bago City Health Center
          </p>
        </div>

        {/* Nav */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flex: 1,
          }}
        >
          <NavBtn
            icon="home"
            label="Home"
            active={activeTab === "home"}
            onClick={() => setActiveTab("home")}
            color={INDIGO}
          />
          <NavBtn
            icon="queue"
            label="My Queue"
            active={activeTab === "queue"}
            onClick={() => setActiveTab("queue")}
            color={INDIGO}
          />
          <NavBtn
            icon="appointment"
            label="Appointments"
            active={activeTab === "appointments"}
            onClick={() => setActiveTab("appointments")}
            color={INDIGO}
          />
        </nav>

        {/* User + Logout */}
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
              {user?.first_name} {user?.last_name}
            </p>
            <p
              style={{ margin: "1px 0 0", fontSize: "11px", color: "#9ca3af" }}
            >
              Patient
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

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: "28px 24px", maxWidth: "860px" }}>
        {/* Home Tab */}
        {activeTab === "home" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Welcome */}
            <div
              style={{
                background: `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 100%)`,
                borderRadius: "20px",
                padding: "28px",
                color: "#ffffff",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "13px",
                  color: "#c7d2fe",
                }}
              >
                Welcome back,
              </p>
              <h2
                style={{
                  margin: "0 0 6px",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                {user?.first_name ?? "Patient"} 👋
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#a5b4fc" }}>
                Bago City Health Center —{" "}
                {new Date().toLocaleDateString("en-PH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Active Queue Alert */}
            {hasActiveQueue && (
              <QueueStatus queue={queue} onCancel={handleCancelQueue} />
            )}

            {/* Quick Actions */}
            <div>
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Quick Actions
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                <ActionCard
                  icon="queue"
                  title="Get Queue Number"
                  description="Join today's patient queue"
                  color={NAVY}
                  disabled={hasActiveQueue}
                  onClick={() => setShowQueueModal(true)}
                />
                <ActionCard
                  icon="appointment"
                  title="Book Appointment"
                  description="Schedule a future visit"
                  color={ORANGE}
                  onClick={() => setActiveTab("appointments")}
                />
              </div>
              {hasActiveQueue && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "12px",
                    color: "#9ca3af",
                  }}
                >
                  You already have an active queue number. Cancel it first to
                  get a new one.
                </p>
              )}
            </div>

            {/* Stats */}
            <div>
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#374151",
                }}
              >
                Your Activity
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                }}
              >
                <StatCard
                  icon="queue"
                  label="Queue Today"
                  value={hasActiveQueue ? queue.queue_number : "—"}
                  color={NAVY}
                />
                <StatCard
                  icon="appointment"
                  label="Upcoming Visits"
                  value={
                    appointments.filter((a) => a.status === "confirmed").length
                  }
                  color={ORANGE}
                />
                <StatCard
                  icon="checkCircle"
                  label="Past Consultations"
                  value="—"
                  color={INDIGO}
                />
              </div>
            </div>
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              My Queue
            </h2>
            {loading && <p style={{ color: "#9ca3af" }}>Loading...</p>}
            {error && <p style={{ color: "#dc2626" }}>{error}</p>}
            {!loading && !hasActiveQueue && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                >
                  You don't have an active queue number.
                </p>
                <button
                  onClick={() => setShowQueueModal(true)}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "12px",
                    border: "none",
                    background: NAVY,
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Get Queue Number
                </button>
              </div>
            )}
            {hasActiveQueue && (
              <QueueStatus queue={queue} onCancel={handleCancelQueue} />
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Appointments
              </h2>
            </div>
            {apptLoading ? (
              <p style={{ color: "#9ca3af" }}>Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                No appointments found.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#111827",
                        }}
                      >
                        {appt.service}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        {new Date(appt.date).toLocaleDateString("en-PH", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {appt.time ? ` at ${appt.time}` : ""}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background:
                          appt.status === "confirmed" ? "#d1fae5" : "#f3f4f6",
                        color:
                          appt.status === "confirmed" ? "#059669" : "#6b7280",
                      }}
                    >
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Get Queue Modal ── */}
      <GetQueueModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        onSubmit={handleGetQueue}
        loading={loading}
      />
    </div>
  );
}
