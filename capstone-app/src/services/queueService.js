import api from "./api";

export const getMyQueue = () => api.get("/queue/me");
export const getQueueStatus = (category) =>
  api.get(`/queue/status${category ? `?category=${category}` : ""}`);
export const getAllQueues = (category) =>
  api.get(`/queue${category ? `?category=${category}` : ""}`);
export const createQueue = (payload) => api.post("/queue", payload);
export const callNextQueue = (category = "dental") =>
  api.post("/queue/call-next", { category });
export const updateQueueStatus = (id, status, reason) =>
  api.patch(`/queue/${id}/status`, { status, reason });
export const cancelQueue = (id, reason) => api.patch(`/queue/${id}/cancel`, { reason });
export const deleteQueue = (id) => api.delete(`/queue/${id}`);
