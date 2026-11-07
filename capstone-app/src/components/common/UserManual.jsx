import { useEffect, useRef } from "react";
import { ArrowDown, ArrowRight, BookOpen, CheckCircle2, ClipboardList, Clock3, List, Megaphone, PhoneMissed, Stethoscope, X } from "lucide-react";
import { USER_MANUALS } from "@/constants/userManuals";

const QUEUE_STAGES = [
  { title: "Waiting", text: "Your ticket is in the queue.", Icon: Clock3 },
  { title: "Called", text: "Report to staff now.", Icon: Megaphone },
  { title: "Serving", text: "The patient is present for care.", Icon: Stethoscope },
  { title: "Completed", text: "The visit is complete.", Icon: CheckCircle2 },
];

export default function UserManual({ role, isOpen, onClose }) {
  const dialogRef = useRef(null);
  const manual = USER_MANUALS[role];

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // The mobile menu may have closed while the manual was open.
      if (trigger?.isConnected && trigger !== document.body) trigger.focus();
      else document.querySelector('[aria-label="Toggle menu"], [aria-label="Open menu"]')?.focus();
    };
  }, [isOpen]);

  if (!isOpen || !manual) return null;

  const sections = [
    { id: "introduction", title: "Introduction" },
    ...manual.tasks,
    { id: "screen-guide", title: "Screen guide" },
    { id: "queue-guide", title: "Queue guide" },
    { id: "troubleshooting", title: "Troubleshooting" },
    { id: "faqs", title: "FAQs" },
    { id: "conclusion", title: "Conclusion" },
  ];

  const jumpTo = (event, id) => {
    event.preventDefault();
    const section = dialogRef.current.querySelector(`#manual-${id}`);
    section.scrollIntoView({ block: "start" });
    section.focus({ preventScroll: true });
  };

  return (
    <dialog ref={dialogRef} className="m-auto max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[1240px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 font-[Poppins,system-ui,sans-serif] text-base leading-7 text-slate-700 shadow-2xl backdrop:bg-blue-950/70 backdrop:backdrop-blur-sm min-[701px]:w-[calc(100%-2.5rem)] [&_:focus-visible]:outline-3 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-blue-600 [&_h1]:my-6 [&_h1]:text-3xl [&_h1]:leading-tight [&_h1]:font-bold [&_h1]:text-blue-950 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-blue-950 [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-3 [&_a]:text-blue-800 [&_a]:underline-offset-4 [&_figcaption]:bg-slate-50 [&_figcaption]:p-4 [&_figcaption]:text-slate-500 [&_table]:w-full [&_table]:text-left [&_caption]:p-4 [&_caption]:text-left [&_caption]:font-semibold [&_th]:border-t [&_th]:border-slate-200 [&_th]:p-3 [&_th]:align-top [&_th]:wrap-anywhere [&_td]:border-t [&_td]:border-slate-200 [&_td]:p-3 [&_td]:align-top [&_td]:wrap-anywhere [&_thead]:bg-blue-50 [&_tbody_th]:w-1/3" aria-modal="true" aria-labelledby="manual-title" onCancel={onClose}>
      <div className="flex h-[calc(100dvh-1.125rem)] flex-col min-[701px]:h-[min(900px,calc(100dvh-2.625rem))]">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 p-3 min-[701px]:gap-4 min-[701px]:px-6 min-[701px]:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 font-semibold text-blue-900 [&>svg]:hidden min-[701px]:[&>svg]:block"><BookOpen size={25} aria-hidden="true" /><span className="hidden min-[701px]:inline">E-KALUSUGAN · Help center</span><span className="min-[701px]:hidden">{manual.label} manual</span></div>
          <a className="grid size-11 shrink-0 place-items-center rounded-lg border border-slate-300 min-[701px]:hidden" href="#manual-contents" aria-label="Table of contents" onClick={(event) => jumpTo(event, "contents")}><List size={22} aria-hidden="true" /></a>
          <button type="button" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-blue-900 hover:bg-blue-50" aria-label="Close manual" onClick={onClose} autoFocus><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain min-[701px]:grid min-[701px]:grid-cols-[240px_minmax(0,1fr)] min-[701px]:overflow-hidden min-[1001px]:grid-cols-[280px_minmax(0,1fr)]">
          <nav className="border-b border-slate-200 bg-slate-50 p-5 min-[701px]:overflow-auto min-[701px]:border-r min-[701px]:border-b-0 min-[701px]:py-7 [&_h2]:text-lg! [&_ol]:list-[decimal-leading-zero] [&_ol]:pl-7 [&_a]:block [&_a]:py-1.5 [&_a:hover]:underline" id="manual-contents" aria-label="Manual contents" tabIndex={-1}>
            <p className="mb-2! font-semibold tracking-wide text-slate-500">IN THIS MANUAL</p>
            <h2>Table of contents</h2>
            <ol>{sections.map(({ id, title }) => <li key={id}><a href={`#manual-${id}`} onClick={(event) => jumpTo(event, id)}>{title}</a></li>)}</ol>
            <p className="border-t border-slate-200 pt-4 text-slate-500">Use these links to jump to a topic. Close this guide or press Esc to return to your work.</p>
          </nav>
          <article className="min-w-0 px-5 py-7 min-[701px]:overflow-y-auto min-[701px]:overscroll-contain min-[701px]:px-6 min-[1001px]:px-10 min-[1001px]:py-9 [&_section]:scroll-mt-6" aria-labelledby="manual-title">
            <section className="" id="manual-introduction" tabIndex={-1}>
              <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-900">{manual.label} guide</span>
              <h1 id="manual-title">{manual.label} user manual</h1>
              <h2>Introduction</h2>
              <p>{manual.introduction}</p>
              <div className="my-6 flex items-start gap-3 rounded-r-xl border-l-4 border-blue-600 bg-blue-50 p-4 text-blue-900 [&>svg]:mt-1 [&>svg]:hidden [&>svg]:shrink-0 min-[701px]:[&>svg]:block [&>p]:mb-0!"><BookOpen size={22} aria-hidden="true" /><p>This guide matches your signed-in role. Follow the button names shown in quotation marks. Opening Help keeps your current dashboard and any work in progress in place.</p></div>
              <h3>Your usual workflow</h3>
              <ol className="grid grid-cols-2 gap-4 min-[1001px]:grid-cols-4 [&>li]:relative [&>li]:flex [&>li]:flex-col [&>li]:items-start [&>li]:gap-3 [&>li]:rounded-xl [&>li]:border [&>li]:border-slate-200 [&>li]:bg-white [&>li]:p-3 [&>li]:leading-6 [&>li]:text-blue-900" aria-label={`${manual.label} workflow diagram`}>
                {manual.workflow.map((step, index) => <li key={step}><span className="grid size-8 place-items-center rounded-full bg-blue-800 font-semibold text-white">{index + 1}</span><span>{step}</span>{index < manual.workflow.length - 1 && <ArrowRight className="absolute top-6 -right-5 z-1 hidden bg-white min-[1001px]:block" size={20} aria-hidden="true" />}</li>)}
              </ol>
              <h3>Before you begin</h3>
              <ul>{manual.before.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>

            {manual.tasks.map((task, index) => <section className="mt-8 border-t border-slate-200 pt-7" id={`manual-${task.id}`} key={task.id} tabIndex={-1}>
              <p className="mb-2! font-semibold tracking-wide text-slate-500">TASK {String(index + 1).padStart(2, "0")}</p>
              <h2>{task.title}</h2>
              <p>{task.summary}</p>
              <ol className="list-decimal pl-7 [&>li]:mb-5 [&>li]:pl-2 [&>li::marker]:font-bold [&>li::marker]:text-blue-800">{task.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              {task.note && <div className="my-6 flex items-start gap-3 rounded-r-xl border-l-4 border-blue-600 bg-blue-50 p-4 text-blue-900 [&>svg]:mt-1 [&>svg]:hidden [&>svg]:shrink-0 min-[701px]:[&>svg]:block [&>p]:mb-0!"><ClipboardList size={22} aria-hidden="true" /><p>{task.note}</p></div>}
            </section>)}

            <section className="mt-8 border-t border-slate-200 pt-7" id="manual-screen-guide" tabIndex={-1}>
              <h2>Screen guide</h2>
              <p>{manual.screen.description}</p>
              <figure className="my-5 overflow-hidden rounded-xl border border-slate-200 [&_a]:block [&_img]:block [&_img]:h-auto [&_img]:w-full">
                <a href={manual.screen.src} target="_blank" rel="noreferrer" aria-label="Open example screenshot at full size"><img src={manual.screen.src} alt={manual.screen.alt} loading="lazy" /></a>
                <figcaption>Example screen with sample information. Numbers match the guide below. Select the image to open it at full size; your own records and counts will differ.</figcaption>
              </figure>
              <ol className="list-decimal pl-7 [&>li]:mb-5 [&>li]:pl-2 [&>li::marker]:font-bold [&>li::marker]:text-blue-800">{manual.screen.labels.map((label) => <li key={label}>{label}</li>)}</ol>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-7" id="manual-queue-guide" tabIndex={-1}>
              <h2>Queue guide</h2>
              <p>A ticket number identifies a visit. Follow the displayed queue order and status; the numbers alone do not show who is next.</p>
              <p>Verified priority patients go first in queue-entry order, whether registered online or by staff. Regular tickets alternate between online and walk-in patients when eligible. A new regular online ticket waits for earlier regular walk-ins to have their first turn. Registration can continue after service starts, subject to dentist availability and capacity.</p>
              <h3>How a visit moves through the queue</h3>
              <figure className="my-5">
                <ol className="grid grid-cols-2 gap-4 min-[1001px]:grid-cols-4 [&>li]:relative [&>li]:flex [&>li]:flex-col [&>li]:gap-2.5 [&>li]:rounded-xl [&>li]:border [&>li]:border-blue-200 [&>li]:bg-blue-50 [&>li]:p-3 [&>li]:leading-relaxed [&>li]:text-blue-900 [&>li:last-child]:border-emerald-200 [&>li:last-child]:bg-emerald-50 [&>li:last-child]:text-emerald-900" aria-label="Queue status diagram">{QUEUE_STAGES.map((stage, index) => <li key={stage.title}><stage.Icon size={26} aria-hidden="true" /><strong>{stage.title}</strong><span>{stage.text}</span>{index < QUEUE_STAGES.length - 1 && <ArrowRight className="absolute top-6 -right-5 z-1 hidden bg-white min-[1001px]:block" size={20} aria-hidden="true" />}</li>)}</ol>
                <div className="flex flex-wrap items-start gap-2 rounded-t-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 min-[701px]:flex-nowrap [&>svg]:mt-1 [&>svg]:shrink-0 [&>p]:mb-0!"><ArrowDown size={22} aria-hidden="true" /><PhoneMissed size={22} aria-hidden="true" /><p><strong>If a patient misses both calls:</strong> the ticket becomes “Missed call”. Report to staff within the displayed 10-minute return window. A confirmed return keeps the same ticket and rejoins behind patients already waiting in the same priority group. An expired window or a second missed turn after returning ends the ticket as “No-show”.</p></div>
                <figcaption>The patient already called or being served keeps their turn when another patient returns.</figcaption>
              </figure>
              <h3>Words and ticket numbers you will see</h3>
              <div className="my-5 overflow-x-auto rounded-xl border border-slate-200" role="region" aria-label="Queue terms" tabIndex={0}>
                <table><caption>Common terms, in plain language</caption><thead><tr><th scope="col">Term</th><th scope="col">What it means</th></tr></thead><tbody>
                  <tr><th scope="row">Appointment / walk-in</th><td>An appointment is a registered booking. A walk-in is registered by staff at the clinic.</td></tr>
                  <tr><th scope="row">AQ / AP</th><td>Dental appointment tickets: AQ is regular; AP is priority.</td></tr>
                  <tr><th scope="row">Q / P</th><td>Dental walk-in tickets: Q is regular; P is priority.</td></tr>
                  <tr><th scope="row">Priority</th><td>An approved patient category affects the order. It does not interrupt care already in progress.</td></tr>
                  <tr><th scope="row">Cancelled</th><td>The visit has been withdrawn with a recorded reason.</td></tr>
                  <tr><th scope="row">SMS</th><td>A text message to the registered or confirmed mobile number. Queue messages are reminders; keep checking the screen.</td></tr>
                </tbody></table>
              </div>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-7" id="manual-troubleshooting" tabIndex={-1}>
              <h2>Troubleshooting</h2>
              <p>Find the problem below and try the suggested action. Read any message on the screen before repeating an action.</p>
              <div className="my-5 overflow-x-auto rounded-xl border border-slate-200" role="region" aria-label="Troubleshooting guide" tabIndex={0}>
                <table><caption>Problems and next steps</caption><thead><tr><th scope="col">Problem</th><th scope="col">What to do</th></tr></thead><tbody>{manual.troubleshooting.map(([problem, action]) => <tr key={problem}><th scope="row">{problem}</th><td>{action}</td></tr>)}</tbody></table>
              </div>
              <h3>When you need more help</h3>
              <p>{manual.support} Note the action you tried, the time, and the exact message. Share only the information needed with authorized clinic staff; keep passwords private.</p>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-7" id="manual-faqs" tabIndex={-1}>
              <h2>FAQs</h2>
              <p>Frequently asked questions about your role.</p>
              <div className="[&_details]:border-b [&_details]:border-slate-200 [&_details]:py-5 [&_summary]:cursor-pointer [&_summary]:py-1 [&_summary]:font-semibold [&_summary]:text-blue-900 [&_p]:mt-3 [&_p]:mb-0!">{manual.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
            </section>

            <section className="mt-8 border-t border-slate-200 pt-7 rounded-2xl border border-emerald-200! bg-emerald-50/60 p-5! [&>svg]:mb-3 [&>svg]:text-emerald-700" id="manual-conclusion" tabIndex={-1}>
              <CheckCircle2 size={30} aria-hidden="true" /><h2>Conclusion</h2>
              <p>{manual.conclusion}</p>
              <p>You can reopen Help whenever you need a reminder. On a shared device, use your profile menu to sign out when you finish.</p>
              <a href="#manual-introduction" onClick={(event) => jumpTo(event, "introduction")}>Back to introduction ↑</a>
            </section>
          </article>
        </div>
      </div>
    </dialog>
  );
}
