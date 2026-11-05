import api from "./api";

export const getMyProfile = (config) => api.get("/patients/me", config);
export const updateMyProfile = (fields) => api.put("/patients/me", fields);
