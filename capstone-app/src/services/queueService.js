import api from "./api";

export const createQueue = (payload) =>
  api.post("/queue", payload).then((res) => res.data);
export const getMyQueue = () =>
  api.get("/queue/me").then((res) => res.data ?? null);
export const getAllQueues = () =>
  api.get("/queue").then((res) => res.data ?? []);
export const updateQueueStatus = (id, status) =>
  api.patch(`/queue/${id}/status`, { status });
export const callNextQueue = () =>
  api.post("/queue/next").then((res) => res.data);
export const cancelQueue = (id) => api.patch(`/queue/${id}/cancel`);
