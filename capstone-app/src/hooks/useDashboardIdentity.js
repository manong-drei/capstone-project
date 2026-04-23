import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import * as authService from "../services/authService";

const ROLE_LABELS = {
  patient: "Patient",
  doctor: "Doctor",
  staff: "Staff",
  admin: "Administrator",
};

const pickFirst = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const buildDisplayName = (source = {}) => {
  const combined = [pickFirst(source.first_name), pickFirst(source.last_name)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return pickFirst(
    source.display_name,
    source.full_name,
    source.fullName,
    combined,
    source.username,
    ROLE_LABELS[source.role],
    "User",
  );
};

export const normalizeDashboardIdentity = (source = {}) => {
  const role = pickFirst(source.role).toLowerCase() || "user";
  const roleLabel = ROLE_LABELS[role] || "User";
  const displayName = buildDisplayName(source);

  return {
    user_id: source.user_id ?? null,
    role,
    roleLabel,
    displayName,
    subtitle: roleLabel,
  };
};

export function useDashboardIdentity() {
  const { user } = useAuth();
  const [identity, setIdentity] = useState(() =>
    normalizeDashboardIdentity(user),
  );
  const [loading, setLoading] = useState(Boolean(user?.user_id));

  useEffect(() => {
    setIdentity(normalizeDashboardIdentity(user));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    if (!user?.user_id) {
      setLoading(false);
      setIdentity(normalizeDashboardIdentity(user));
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);

    authService
      .getProfile()
      .then((response) => {
        if (cancelled) return;
        const profile = response?.data ?? response ?? user;
        setIdentity(normalizeDashboardIdentity({ ...user, ...profile }));
      })
      .catch(() => {
        if (cancelled) return;
        setIdentity(normalizeDashboardIdentity(user));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { identity, loading };
}
