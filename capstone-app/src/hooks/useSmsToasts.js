import { useCallback, useRef, useState } from "react";

function smsFeedback({ state, provider_status: providerStatus }) {
  if (state === "failed" || (state === "submitted" && ["failed", "refunded"].includes(providerStatus))) {
    return { status: "failed", tone: "error", text: "could not be sent." };
  }
  if (state === "unknown") return { status: "unknown", tone: "warning", text: "sending status is unknown. Verify the SMS history before retrying." };
  if (state === "cancelled") return { status: "cancelled", tone: "warning", text: "was cancelled before sending." };
  if (state === "submitted") {
    return providerStatus === "sent"
      ? { status: "sent", tone: "success", text: "sent successfully." }
      : { status: "pending", tone: "info", text: "accepted by the SMS provider. Delivery is pending." };
  }
  if (["queued", "submitting"].includes(state)) return { status: "queued", tone: "info", text: "queued for sending." };
  return null;
}

export default function useSmsToasts() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const previousStatuses = useRef(null);

  const showToast = useCallback((message, tone = "info") => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, message, tone }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showSmsToast = useCallback((job) => {
    const feedback = smsFeedback(job);
    if (!job.id || !feedback) return;
    previousStatuses.current ??= new Map();
    const id = String(job.id);
    if (previousStatuses.current.get(id) === feedback.status) return;
    previousStatuses.current.set(id, feedback.status);
    showToast(`${job.label} ${feedback.text}`, feedback.tone);
  }, [showToast]);

  const trackSmsStatuses = useCallback((jobs) => {
    // Seed the first snapshot silently so opening a dashboard does not replay old SMS results.
    const initialSnapshot = previousStatuses.current === null;
    previousStatuses.current ??= new Map();
    for (const job of jobs) {
      if (initialSnapshot) {
        const feedback = smsFeedback(job);
        if (job.id && feedback) previousStatuses.current.set(String(job.id), feedback.status);
      } else {
        showSmsToast(job);
      }
    }
  }, [showSmsToast]);

  return { toasts, dismissToast, showToast, showSmsToast, trackSmsStatuses };
}
