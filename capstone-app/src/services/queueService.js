import api from "./api";

export const getMyQueue = () => api.get("/queue/me");
export const getAllQueues = () => api.get("/queue");
export const createQueue = (payload) => api.post("/queue", payload);
export const callNextQueue = () => api.post("/queue/call-next");
export const updateQueueStatus = (id, status) =>
  api.patch(`/queue/${id}/status`, { status });
export const cancelQueue = (id) => api.patch(`/queue/${id}/cancel`);
export const deleteQueue = (id) => api.delete(`/queue/${id}`);
