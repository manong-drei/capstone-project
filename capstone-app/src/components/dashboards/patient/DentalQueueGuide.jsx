import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Megaphone, Smartphone, Stethoscope, Ticket, X } from "lucide-react";

const STEPS = [
  {
    title: "Get a queue ticket",
    shortTitle: "Get a ticket",
    detail: "From Home, select Get queue ticket and choose one or two dental services. Keep your ticket number handy.",
    Icon: Ticket,
    example: { label: "Your queue number", value: "AQ07", status: "Waiting", tone: "bg-blue-50 text-blue-800" },
  },
  {
    title: "Track your turn",
    shortTitle: "Track your turn",
    detail: "Check Now serving on Home or open View queue line. Stay nearby and keep an eye on your ticket.",
    Icon: Smartphone,
    example: { label: "Now serving", value: "AQ06", status: "Your ticket · AQ07", tone: "bg-blue-50 text-blue-800" },
  },
  {
    title: "Report when called",
    shortTitle: "Report to staff",
    detail: "Head to the dental desk as soon as your ticket is called. Show staff your queue number.",
    Icon: Megaphone,
    example: { label: "Your queue number", value: "AQ07", status: "Called · Report to staff", tone: "bg-orange-100 text-orange-900" },
  },
  {
    title: "Receive dental care",
    shortTitle: "Receive care",
    detail: "Staff will confirm your arrival. Follow their instructions as they bring you in for your visit.",
    Icon: Stethoscope,
    example: { label: "Your queue number", value: "AQ07", status: "Serving · Visit in progress", tone: "bg-blue-50 text-blue-800" },
  },
];

export default function DentalQueueGuide({ onClose }) {
  const dialogRef = useRef(null);
  const [step, setStep] = useState(0);
  const { title, detail, Icon, example } = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dental-queue-guide-title"
      onCancel={onClose}
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-0 text-neutral-800 shadow-xl backdrop:bg-neutral-950/50 backdrop:backdrop-blur-sm"
    >
      <div className="relative grid sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <button
          type="button"
          aria-label="Close queue guide"
          onClick={onClose}
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-600 sm:top-4 sm:right-4"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-5 sm:border-r sm:border-b-0 sm:px-6 sm:py-8">
          <p className="text-xs font-semibold tracking-wide text-orange-800 uppercase">Patient guide</p>
          <h2 id="dental-queue-guide-title" className="mt-2 max-w-56 pr-8 text-xl leading-tight font-semibold tracking-tight text-neutral-950 sm:pr-0 sm:text-2xl">
            How the dental queue works
          </h2>
          <ol aria-label="Queue guide steps" className="mt-4 grid grid-cols-4 gap-2 sm:mt-8 sm:grid-cols-1">
            {STEPS.map(({ title, shortTitle }, index) => (
              <li key={title}>
                <button
                  type="button"
                  aria-label={`Step ${index + 1}: ${title}`}
                  aria-current={index === step ? "step" : undefined}
                  onClick={() => setStep(index)}
                  className="group flex min-h-11 w-full items-center justify-center gap-3 rounded-lg px-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-600 aria-[current=step]:bg-orange-50 aria-[current=step]:text-orange-900 sm:justify-start"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold ring-1 ring-neutral-200 group-aria-[current=step]:bg-orange-100 group-aria-[current=step]:ring-orange-300">{index + 1}</span>
                  <span className="hidden text-left sm:block">{shortTitle}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex min-w-0 flex-col gap-5 p-5 sm:gap-6 sm:p-8">
          <div aria-live="polite" aria-atomic="true">
            <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">Step {step + 1} of {STEPS.length}</p>
            <h3 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-neutral-950 sm:pr-6 sm:text-3xl">{title}</h3>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600 sm:text-base">{detail}</p>
          </div>

          <figure className="rounded-xl border border-neutral-200 p-4 sm:p-5">
            <figcaption className="mb-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">Sample queue</figcaption>
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <Icon size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-600">{example.label}</p>
                <p className="text-2xl leading-tight font-semibold tracking-tight text-neutral-950 tabular-nums">{example.value}</p>
                <p className={`mt-1.5 w-fit rounded-md px-2 py-1 text-xs leading-snug font-semibold ${example.tone}`}>{example.status}</p>
              </div>
            </div>
          </figure>

          <footer className="mt-auto flex justify-between gap-3 border-t border-neutral-200 pt-4">
            <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-neutral-700 enabled:hover:bg-neutral-100 disabled:text-neutral-400">
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
            <button type="button" onClick={isLast ? onClose : () => setStep(step + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">
              {isLast ? <>Done <Check size={17} aria-hidden="true" /></> : <>Next <ArrowRight size={17} aria-hidden="true" /></>}
            </button>
          </footer>
        </div>
      </div>
    </dialog>
  );
}
