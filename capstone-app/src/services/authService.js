import api from "./api";

export const login = (credentials) => api.post("/auth/login", credentials);
//export const register = (userData)    => api.post('/auth/register', userData)
export const logout = () => api.post("/auth/logout");
export const getProfile = () => api.get("/auth/profile");
export const changePassword = (passwords) =>
  api.patch("/auth/change-password", passwords);
export const requestPasswordRecovery = phone => api.post('/auth/password-recovery/request', { phone });
export const verifyPasswordRecovery = (recovery_id, otp) => api.post('/auth/password-recovery/verify', { recovery_id, otp });
export const resetRecoveredPassword = (recovery_id, reset_token, newPassword) => api.post('/auth/password-recovery/reset', { recovery_id, reset_token, newPassword });
