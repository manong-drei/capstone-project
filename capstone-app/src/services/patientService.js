import api from "./api";

export const getMyProfile = () => api.get("/patients/me");
