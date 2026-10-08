import { createContext, useState } from "react";
import { ROLES } from "../constants/roles";
export const AuthContext = createContext(null);

function createSession(token, cachedUser) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid session. Please log in again.");
  // Decoding restores the UI; the backend still verifies signatures and account access.
  const claims = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  if (!claims.user_id || !Object.values(ROLES).includes(claims.role) ||
      !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
    throw new Error("Your session has expired or is invalid. Please log in again.");
  }
  const user = (cachedUser?.user_id ?? cachedUser?.id) === claims.user_id ? cachedUser : {};
  return {
    token,
    user: {
      ...user,
      user_id: claims.user_id,
      phone: claims.phone ?? user.phone,
      role: claims.role,
      must_change_password: claims.purpose === "password_setup" ||
        (!claims.purpose && !!user.must_change_password),
    },
  };
}

function restoreSession() {
  try {
    const token = localStorage.getItem("ek_token");
    let user;
    try { user = JSON.parse(localStorage.getItem("ek_user")); }
    catch { /* A damaged user cache must not discard a valid token. */ }
    if (token) return createSession(token, user);
  } catch { /* Invalid tokens or unavailable storage require a new login. */ }
  return { user: null, token: null };
}

export function AuthProvider({ children }) {
  // Both values are ready before route guards first render, including on refresh.
  const [{ user, token }, setSession] = useState(restoreSession);

  const login = (userData, authToken) => {
    const session = createSession(authToken, userData);
    localStorage.setItem("ek_user", JSON.stringify(session.user));
    localStorage.setItem("ek_token", authToken);
    setSession(session);
  };

  const updateUser = (patch) => {
    setSession((prev) => {
      const next = { ...prev.user, ...patch };
      localStorage.setItem("ek_user", JSON.stringify(next));
      return { ...prev, user: next };
    });
  };

  const logout = () => {
    setSession({ user: null, token: null });
    localStorage.removeItem("ek_user");
    localStorage.removeItem("ek_token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, updateUser, logout, loading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}
