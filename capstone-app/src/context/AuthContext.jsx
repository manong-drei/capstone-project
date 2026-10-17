import { createContext, useEffect, useState } from "react";
import { ROLES } from "../constants/roles";
import { ROUTES } from "../constants/routes";
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
    // Shared legacy credentials cannot identify which account belongs to this tab.
    localStorage.removeItem("ek_user");
    localStorage.removeItem("ek_token");
  } catch { /* Unavailable legacy storage must not block this tab's session. */ }
  try {
    sessionStorage.removeItem("user");
    const token = sessionStorage.getItem("ek_token");
    let user;
    try { user = JSON.parse(sessionStorage.getItem("ek_user")); }
    catch { /* A damaged user cache must not discard a valid token. */ }
    if (token) return createSession(token, user);
  } catch { /* Invalid tokens or unavailable storage require a new login. */ }
  return { user: null, token: null };
}

export function AuthProvider({ children }) {
  // Both values are ready before route guards first render, including on refresh.
  const [{ user, token }, setSession] = useState(restoreSession);

  useEffect(() => {
    if (!token) return;
    const hadUserCache = !!sessionStorage.getItem("ek_user");
    const checkSession = () => {
      if (sessionStorage.getItem("ek_token") === token &&
          (!hadUserCache || sessionStorage.getItem("ek_user"))) return;
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("ek_user");
      sessionStorage.removeItem("ek_token");
      setSession({ user: null, token: null });
      window.location.replace(ROUTES.HOME);
    };
    // Same-page storage edits do not reliably emit a storage event.
    const interval = window.setInterval(checkSession, 1000);
    window.addEventListener("focus", checkSession);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkSession);
    };
  }, [token, user]);

  const login = (userData, authToken) => {
    const session = createSession(authToken, userData);
    sessionStorage.setItem("ek_user", JSON.stringify(session.user));
    sessionStorage.setItem("ek_token", authToken);
    setSession(session);
  };

  const updateUser = (patch) => {
    setSession((prev) => {
      const next = { ...prev.user, ...patch };
      sessionStorage.setItem("ek_user", JSON.stringify(next));
      return { ...prev, user: next };
    });
  };

  const logout = () => {
    setSession({ user: null, token: null });
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("ek_user");
    sessionStorage.removeItem("ek_token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, updateUser, logout, loading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}
