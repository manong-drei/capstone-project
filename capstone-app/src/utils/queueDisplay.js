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
