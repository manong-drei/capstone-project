import useLiveData from "@/hooks/useLiveData";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import * as authService from "@/services/authService";

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
  const combined = [pickFirst(source.first_name), pickFirst(source.middle_name), pickFirst(source.last_name), pickFirst(source.suffix)]
    .filter(Boolean)
    .join(" ")
    .trim();

  return pickFirst(
    source.display_name,
    combined,
    source.first_name,
    source.last_name,
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

  useLiveData(useCallback(async (signal) => {
    setLoading(true);
    try {
      const response = await authService.getProfile({ signal });
      if (!signal.aborted) setIdentity(normalizeDashboardIdentity({ ...user, ...(response?.data ?? response ?? user) }));
    } catch {
      if (!signal.aborted) setIdentity(current => current.user_id === user.user_id ? current : normalizeDashboardIdentity(user));
    } finally { if (!signal.aborted) setLoading(false); }
  }, [user]), Boolean(user?.user_id));

  return { identity, loading };
}
