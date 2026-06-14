import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardIdentity } from "@/hooks/useDashboardIdentity";
import { ROUTES } from "@/constants/routes";
import api from "@/services/api";

import StaffNavbar from "@/components/dashboards/staff/StaffNavbar";
import StaffHeroBanner from "@/components/dashboards/staff/StaffHeroBanner";
import QueuePanel from "@/components/dashboards/staff/QueuePanel";
import WalkInForm from "@/components/dashboards/staff/WalkInForm";

const NAVY = "#1e2d6b";
const INDIGO = "#2d3a8c";
const BLUE = "#1e4db7";

const GLOBAL_STYLES = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.5); }
  }
  @keyframes spin-anim {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .ek-spin  { animation: spin-anim 0.75s linear infinite; }
  .ek-pulse { animation: pulse-dot 2s ease-in-out infinite; }

  @media (max-width: 768px) {
    .ek-nav { padding: 0 14px !important; }
    .ek-nav-label { display: none !important; }
    .ek-nav-btn { padding: 5px 9px !important; }
    .ek-brand-text { font-size: 13px !important; letter-spacing: 0.08em !important; }
  }
  @media (max-width: 640px) {
    .ek-grid { grid-template-columns: 1fr !important; }
    .ek-hero { height: 150px !important; }
  }
`;

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { identity } = useDashboardIdentity();

  const [queues, setQueues] = useState([]);
  const [calling, setCalling] = useState(false);
  const [doctorAvailable, setDoctorAvailable] = useState(null);
  const [activeTab, setActiveTab] = useState("dental");
  const intervalRef = useRef(null);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await api.get("/queue");
      setQueues(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      // Silently fail on polling — don't disrupt UX
    }
  }, []);

  const fetchDoctorAvailability = useCallback(async () => {
    try {
      const data = await api.get("/doctor");
      setDoctorAvailable(data?.data?.[0]?.is_available ?? 1);
    } catch {
      /* silently ignore */
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchDoctorAvailability();
    intervalRef.current = setInterval(() => {
      fetchQueue();
      fetchDoctorAvailability();
    }, 15_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchQueue, fetchDoctorAvailability]);

  const handleCallNext = async (category) => {
    setCalling(true);
    try {
      await api.post("/queue/call-next", { category });
      await fetchQueue();
    } catch (err) {
      alert(err.message || "Failed to call next patient.");
    } finally {
      setCalling(false);
    }
  };

  const handleNoShow = async (id) => {
    try {
      await api.patch(`/queue/${id}/status`, { status: "no_show" });
      await api.post("/queue/call-next", { category: activeTab });
      await fetchQueue();
    } catch (err) {
      alert(err.message || "Failed to mark no-show.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const dentalQueues  = queues.filter((q) => (q.category ?? "dental") === "dental");
  const generalQueues = queues.filter((q) => q.category === "general");
  const activeList    = activeTab === "general" ? generalQueues : dentalQueues;
  const currentServing = activeList.find((q) => q.status === "serving") ?? null;
  const nextQueue      = activeList.filter((q) => q.status === "waiting");

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#eef0f7",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        }}
      >
        <StaffNavbar identity={identity} onLogout={handleLogout} />
        <StaffHeroBanner />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            padding: "clamp(16px, 3vw, 28px)",
            maxWidth: "960px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {/* Category tabs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", padding: "4px", background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {[{ id: "dental", label: "Dental Check-up" }, { id: "general", label: "General Consultation" }].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ padding: "8px 18px", borderRadius: "9px", border: "none", background: active ? `linear-gradient(90deg, ${NAVY} 0%, ${INDIGO} 100%)` : "transparent", color: active ? "#ffffff" : "#4b5563", fontWeight: active ? 700 : 500, fontSize: "13px", cursor: "pointer", transition: "background 0.15s, color 0.15s" }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "general" && (
              <button
                onClick={() => window.open(ROUTES.GENERAL_QUEUE_MONITOR, "_blank")}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 16px", borderRadius: "10px", border: "1.5px solid #dde1ec", background: "#ffffff", color: NAVY, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 0.15s, border-color 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = BLUE; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#dde1ec"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Open Monitor
              </button>
            )}
          </div>

          {/* Two-column layout: queue panel + walk-in form */}
          <div
            className="ek-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(14px, 2vw, 24px)", alignItems: "start" }}
          >
            <QueuePanel
              currentServing={currentServing}
              nextQueue={nextQueue}
              onCallNext={() => handleCallNext(activeTab)}
              onNoShow={() => currentServing && handleNoShow(currentServing.id)}
              loading={calling}
            />
            <WalkInForm key={activeTab} onSuccess={fetchQueue} category={activeTab} />
          </div>

          {/* Doctor status indicator (dental only) */}
          {activeTab === "dental" && doctorAvailable !== null && (
            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 20px", background: "#fff", borderRadius: "99px", border: `1.5px solid ${doctorAvailable ? "#bbf7d0" : "#fecaca"}`, width: "fit-content", margin: "16px auto 0" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: doctorAvailable ? "#059669" : "#dc2626", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: doctorAvailable ? "#059669" : "#dc2626" }}>
                Doctor: {doctorAvailable ? "Available Today" : "Unavailable Today"}
              </span>
            </div>
          )}

          {/* Live indicator */}
          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            <span className="ek-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 0 2px rgba(34,197,94,0.25)" }} />
            <span style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "0.04em" }}>
              Queue auto-refreshes every 15 seconds
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
