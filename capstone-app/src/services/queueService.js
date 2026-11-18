import api from "./api";

export const getMyQueue = (config) => api.get("/queue/me", config);
export const getCancellations = (config) => api.get("/queue/cancellations", config);
export const acknowledgeCancellation = (id) => api.patch(`/queue/${id}/acknowledge-cancellation`);
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
export const holdRemainingQueues = () => api.post('/queue/hold-remaining');
export const holdQueue = (id) => api.post(`/queue/${id}/hold`);
export const reactivateQueue = (id) => api.post(`/queue/${id}/reactivate`);
