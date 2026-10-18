import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const tones = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 10_000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "info" ? Info : AlertCircle;
  return (
    <div role={toast.tone === "error" ? "alert" : "status"} aria-atomic="true"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 text-sm shadow-lg ${tones[toast.tone]}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 break-words">{toast.message}</p>
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"
        className="shrink-0 rounded p-1 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-current">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ToastNotifications({ toasts, onDismiss }) {
  return (
    <div aria-label="SMS notifications" className="pointer-events-none fixed right-4 top-4 z-[2000] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm flex-col gap-3 overflow-y-auto">
      {toasts.map((toast) => <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />)}
    </div>
  );
}
