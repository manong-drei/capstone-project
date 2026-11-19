import { useEffect, useRef } from "react";

export default function AppDialog({ request, onAnswer }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      role={request.confirmLabel ? "dialog" : "alertdialog"}
      aria-labelledby="app-dialog-title"
      aria-describedby="app-dialog-message"
      onCancel={(event) => { event.preventDefault(); onAnswer(false); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/55"
    >
      <h2 id="app-dialog-title" className="text-lg font-semibold">{request.title}</h2>
      <p id="app-dialog-message" className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">{request.message}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {request.confirmLabel && (
          <button type="button" autoFocus onClick={() => onAnswer(false)}
            className="min-h-11 cursor-pointer rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-700">
            {request.cancelLabel ?? "Cancel"}
          </button>
        )}
        <button type="button" onClick={() => onAnswer(true)}
          className={`min-h-11 cursor-pointer rounded-xl px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${request.destructive ? "bg-red-700 hover:bg-red-800" : "bg-blue-800 hover:bg-blue-900"}`}>
          {request.confirmLabel ?? "OK"}
        </button>
      </div>
    </dialog>
  );
}
