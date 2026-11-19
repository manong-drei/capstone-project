import { useEffect, useRef, useState } from "react";
import { ROLES } from "../constants/roles";
import { ROUTES } from "../constants/routes";
import { SESSION_INTERRUPTED } from "../services/api";
import { AuthContext } from "../hooks/useAuth";

function createSession(token, cachedUser) {
  const parts = token.split(".");
  if (parts.length !== 3)
    throw new Error("Invalid session. Please log in again.");
  // Decoding restores the UI; the backend still verifies signatures and account access.
  const claims = JSON.parse(
    atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
  );
  if (
    !claims.user_id ||
    !Object.values(ROLES).includes(claims.role) ||
    !Number.isFinite(claims.exp) ||
    claims.exp * 1000 <= Date.now()
  ) {
    throw new Error(
      "Your session has expired or is invalid. Please log in again.",
    );
  }
  const user =
    (cachedUser?.user_id ?? cachedUser?.id) === claims.user_id
      ? cachedUser
      : {};
  return {
    token,
    expiresAt: claims.exp * 1000,
    purpose: claims.purpose,
    credentialVersion: claims.credential_version,
    user: {
      ...user,
      user_id: claims.user_id,
      phone: claims.phone ?? user.phone,
      role: claims.role,
      must_change_password:
        claims.purpose === "password_setup" ||
        (!claims.purpose && !!user.must_change_password),
    },
  };
}

function restoreSession() {
  try {
    // Shared legacy credentials cannot identify which account belongs to this tab.
    localStorage.removeItem("ek_user");
    localStorage.removeItem("ek_token");
    localStorage.removeItem("ek_remarks_drafts");
  } catch {
    /* Unavailable legacy storage must not block this tab's session. */
  }
  try {
    sessionStorage.removeItem("user");
    const token = sessionStorage.getItem("ek_token");
    let user;
    try {
      user = JSON.parse(sessionStorage.getItem("ek_user"));
    } catch {
      /* A damaged user cache must not discard a valid token. */
    }
    if (token) {
      try { return createSession(token, user); }
      catch {
        sessionStorage.removeItem("ek_token");
        sessionStorage.removeItem("ek_user");
        sessionStorage.removeItem("ek_remarks_drafts");
      }
    }
  } catch {
    /* Invalid tokens or unavailable storage require a new login. */
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }) {
  // Both values are ready before route guards first render, including on refresh.
  const [session, setSession] = useState(restoreSession);
  const { user, token, expired, expiresAt, purpose } = session;
  const currentToken = useRef(token);

  useEffect(() => {
    if (!token) return;
    const hadUserCache = !!sessionStorage.getItem("ek_user");
    const interrupt = (code) => {
      const storedToken = sessionStorage.getItem("ek_token");
      if (storedToken !== token && !(expired && !storedToken && code === "SESSION_REVOKED")) return;
      currentToken.current = null;
      sessionStorage.removeItem("ek_user");
      sessionStorage.removeItem("ek_token");
      if (code === "SESSION_EXPIRED" && (purpose === "session" || !purpose) && !user.must_change_password) {
        setSession((current) => current.token === token ? { ...current, expired: true } : current);
      } else {
        sessionStorage.removeItem("ek_remarks_drafts");
        setSession({ user: null, token: null });
      }
    };
    const handleInterruption = ({ detail }) => {
      if (detail.token === token) interrupt(detail.code);
    };
    const checkSession = () => {
      // Storage can change before React renders the new auth state.
      if (expired || currentToken.current !== token) return;
      if (
        sessionStorage.getItem("ek_token") === token &&
        (!hadUserCache || sessionStorage.getItem("ek_user"))
      ) {
        if (Date.now() >= expiresAt) interrupt("SESSION_EXPIRED");
        return;
      }
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("ek_user");
      sessionStorage.removeItem("ek_token");
      sessionStorage.removeItem("ek_remarks_drafts");
      currentToken.current = null;
      setSession({ user: null, token: null });
      window.location.replace(ROUTES.HOME);
    };
    // Same-page storage edits do not reliably emit a storage event.
    const interval = window.setInterval(checkSession, 1000);
    window.addEventListener("focus", checkSession);
    window.addEventListener(SESSION_INTERRUPTED, handleInterruption);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkSession);
      window.removeEventListener(SESSION_INTERRUPTED, handleInterruption);
    };
  }, [token, user, expired, expiresAt, purpose]);

  const login = (userData, authToken) => {
    const next = createSession(authToken, userData);
    currentToken.current = authToken;
    sessionStorage.setItem("ek_user", JSON.stringify(next.user));
    sessionStorage.setItem("ek_token", authToken);
    setSession(next);
  };

  const updateUser = (patch) => {
    setSession((prev) => {
      const next = { ...prev.user, ...patch };
      sessionStorage.setItem("ek_user", JSON.stringify(next));
      return { ...prev, user: next };
    });
  };

  const logout = () => {
    currentToken.current = null;
    setSession({ user: null, token: null });
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("ek_user");
    sessionStorage.removeItem("ek_token");
    sessionStorage.removeItem("ek_remarks_drafts");
  };

  const resumeSession = (userData, authToken) => {
    const next = createSession(authToken, userData);
    if (next.user.user_id !== user.user_id || next.user.role !== user.role) {
      logout();
      return;
    }
    if (next.user.must_change_password) {
      logout();
      login(userData, authToken);
      return;
    }
    if ((next.purpose && next.purpose !== "session") ||
        next.credentialVersion !== session.credentialVersion) {
      logout();
      return;
    }
    login(userData, authToken);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, expired, login, resumeSession, updateUser, logout, loading: false }}
    >
      {children}
    </AuthContext.Provider>
  );
}
