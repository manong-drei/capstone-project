import api from "./api";

export const login = (credentials) => api.post("/auth/login", credentials);
//export const register = (userData)    => api.post('/auth/register', userData)
export const logout = () => api.post("/auth/logout");
export const getProfile = () => api.get("/auth/profile");
export const changePassword = (passwords) =>
  api.patch("/auth/change-password", passwords);
