import api from "./api";

export const getMyQueue = () => api.get("/queue/me");
export const getQueueStatus = (category) =>
  api.get(`/queue/status${category ? `?category=${category}` : ""}`);
export const getAllQueues = (category) =>
  api.get(`/queue${category ? `?category=${category}` : ""}`);
export const createQueue = (payload) => api.post("/queue", payload);
export const callNextQueue = (category = "dental") =>
  api.post("/queue/call-next", { category });
export const updateQueueStatus = (id, status) =>
  api.patch(`/queue/${id}/status`, { status });
export const cancelQueue = (id) => api.patch(`/queue/${id}/cancel`);
export const deleteQueue = (id) => api.delete(`/queue/${id}`);

// Staff helper: register a walk-in into the General Consultation queue.
// Category and service set are fixed — staff only supplies patient details.
export const createGeneralWalkIn = (payload) =>
  api.post("/queue/walkin", {
    ...payload,
    category: "general",
    services: ["GENERAL_CONSULTATION"],
  });
