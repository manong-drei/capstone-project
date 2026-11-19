import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import AppDialog from "@/components/common/AppDialog";
import { useAuth } from "./useAuth";

const AppDialogContext = createContext(null);

export function AppDialogProvider({ children }) {
  const { key } = useLocation();
  const { user, expired } = useAuth();
  const scope = `${key}:${user?.user_id ?? ""}:${Boolean(expired)}`;
  const currentScope = useRef(scope);
  const queue = useRef([]);
  const sequence = useRef(0);
  const [active, setActive] = useState(null);

  const finish = useCallback((request, accepted) => {
    const index = queue.current.indexOf(request);
    if (index < 0) return;
    queue.current.splice(index, 1);
    request.signal?.removeEventListener("abort", request.abort);
    setActive(queue.current[0] ?? null);
    request.resolve(accepted);
  }, []);

  useEffect(() => {
    currentScope.current = scope;
    const pending = queue.current;
    return () => {
      pending.filter((request) => request.scope === scope)
        .forEach((request) => finish(request, false));
    };
  }, [scope, finish]);

  const showDialog = useCallback((options) => new Promise((resolve) => {
    if (expired || currentScope.current !== scope || options.signal?.aborted) {
      resolve(false);
      return;
    }
    const request = { ...options, id: ++sequence.current, resolve, scope };
    request.abort = () => finish(request, false);
    options.signal?.addEventListener("abort", request.abort, { once: true });
    queue.current.push(request);
    setActive(queue.current[0]);
  }), [expired, finish, scope]);

  return (
    <AppDialogContext.Provider value={showDialog}>
      {children}
      {active?.scope === scope && <AppDialog key={active.id} request={active} onAnswer={(accepted) => finish(active, accepted)} />}
    </AppDialogContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export default function useAppDialog() {
  return useContext(AppDialogContext);
}
