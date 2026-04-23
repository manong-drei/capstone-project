import { useState } from "react";
import { DENTAL_SERVICES as SERVICES, QUEUE_TYPE } from "../../../constants/services";
import Icon from "../../common/AppIcons";
import { getSessionItem } from "@analytics/session-storage-utils";

/**
 * GetQueueModal
 * Allows a patient to select services and choose Regular or Priority queue.
 *
 * Props:
 *   isOpen   — controls visibility
 *   onClose  — close handler
 *   onSubmit — called with { services: [...], type: 'regular'|'priority' }
 *   loading  — disables submit while request is in-flight
 */
export default function GetQueueModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [selected, setSelected] = useState([]);
  const [queueType, setQueueType] = useState(QUEUE_TYPE.REGULAR);
  const [priorityCategory, setPriorityCategory] = useState(null);

  if (!isOpen) return null;

  const toggleService = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    if (isPriority && !priorityCategory) return;
    const value = getSessionItem("user");
    onSubmit({ services: selected, type: queueType, patient_id: value });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isPriority = queueType === QUEUE_TYPE.PRIORITY;
  const accentColor = isPriority ? "#f97316" : "#2d3a8c";

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

        {/* Queue Type Toggle */}
        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            Queue Type
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {[
              { value: QUEUE_TYPE.REGULAR, label: "Regular", color: "#2d3a8c" },
              {
                value: QUEUE_TYPE.PRIORITY,
                label: "Priority",
                color: "#f97316",
              },
            ].map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => {
                  setQueueType(value);
                  setPriorityCategory(null);
                }}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  border: `2px solid ${queueType === value ? color : "#e5e7eb"}`,
                  background: queueType === value ? `${color}12` : "#f9fafb",
                  cursor: "pointer",
                  fontWeight: queueType === value ? 600 : 400,
                  fontSize: "14px",
                  color: queueType === value ? color : "#6b7280",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Priority eligibility confirmation */}
          {isPriority && (
            <div style={{ marginTop: "10px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#f97316", fontWeight: 600 }}>
                Confirm your eligibility category:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { value: "senior", label: "Senior Citizen (60 years old and above)" },
                  { value: "pwd", label: "PWD (Person with Disability)" },
                  { value: "pregnant", label: "Pregnant" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPriorityCategory(value)}
                    style={{
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: `1.5px solid ${priorityCategory === value ? "#f97316" : "#e5e7eb"}`,
                      background: priorityCategory === value ? "#fff7ed" : "#f9fafb",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: priorityCategory === value ? "#f97316" : "#374151",
                      fontWeight: priorityCategory === value ? 600 : 400,
                      textAlign: "left",
                      transition: "all 0.12s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                By selecting priority, you confirm you meet the stated eligibility.
              </p>
            </div>
          )}
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
              return (
                <button
                  key={id}
                  onClick={() => toggleService(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: `1.5px solid ${active ? accentColor : "#e5e7eb"}`,
                    background: active ? `${accentColor}0d` : "#fafafa",
                    cursor: "pointer",
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
        </div>

        {/* Submit */}
        {(() => {
          const isDisabled = selected.length === 0 || loading || (isPriority && !priorityCategory);
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
              {loading
                ? "Getting your number..."
                : `Get ${isPriority ? "Priority" : "Regular"} Queue Number`}
            </button>
          );
        })()}
      </div>
    </div>
  );
}
