import { QUEUE_STATUS } from "../../../constants/services";
import Icon from "../../common/AppIcons";
import { getQueueDisplayName } from "../../../utils/queueDisplay";

const STATUS_CONFIG = {
  [QUEUE_STATUS.WAITING]: {
    label: "Waiting",
    color: "#2d3a8c",
    bg: "#eef2ff",
    icon: "clock",
  },
  [QUEUE_STATUS.SERVING]: {
    label: "It's your turn!",
    color: "#059669",
    bg: "#d1fae5",
    icon: "checkCircle",
  },
  [QUEUE_STATUS.DONE]: {
    label: "Completed",
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: "checkCircle",
  },
  [QUEUE_STATUS.CANCELLED]: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "xCircle",
  },
};

/**
 * QueueStatus
 * Displays the patient's active queue ticket.
 *
 * Props:
 *   queue   — queue object { queue_number, status, type, services, created_at }
 *   onCancel — called when patient cancels the queue
 */
export default function QueueStatus({ queue, onCancel }) {
  if (!queue) return null;

  const config =
    STATUS_CONFIG[queue.status] ?? STATUS_CONFIG[QUEUE_STATUS.WAITING];
  const isPriority = queue.type === "priority";
  const patientName = getQueueDisplayName(queue);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Queue Number */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#6b7280" }}>
          Your Queue Number
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: config.bg,
            borderRadius: "14px",
            padding: "12px 28px",
          }}
        >
          <span
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color: config.color,
              lineHeight: 1,
            }}
          >
            {queue.queue_number}
          </span>
          {isPriority && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#f97316",
                background: "#fff7ed",
                borderRadius: "6px",
                padding: "2px 8px",
                border: "1px solid #fed7aa",
              }}
            >
              PRIORITY
            </span>
          )}
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "13px",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          {patientName}
        </p>
      </div>

      {/* Status Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: config.bg,
            borderRadius: "20px",
            padding: "6px 14px",
          }}
        >
          <Icon name={config.icon} size={16} color={config.color} />
          <span
            style={{ fontSize: "13px", fontWeight: 600, color: config.color }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Services */}
      {Array.isArray(queue.services) && queue.services.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "12px",
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            Services
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              justifyContent: "center",
            }}
          >
            {queue.services.map((s, i) => (
              <span
                key={i}
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  padding: "3px 10px",
                }}
              >
                {typeof s === "object" ? s.label : s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cancel button — only when waiting */}
      {queue.status === QUEUE_STATUS.WAITING && onCancel && (
        <button
          onClick={onCancel}
          style={{
            display: "block",
            width: "100%",
            marginTop: "8px",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #fecaca",
            background: "transparent",
            fontSize: "13px",
            fontWeight: 500,
            color: "#dc2626",
            cursor: "pointer",
          }}
        >
          Cancel Queue
        </button>
      )}
    </div>
  );
}
