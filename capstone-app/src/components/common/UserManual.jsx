import { useEffect, useRef } from "react";
import { ArrowDown, ArrowRight, BookOpen, CheckCircle2, ClipboardList, Clock3, List, Megaphone, PhoneMissed, Stethoscope, X } from "lucide-react";
import { USER_MANUALS } from "@/constants/userManuals";
import "./UserManual.css";

const QUEUE_STAGES = [
  { title: "Waiting", text: "Your ticket is in the queue.", Icon: Clock3 },
  { title: "Called", text: "Report to staff now.", Icon: Megaphone },
  { title: "Serving", text: "The patient is present for care.", Icon: Stethoscope },
  { title: "Done", text: "The visit is complete.", Icon: CheckCircle2 },
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
      else document.querySelector('[aria-label="Toggle menu"]')?.focus();
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
    <dialog ref={dialogRef} className="user-manual" aria-modal="true" aria-labelledby="manual-title" onCancel={onClose}>
      <div className="manual-shell">
        <header className="manual-header">
          <div className="manual-brand"><BookOpen size={25} aria-hidden="true" /><span className="manual-brand-full">E-KALUSUGAN · Help center</span><span className="manual-brand-mobile">{manual.label} manual</span></div>
          <a className="manual-toc-shortcut" href="#manual-contents" aria-label="Table of contents" onClick={(event) => jumpTo(event, "contents")}><List size={22} aria-hidden="true" /></a>
          <button type="button" className="manual-close" aria-label="Close manual" onClick={onClose} autoFocus><X size={22} aria-hidden="true" /><span>Close</span></button>
        </header>
        <div className="manual-layout">
          <nav className="manual-contents" id="manual-contents" aria-label="Manual contents" tabIndex={-1}>
            <p className="manual-eyebrow">IN THIS MANUAL</p>
            <h2>Table of contents</h2>
            <ol>{sections.map(({ id, title }) => <li key={id}><a href={`#manual-${id}`} onClick={(event) => jumpTo(event, id)}>{title}</a></li>)}</ol>
            <p className="manual-nav-note">Use these links to jump to a topic. Close this guide or press Esc to return to your work.</p>
          </nav>
          <article className="manual-article" aria-labelledby="manual-title">
            <section className="manual-intro" id="manual-introduction" tabIndex={-1}>
              <span className="manual-role">{manual.label} guide</span>
              <h1 id="manual-title">{manual.label} user manual</h1>
              <h2>Introduction</h2>
              <p>{manual.introduction}</p>
              <div className="manual-callout"><BookOpen size={22} aria-hidden="true" /><p>This guide matches your signed-in role. Follow the button names shown in quotation marks. Opening Help keeps your current dashboard and any work in progress in place.</p></div>
              <h3>Your usual workflow</h3>
              <ol className="manual-workflow" aria-label={`${manual.label} workflow diagram`}>
                {manual.workflow.map((step, index) => <li key={step}><span className="manual-step-number">{index + 1}</span><span>{step}</span>{index < manual.workflow.length - 1 && <ArrowRight className="manual-workflow-arrow" size={20} aria-hidden="true" />}</li>)}
              </ol>
              <h3>Before you begin</h3>
              <ul>{manual.before.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>

            {manual.tasks.map((task, index) => <section className="manual-section" id={`manual-${task.id}`} key={task.id} tabIndex={-1}>
              <p className="manual-eyebrow">TASK {String(index + 1).padStart(2, "0")}</p>
              <h2>{task.title}</h2>
              <p>{task.summary}</p>
              <ol className="manual-instructions">{task.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              {task.note && <div className="manual-callout"><ClipboardList size={22} aria-hidden="true" /><p>{task.note}</p></div>}
            </section>)}

            <section className="manual-section" id="manual-screen-guide" tabIndex={-1}>
              <h2>Screen guide</h2>
              <p>{manual.screen.description}</p>
              <figure className="manual-screen">
                <a href={manual.screen.src} target="_blank" rel="noreferrer" aria-label="Open example screenshot at full size"><img src={manual.screen.src} alt={manual.screen.alt} loading="lazy" /></a>
                <figcaption>Example screen with sample information. Numbers match the guide below. Select the image to open it at full size; your own records and counts will differ.</figcaption>
              </figure>
              <ol className="manual-instructions">{manual.screen.labels.map((label) => <li key={label}>{label}</li>)}</ol>
            </section>

            <section className="manual-section" id="manual-queue-guide" tabIndex={-1}>
              <h2>Queue guide</h2>
              <p>A ticket number identifies a visit. Follow the displayed queue order and status; the numbers alone do not show who is next.</p>
              <h3>How a visit moves through the queue</h3>
              <figure className="manual-queue-figure">
                <ol className="manual-queue-flow" aria-label="Queue status diagram">{QUEUE_STAGES.map((stage, index) => <li key={stage.title}><stage.Icon size={26} aria-hidden="true" /><strong>{stage.title}</strong><span>{stage.text}</span>{index < QUEUE_STAGES.length - 1 && <ArrowRight className="manual-flow-arrow" size={20} aria-hidden="true" />}</li>)}</ol>
                <div className="manual-missed"><ArrowDown size={22} aria-hidden="true" /><PhoneMissed size={22} aria-hidden="true" /><p><strong>If a patient misses both calls:</strong> the ticket becomes “Missed call”. Report to staff within the displayed 10-minute return window. A confirmed return keeps the same ticket for the next opening. An expired window or a second missed turn after returning ends the ticket as “No-show”.</p></div>
                <figcaption>The patient already called or being served keeps their turn when another patient returns.</figcaption>
              </figure>
              <h3>Words and ticket numbers you will see</h3>
              <div className="manual-table-wrap" role="region" aria-label="Queue terms" tabIndex={0}>
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

            <section className="manual-section" id="manual-troubleshooting" tabIndex={-1}>
              <h2>Troubleshooting</h2>
              <p>Find the problem below and try the suggested action. Read any message on the screen before repeating an action.</p>
              <div className="manual-table-wrap" role="region" aria-label="Troubleshooting guide" tabIndex={0}>
                <table><caption>Problems and next steps</caption><thead><tr><th scope="col">Problem</th><th scope="col">What to do</th></tr></thead><tbody>{manual.troubleshooting.map(([problem, action]) => <tr key={problem}><th scope="row">{problem}</th><td>{action}</td></tr>)}</tbody></table>
              </div>
              <h3>When you need more help</h3>
              <p>{manual.support} Note the action you tried, the time, and the exact message. Share only the information needed with authorized clinic staff; keep passwords private.</p>
            </section>

            <section className="manual-section" id="manual-faqs" tabIndex={-1}>
              <h2>FAQs</h2>
              <p>Frequently asked questions about your role.</p>
              <div className="manual-faqs">{manual.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
            </section>

            <section className="manual-section manual-conclusion" id="manual-conclusion" tabIndex={-1}>
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
