import { useEffect, useRef, useState } from "react";
import { DENTAL_SERVICES as SERVICES } from "@/constants/medicalServices";
import Icon from "@/components/common/AppIcons";

const MAX_SELECTED_SERVICES = 2;

export default function GetQueueModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  priorityEligible = false,
  registrationMessage,
}) {
  const [selected, setSelected] = useState([]);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const toggleService = (id) => {
    const alreadySelected = selected.includes(id);
    if (alreadySelected) {
      setSelected((prev) => prev.filter((s) => s !== id));
      return;
    }

    if (selected.length >= MAX_SELECTED_SERVICES) return;
    setSelected((prev) => [...prev, id]);
  };

  const handleSubmit = () => {
    if (selected.length === 0 || loading || registrationMessage) return;
    onSubmit({
      services: selected,
      type: priorityEligible ? "priority" : "regular",
    });
  };

  const limitReached = selected.length >= MAX_SELECTED_SERVICES;
  const isDisabled = selected.length === 0 || loading || !!registrationMessage;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="get-queue-title"
      aria-describedby="get-queue-description"
      onCancel={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white p-0 text-[#111827] shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex shrink-0 items-start gap-3 border-b border-[#e5e7eb] p-5 sm:p-6">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#c2410c]"
          >
            <Icon name="queue" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="get-queue-title"
              className="text-xl font-bold tracking-tight text-[#2d3a8c]"
            >
              Get Queue Ticket
            </h2>
            <p
              id="get-queue-description"
              className="mt-1 text-sm leading-5 text-[#6b7280]"
            >
              Choose dental services for today's visit.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue ticket"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <span aria-hidden="true"><Icon name="close" size={20} /></span>
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {registrationMessage && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
            >
              {registrationMessage}
            </p>
          )}

          <fieldset aria-describedby="queue-services-hint" className="min-w-0">
            <legend className="sr-only">Dental services</legend>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p aria-hidden="true" className="text-sm font-semibold text-[#374151]">
                  Dental services
                </p>
                <p id="queue-services-hint" className="mt-1 text-xs text-[#6b7280]">
                  Select up to {MAX_SELECTED_SERVICES} services.
                </p>
              </div>
              <span
                role="status"
                className="shrink-0 rounded-full bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold tabular-nums text-[#2d3a8c]"
              >
                {selected.length} / {MAX_SELECTED_SERVICES} selected
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICES.map(({ id, label }) => {
                const active = selected.includes(id);
                const blocked = limitReached && !active;
                return (
                  <label
                    key={id}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-sm leading-5 transition-colors focus-within:ring-4 focus-within:ring-blue-100 ${
                      active
                        ? "cursor-pointer border-[#2d3a8c] bg-[#eff6ff] font-semibold text-[#2d3a8c]"
                        : blocked
                          ? "cursor-not-allowed border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]"
                          : "cursor-pointer border-[#e5e7eb] bg-white text-[#374151] hover:border-[#2d3a8c] hover:bg-[#f9fafb]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={blocked}
                      onChange={() => toggleService(id)}
                      className="h-5 w-5 shrink-0 cursor-[inherit] accent-[#2d3a8c]"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <footer className="shrink-0 border-t border-[#e5e7eb] bg-[#f9fafb] p-5 sm:p-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled}
            aria-busy={loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9a3412] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#6b7280]"
          >
            {loading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
              />
            )}
            {loading ? "Getting your ticket..." : "Get Queue Ticket"}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
