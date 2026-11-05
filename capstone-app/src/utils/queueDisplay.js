import { DENTAL_SERVICES } from "@/constants/medicalServices";

const pickFirst = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

export const getQueueDisplayName = (queue) =>
  pickFirst(
    queue?.patient_name,
    queue?.full_name,
    queue?.walk_in_name,
    queue?.name,
  ) || "—";

export const formatQueueTime = value => new Date(value).toLocaleTimeString('en-PH', {
  timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true,
});

export function hasActivePatientPriority(profile) {
  return Boolean(profile?.priority_category) &&
    (!profile.priority_expires_at || new Date(profile.priority_expires_at) > new Date());
}

export function formatPatientDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T00:00:00+08:00` : value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila", year: "numeric", month: "long", day: "numeric", ...options,
  });
}

export function getServiceLabels(services) {
  if (typeof services === "string") {
    try { services = JSON.parse(services); } catch { return services.trim() ? [services] : []; }
  }
  if (!Array.isArray(services)) return [];
  return services.map(service => {
    const value = service && typeof service === "object" ? service.label || service.name || service.id : service;
    return DENTAL_SERVICES.find(({ id }) => id === String(value ?? "").trim())?.label || String(value ?? "");
  }).filter(Boolean);
}

export function getTicketNotice(queue) {
  if (queue.status === "missed") return `You missed your call. Report to staff before ${queue.grace_expires_at ? formatQueueTime(queue.grace_expires_at) : "the return deadline"} to keep this ticket. The queue is continuing while you return.`;
  if (queue.status === "called") return "Please report to staff now so they can confirm you are here.";
  if (queue.status === "serving") return "You are receiving care. Staff will update your ticket when your visit is complete.";
  if (queue.status === "no_show") return `This ticket ended as a no-show. ${queue.status_reason || ""} You may request a new ticket subject to today's availability and daily limit.`;
  if (queue.status === "waiting" && queue.returned_at) return "Your return is confirmed. You have rejoined behind patients already waiting in your priority group; please stay nearby.";
  if (queue.status === "waiting") return queue.sms_alert_state === "suppressed" ? "Please stay nearby; no queue SMS will be sent." : "You will receive one SMS when your turn approaches. Follow the queue display; delivery may be delayed.";
  return queue.status_reason || "";
}
