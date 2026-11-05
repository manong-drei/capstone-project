import api from "./api";

export const getMyQueue = (config) => api.get("/queue/me", config);
export const getQueueStatus = (category, config) =>
  api.get(`/queue/status${category ? `?category=${category}` : ""}`, config);
export const getAllQueues = (category, config) =>
  api.get(`/queue${category ? `?category=${category}` : ""}`, config);
export const createQueue = (payload) => api.post("/queue", payload);
export const callNextQueue = (category = "dental") =>
  api.post("/queue/call-next", { category });
export const updateQueueStatus = (id, status, reason) =>
  api.patch(`/queue/${id}/status`, { status, reason });
export const cancelQueue = (id, reason) => api.patch(`/queue/${id}/cancel`, { reason });
export const deleteQueue = (id) => api.delete(`/queue/${id}`);
