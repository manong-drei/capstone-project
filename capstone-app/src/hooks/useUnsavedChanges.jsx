import { createContext, useContext, useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import useAppDialog from "./useAppDialog";

const discardDialog = {
  title: "Discard unsaved changes?",
  message: "Your edits will be lost if you continue.",
  confirmLabel: "Discard changes",
  cancelLabel: "Keep editing",
  destructive: true,
};
const UnsavedChanges = createContext(null);

export function UnsavedChangesProvider({ children }) {
  const guards = useRef(new Map());
  const blocker = useBlocker(() => guards.current.size > 0);
  const showDialog = useAppDialog();

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const pending = Array.from(guards.current.values());
    if (pending.some(({ saving }) => saving)) {
      blocker.reset();
      return;
    }
    if (pending.length === 0) {
      blocker.proceed();
      return;
    }
    const controller = new AbortController();
    void showDialog({ ...discardDialog, signal: controller.signal }).then((discard) => {
      if (controller.signal.aborted) return;
      if (!discard) {
        blocker.reset();
        return;
      }
      pending.forEach(({ onDiscard }) => onDiscard?.());
      blocker.proceed();
    });
    return () => controller.abort();
  }, [blocker, showDialog]);

  return <UnsavedChanges.Provider value={guards}>{children}</UnsavedChanges.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export default function useUnsavedChanges(dirty, saving = false, onDiscard) {
  const guards = useContext(UnsavedChanges);
  const showDialog = useAppDialog();
  useEffect(() => {
    if (!dirty && !saving) return;
    const key = Symbol();
    const registry = guards?.current;
    const guard = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    registry?.set(key, { saving, onDiscard });
    window.addEventListener("beforeunload", guard);
    return () => {
      registry?.delete(key);
      window.removeEventListener("beforeunload", guard);
    };
  }, [dirty, saving, guards, onDiscard]);

  return () => !saving && (!dirty || showDialog(discardDialog));
}
