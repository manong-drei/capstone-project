import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboardIdentity } from "../hooks/useDashboardIdentity";
import { useQueue } from "../hooks/useQueue";
import { ROUTES } from "../constants/routes";
import {
  QUEUE_STATUS,
  DENTAL_SERVICES,
} from "../constants/services";

import DashboardProfileMenu from "../components/common/DashboardProfileMenu";
import Footer from "../components/landing/Footer";
import Icon from "../components/common/AppIcons";
import GetQueueModal from "../components/dashboards/patient/GetQueueModal";
import QueueStatus from "../components/dashboards/patient/QueueStatus";
import { getQueueDisplayName } from "../utils/queueDisplay";

import * as appointmentService from "../services/appointmentService";
import * as queueService from "../services/queueService";
import api from "../services/api";

const ORANGE = "#f97316";
const NAVY = "#2d3a8c";

const formatServices = (appt) => {
  try {
    const raw = appt?.queue_services;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.join(", ");
  } catch {
    /* fall through */
  }
  return appt?.reason || "—";
};

const DENTAL_SUBSERVICE_LABEL_BY_ID = DENTAL_SERVICES.reduce(
  (acc, service) => {
    acc[service.id] = service.label;
    return acc;
  },
  {},
);

const formatQueuedServices = (queue) => {
  if (!Array.isArray(queue?.services) || queue.services.length === 0) return "";

  const labels = queue.services
    .map((service) => {
      if (service && typeof service === "object") {
        return service.label || service.name || service.id || "";
      }
      const key = String(service ?? "").trim();
      return DENTAL_SUBSERVICE_LABEL_BY_ID[key] || key;
    })
    .filter(Boolean);

  return labels.join(", ");
};

const mobileMenuBtn = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "none",
  border: "none",
  color: "white",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  padding: "10px 12px",
  borderRadius: "8px",
  textAlign: "left",
  width: "100%",
};

const PATIENT_RESPONSIVE_CSS = `
    .pd-nav { padding: 10px 24px; }
    .pd-nav-items { display: flex; align-items: center; gap: 4px; }
    .pd-nav-btn-label { display: inline; }
    .pd-hamburger { display: none; }
    .pd-mobile-menu { display: none; }
    .pd-actions { padding: 28px 24px; }
    .pd-content-pad { padding: 0 24px 32px; }
    .pd-tab-pad { padding: 28px 24px; }
    .pd-hero-pad { padding: 48px 24px; }
    .pd-doctor-hero-pad { padding: 40px 24px; }
    @media (max-width: 768px) {
      .pd-nav { padding: 10px 16px; }
      .pd-nav-items { gap: 2px; }
      .pd-nav-btn-label { display: none; }
      .pd-brand-text { font-size: 14px !important; letter-spacing: 0.06em !important; }
    }
    @media (max-width: 640px) {
      .pd-nav { padding: 10px 14px; }
      .pd-hamburger { display: flex !important; }
      .pd-nav-items-desktop { display: none !important; }
      .pd-mobile-menu.open { display: block; }
      .pd-actions { padding: 20px 14px; gap: 12px !important; }
      .pd-content-pad { padding: 0 14px 24px; }
      .pd-tab-pad { padding: 20px 14px; }
      .pd-hero-pad { padding: 36px 16px !important; }
      .pd-doctor-hero-pad { padding: 32px 16px !important; }
      .pd-brand-logo { width: 32px !important; height: 32px !important; }
      .pd-action-btn { padding: 16px 18px !important; font-size: 13px !important; flex: 1 1 100% !important; }
      .pd-info-card { padding: 16px !important; min-height: 110px !important; }
      .pd-info-card-big { font-size: 18px !important; }
      .pd-info-card-num { font-size: 24px !important; }
    }
  `;

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();
  const {
    queue,
    loading,
    error,
    fetchMyQueue,
    submitQueue,
  } = useQueue();

  const [activeTab, setActiveTab] = useState("home");
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    now_serving: null,
    now_serving_name: null,
    next_queuing: null,
    next_queuing_name: null,
  });
  const [doctorAvailability, setDoctorAvailability] = useState(null);

  const fetchQueueStatus = async () => {
    try {
      const data = await queueService.getQueueStatus();
      setQueueStatus(
        data ?? {
          now_serving: null,
          now_serving_name: null,
          next_queuing: null,
          next_queuing_name: null,
        },
      );
    } catch {
      /* silently ignore — display stays as — */
    }
  };

  const fetchDoctorAvailability = async () => {
    try {
      const data = await api.get("/doctor");
      const doctors = data?.data ?? [];
      if (!doctors.length) {
        setDoctorAvailability(null);
        return;
      }

      const hasAvailableDoctor = doctors.some(
        (doctor) => Number(doctor?.is_available ?? 1) !== 0,
      );
      setDoctorAvailability(hasAvailableDoctor ? 1 : 0);
    } catch {
      /* silently ignore */
    }
  };

  useEffect(() => {
    fetchMyQueue();
    fetchQueueStatus();
    fetchDoctorAvailability();

    const interval = setInterval(() => {
      fetchMyQueue();
      fetchQueueStatus();
      fetchDoctorAvailability();
    }, 15_000);

    return () => clearInterval(interval);
  }, [fetchMyQueue]);

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
    } catch (err) {
      alert(err.message || "Failed to get queue number.");
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
  const queueDisplayName = hasActiveQueue ? getQueueDisplayName(queue) : "";
  const queuedServices = hasActiveQueue ? formatQueuedServices(queue) : "";
  const myQueueSubtitle = hasActiveQueue
    ? [queueDisplayName, queuedServices ? `Dental Sub-services: ${queuedServices}` : null]
        .filter(Boolean)
        .join(" | ")
    : "-";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{PATIENT_RESPONSIVE_CSS}</style>
      {/* ── Top Navbar ── */}
      <nav
        className="pd-nav"
        style={{
          background: "linear-gradient(90deg, #1a3a8f 0%, #1e4db7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/assets/Logo.jpg"
            alt="E-KALUSUGAN"
            className="pd-brand-logo"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <span
            className="pd-brand-text"
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: "16px",
              letterSpacing: "0.1em",
            }}
          >
            E-KALUSUGAN
          </span>
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="pd-hamburger"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "8px",
            width: "38px",
            height: "38px",
            cursor: "pointer",
            color: "white",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        {/* Right Nav Items (desktop) */}
        <div
          className="pd-nav-items pd-nav-items-desktop"
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          {/* Help */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "7px 12px",
              borderRadius: "8px",
            }}
          >
            <Icon name="info" size={16} color="white" />
            <span className="pd-nav-btn-label">Help</span>
          </button>

          {/* Notification */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "7px 12px",
              borderRadius: "8px",
            }}
          >
            <Icon name="bell" size={16} color="white" />
            <span className="pd-nav-btn-label">Notification</span>
          </button>

          {/* Settings */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "7px 12px",
              borderRadius: "8px",
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="pd-nav-btn-label">Settings</span>
          </button>

          <div style={{ marginLeft: "8px" }}>
            <DashboardProfileMenu
              identity={identity}
              onLogout={handleLogout}
              accentColor={ORANGE}
              chipBg="rgba(255,255,255,0.15)"
              chipBorder="rgba(255,255,255,0.35)"
              chipTextColor="#ffffff"
              subtitleColor="rgba(255,255,255,0.72)"
            />
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="pd-mobile-menu open"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#1e4db7",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              padding: "8px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              zIndex: 50,
              boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
            }}
          >
            <DashboardProfileMenu
              mobile
              identity={identity}
              onLogout={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              accentColor={ORANGE}
              panelBg="rgba(255,255,255,0.1)"
              panelTextColor="#ffffff"
              panelMutedColor="rgba(255,255,255,0.72)"
            />
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={mobileMenuBtn}
            >
              <Icon name="info" size={16} color="white" />
              Help
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={mobileMenuBtn}
            >
              <Icon name="bell" size={16} color="white" />
              Notification
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={mobileMenuBtn}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6a7.5 7.5 0 107.5 7.5"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
              Settings
            </button>
          </div>
        )}
      </nav>

      {/* ── Home Tab ── */}
      {activeTab === "home" && (
        <>
          {/* Hero Section */}
          <section
            style={{
              position: "relative",
              minHeight: "380px",
              backgroundImage: "url('/assets/BGHero.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.42)",
              }}
            />
            <div
              className="pd-hero-pad"
              style={{ position: "relative", zIndex: 1 }}
            >
              <h1
                style={{
                  margin: "0 0 2px",
                  fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                Your Health, Schedule.
              </h1>
              <h1
                style={{
                  margin: "0 0 20px",
                  fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  color: "#1e4db7",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                No More Long Waits.
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(0.875rem, 2vw, 1rem)",
                  color: "#374151",
                  maxWidth: "540px",
                  lineHeight: 1.6,
                }}
              >
                Get your queue number online, check doctor availability, and
                track your wait time—all from your phone
              </p>
            </div>
          </section>
          {/* ── Now Queuing / Next Queuing ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pd-content-pad">
            {/* Now Queuing */}
            <div
              style={{
                background: "#f97316",
                marginTop: "20px",
                borderRadius: "16px",
                padding: "24px 28px",
                boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.06em",
                }}
              >
                Now Queuing
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {queueStatus.now_serving ?? "—"}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {queueStatus.now_serving_name ?? "—"}
              </p>
            </div>

            {/* Next Queuing */}
            <div
              style={{
                background: NAVY,
                borderRadius: "16px",
                padding: "24px 28px",
                boxShadow: "0 4px 16px rgba(45,58,140,0.25)",
                marginTop: "20px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.06em",
                }}
              >
                Next Queuing
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {queueStatus.next_queuing ?? "—"}
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {queueStatus.next_queuing_name ?? "—"}
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          <div
            className="pd-actions"
            style={{
              background: "#f3f4f6",
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setShowQueueModal(true)}
              disabled={hasActiveQueue}
              className="pd-action-btn"
              style={{
                flex: "1 1 220px",
                maxWidth: "340px",
                padding: "22px 32px",
                borderRadius: "16px",
                border: "none",
                background: ORANGE,
                color: "white",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: hasActiveQueue ? "not-allowed" : "pointer",
                opacity: hasActiveQueue ? 0.65 : 1,
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              GET QUEUE NUMBER
            </button>

            <button
              onClick={() => setActiveTab("appointments")}
              className="pd-action-btn"
              style={{
                flex: "1 1 220px",
                maxWidth: "340px",
                padding: "22px 32px",
                borderRadius: "16px",
                border: "none",
                background: "#e5e7eb",
                color: "#374151",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              APPOINTMENT HISTORY
            </button>
          </div>

          {/* Active Queue Alert */}
          {hasActiveQueue && (
            <div className="pd-content-pad" style={{ paddingBottom: 8 }}>
              <QueueStatus queue={queue} onCancel={handleCancelQueue} />
            </div>
          )}

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pd-content-pad">
            {/* Card 1 — My Queue Number */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                borderLeft: "4px solid #f97316",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                position: "relative",
                minHeight: "130px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#9ca3af",
                  letterSpacing: "0.12em",
                }}
              >
                MY QUEUE NUMBER
              </p>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#f97316",
                }}
              >
                {hasActiveQueue ? queue.queue_number : "—"}
              </p>
              <p
                style={{ margin: 0, fontSize: "12px", color: "#374151", fontWeight: 600 }}
              >
                {myQueueSubtitle}
              </p>
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#fff7ed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="user" size={18} color="#f97316" />
              </div>
            </div>

            {/* Card 2 — Est. Wait Time */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                borderLeft: "4px solid #1e4db7",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                position: "relative",
                minHeight: "130px",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#9ca3af",
                  letterSpacing: "0.12em",
                }}
              >
                EST. WAIT TIME
              </p>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#1e4db7",
                }}
              >
                ~15 min
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                Based on current queue
              </p>
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="clock" size={18} color="#1e4db7" />
              </div>
            </div>

            {/* Card 3 — Doctor Availability */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                borderLeft: doctorAvailability === null
                  ? "4px solid #d1d5db"
                  : doctorAvailability !== 0
                    ? "4px solid #059669"
                    : "4px solid #dc2626",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "130px",
                gap: "8px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Doctor Availability
              </p>
              {doctorAvailability === null ? (
                <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>—</p>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 16px",
                    borderRadius: "99px",
                    fontSize: "14px",
                    fontWeight: 700,
                    background: doctorAvailability !== 0 ? "#dcfce7" : "#fee2e2",
                    color: doctorAvailability !== 0 ? "#059669" : "#dc2626",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: doctorAvailability !== 0 ? "#059669" : "#dc2626",
                      flexShrink: 0,
                    }}
                  />
                  {doctorAvailability !== 0 ? "Available Today" : "Unavailable Today"}
                </span>
              )}
            </div>

            {/* Card 4 — Appointment History */}
            <div
              onClick={() => setActiveTab("appointments")}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                borderLeft: "4px solid #1e4db7",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "130px",
                cursor: "pointer",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                Appointment
                <br />
                History
              </p>
            </div>

            {/* Card 5 — Location */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                borderLeft: "4px solid #1e1b4b",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "130px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                Location
              </p>
            </div>

            {/* Card 6 — CHO Service */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                borderLeft: "4px solid #f97316",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "130px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                CHO SERVICE
              </p>
            </div>
          </div>
          <Footer />
        </>
      )}

      {/* ── Queue Tab ── */}
      {activeTab === "queue" && (
        <div
          className="pd-tab-pad"
          style={{
            flex: 1,
            maxWidth: "860px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setActiveTab("home")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                ← Back
              </button>
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
            </div>
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
        </div>
      )}

      {/* ── Appointments Tab ── */}
      {activeTab === "appointments" && (
        <div
          className="pd-tab-pad"
          style={{
            flex: 1,
            maxWidth: "860px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setActiveTab("home")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                ← Back
              </button>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Appointment History
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
                {appointments.map((appt) => {
                  const doctorName =
                    `Dr. ${appt.doctor_first_name ?? ""} ${appt.doctor_last_name ?? ""}`.trim();
                  const services = formatServices(appt);
                  return (
                    <div
                      key={appt.appointment_id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
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
                          {doctorName || "Doctor"}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          {new Date(appt.appointment_date).toLocaleDateString(
                            "en-PH",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                          {appt.appointment_time
                            ? ` at ${appt.appointment_time}`
                            : ""}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "12px",
                            color: "#374151",
                          }}
                        >
                          {services}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          background:
                            appt.status === "confirmed"
                              ? "#d1fae5"
                              : appt.status === "completed"
                                ? "#dbeafe"
                                : appt.status === "cancelled"
                                  ? "#fee2e2"
                                  : "#f3f4f6",
                          color:
                            appt.status === "confirmed"
                              ? "#059669"
                              : appt.status === "completed"
                                ? "#1d4ed8"
                                : appt.status === "cancelled"
                                  ? "#b91c1c"
                                  : "#6b7280",
                        }}
                      >
                        {appt.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
