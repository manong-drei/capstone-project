import { useEffect, useRef, useState } from "react";

export default function QueueCancellationDialog({ notice, onAcknowledge }) {
  const dialogRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    let previous;
    let previousOverflow;
    const showWhenReady = () => {
      if (dialog.open) return;
      const anotherDialog = [...document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]')]
        .some((element) => element !== dialog && element.getClientRects().length > 0);
      if (anotherDialog) return;
      previous = document.activeElement;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = "hidden";
    };
    const observer = new MutationObserver(showWhenReady);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    showWhenReady();
    return () => {
      observer.disconnect();
      dialog.close();
      if (previousOverflow !== undefined) document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const acknowledge = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onAcknowledge(notice.id);
    } catch (err) {
      setError(err.message || "Unable to acknowledge cancellation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="queue-cancellation-title"
      aria-describedby="queue-cancellation-description queue-cancellation-reason"
      onCancel={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          dialogRef.current.querySelector("button")?.focus();
        }
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl backdrop:bg-slate-900/55 sm:p-7"
    >
      <h2 id="queue-cancellation-title" className="text-lg font-bold text-slate-900">
        Your queue ticket was cancelled
      </h2>
      <p id="queue-cancellation-description" className="mt-3 text-sm leading-6">
        Ticket <strong>{notice.queue_number}</strong> was cancelled by {notice.cancelled_by_role === "admin" ? "an admin" : notice.cancelled_by_role === "doctor" ? "a doctor" : "staff"}.
      </p>
      <div id="queue-cancellation-reason" className="mt-4 rounded-xl bg-slate-100 p-4 text-sm leading-6">
        <p className="font-semibold">Reason for cancellation</p>
        <p className="mt-1 whitespace-pre-wrap wrap-anywhere">{notice.status_reason}</p>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={acknowledge}
          className="min-h-11 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "I understand"}
        </button>
      </div>
    </dialog>
  );
}
