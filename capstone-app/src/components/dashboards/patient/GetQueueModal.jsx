import { useState } from "react";
import { DENTAL_SERVICES as SERVICES } from "@/constants/medicalServices";
import Icon from "@/components/common/AppIcons";
import { getSessionItem } from "@analytics/session-storage-utils";

const MAX_SELECTED_SERVICES = 2;

/**
 * GetQueueModal
 * Allows a patient to select services and choose Regular or Priority queue.
 *
 * Props:
 *   isOpen   — controls visibility
 *   onClose  — close handler
 *   onSubmit — called with { services: [...], type: 'regular'|'priority' }
 *   loading  — disables submit while request is in-flight
 *  priorityEligible — if true, allows the user to select "priority" queue
 */
export default function GetQueueModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  priorityEligible = false,
}) {
  const [selected, setSelected] = useState([]);

  if (!isOpen) return null;

  const toggleService = (id) => {
    const alreadySelected = selected.includes(id);
    if (alreadySelected) {
      setSelected((prev) => prev.filter((s) => s !== id));
      return;
    }

    if (selected.length >= MAX_SELECTED_SERVICES) return;
    setSelected((prev) => [...prev, id]);
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    const value = getSessionItem("user");
    onSubmit({
      services: selected,
      type: priorityEligible ? "priority" : "regular",
      patient_id: value,
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const accentColor = "#2d3a8c";
  const limitReached = selected.length >= MAX_SELECTED_SERVICES;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "28px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
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
              Get Queue Number
            </h2>
            <p
              style={{ margin: "2px 0 0", fontSize: "13px", color: "#6b7280" }}
            >
              Select services you need today
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={16} color="#6b7280" />
          </button>
        </div>

        {/* Services */}
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Services{" "}
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>
              (select all that apply)
            </span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {SERVICES.map(({ id, label }) => {
              const active = selected.includes(id);
              const blocked = limitReached && !active;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (blocked) return;
                    toggleService(id);
                  }}
                  disabled={blocked}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: `1.5px solid ${active ? accentColor : blocked ? "#d1d5db" : "#e5e7eb"}`,
                    background: active ? `${accentColor}0d` : "#fafafa",
                    cursor: blocked ? "not-allowed" : "pointer",
                    opacity: blocked ? 0.62 : 1,
                    textAlign: "left",
                    transition: "all 0.12s",
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "5px",
                      border: `2px solid ${active ? accentColor : "#d1d5db"}`,
                      background: active ? accentColor : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.12s",
                    }}
                  >
                    {active && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: active ? accentColor : "#374151",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "12px",
              color: limitReached ? "#b45309" : "#9ca3af",
              fontWeight: limitReached ? 600 : 400,
            }}
          >
            {limitReached
              ? "You can select up to 2 services only."
              : "Select up to 2 services."}
          </p>
        </div>

        {/* Submit */}
        {(() => {
          const isDisabled = selected.length === 0 || loading;
          return (
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                border: "none",
                background: isDisabled ? "#e5e7eb" : accentColor,
                color: isDisabled ? "#9ca3af" : "#ffffff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: isDisabled ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Getting your number..." : "Get Queue Number"}
            </button>
          );
        })()}
      </div>
    </div>
  );
}
