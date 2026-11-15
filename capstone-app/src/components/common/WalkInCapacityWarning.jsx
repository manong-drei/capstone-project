import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

export default function WalkInCapacityWarning({ limit, count, onWarning }) {
  const notified = useRef(null);
  const remaining = limit - count;
  const low = Number.isFinite(remaining) && limit > 0 && remaining > 0 && remaining <= 5;
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const message = `Walk-in slots almost full — ${remaining} ${remaining === 1 ? "slot" : "slots"} remaining today.`;

  useEffect(() => {
    if (!low) {
      notified.current = null;
    } else if (notified.current !== day) {
      notified.current = day;
      onWarning(message, "warning");
    }
  }, [low, day, message, onWarning]);

  if (!Number.isFinite(remaining) || limit <= 0 || remaining > 5) return null;
  return (
    <p role="status" className={`flex items-start gap-2 rounded-lg border p-3 text-sm font-semibold leading-relaxed ${remaining <= 0 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      {remaining <= 0 ? "SLOTS FULL — No more walk-ins can be accepted today" : message}
    </p>
  );
}
