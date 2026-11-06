import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  ChevronDown,
  Clock3,
  History,
  MapPin,
  Ticket,
  UserRound,
} from "lucide-react";
import { createElement } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { CinematicHero } from "./cinematic-landing-hero";

const features = [
  [
    Clock3,
    "Follow the live queue",
    "See who is being served, your place in line, and an estimated wait. Keep checking your ticket and report when called.",
  ],
  [
    BellRing,
    "SMS notifications",
    "Eligible tickets receive a text reminder as their turn approaches. If you join close to the front, stay nearby; no queue SMS will be sent.",
  ],
  [
    CalendarCheck,
    "Check dentist availability",
    "See whether the dentist is available or on leave before requesting a ticket. Registration depends on today's availability and capacity.",
  ],
  [
    History,
    "Your dental visit history",
    "Review past appointments and the consultation details recorded by your dental team, all in your patient account.",
  ],
];

const steps = [
  [
    UserRound,
    "Sign in to your account",
    "Use your registered mobile number and password. New patient? Ask clinic reception to help you get started.",
  ],
  [
    Ticket,
    "Request today's ticket",
    "Check dentist availability, tap “Get queue ticket”, and choose one or two dental services. Your number appears after confirmation.",
  ],
  [
    BellRing,
    "Follow your turn",
    "Read your ticket's SMS notice, stay nearby, and check the queue on your phone. Report to staff as soon as you are called.",
  ],
];

const questions = [
  [
    "How do I get an account?",
    "Visit clinic reception for help creating your patient account. Once registered, sign in with your mobile number and password. If you receive a temporary password, change it when prompted.",
  ],
  [
    "Does my ticket book a future appointment?",
    "No. A queue ticket is for today's dental visit, subject to dentist availability and capacity. Your estimated wait is a guide, not a guaranteed appointment time.",
  ],
  [
    "Will I always receive an SMS?",
    "Check the notice on your ticket. Eligible tickets receive an approaching-turn reminder, but tickets that join close to the front receive no queue SMS. Messages can be delayed, so keep checking the queue and do not wait for a text before reporting when called.",
  ],
  [
    "What if I can't get a ticket online?",
    "Read the registration message in your patient portal. Availability, capacity, an existing ticket, or the daily registration limit may prevent a new request. Approach clinic staff for help or ask about walk-in registration.",
  ],
];

const clinicInfo = {
  dental: {
    title: "Dental Services",
    content: (
      <>
        <p>
          Start with a dental check-up. The dental team can examine your teeth
          and gums and discuss what care you need.
        </p>
        <p>
          Ask the facility about teeth cleaning (oral prophylaxis), fillings,
          and treatment availability before you visit.
        </p>
      </>
    ),
  },
  oral: {
    title: "Oral Health",
    content: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>Brush twice a day with fluoride toothpaste.</li>
          <li>Choose water more often and limit sugary drinks and snacks.</li>
          <li>Ask your dentist how often you should have a check-up.</li>
        </ul>
        <a href="https://www.who.int/news-room/fact-sheets/detail/oral-health">
          Oral health guidance from the World Health Organization
        </a>
      </>
    ),
  },
  visit: {
    title: "Visit the Clinic",
    content: (
      <>
        <address className="not-italic">
          City Hall Compound, A. Gonzaga Street
          <br />
          Brgy. Poblacion, Bago City, Negros Occidental
        </address>
        <p>
          Check dental schedules, service availability, and what to bring before
          you go.
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a href="https://web.facebook.com/cityhealth6101">
            Facility updates on Facebook
          </a>
          <a href="https://www.google.com/maps/search/?api=1&query=Bago+City+Primary+Care+Facility+A+Gonzaga+Street+Poblacion+Bago+City">
            Get directions
          </a>
        </div>
      </>
    ),
  },
};

function showClinicInfo(topic) {
  document.getElementById(`clinic-info-${topic}`).showModal();
}

export default function CinematicLandingPage() {
  return (
    <div className="cinematic-page">
      <a href="#main-content" className="cinematic-skip">
        Skip to content
      </a>
      <header className="cinematic-nav">
        <div className="cinematic-shell cinematic-masthead">
          <Link
            to={ROUTES.HOME}
            className="cinematic-brand"
            aria-label="Bago City Primary Care Facility and E-Kalusugan home"
          >
            <img
              src="/assets/bago-city-pcf.png"
              alt="Bago City Primary Care Facility seal"
              width="52"
              height="52"
            />
            <img
              src="/assets/Logo.webp"
              alt="E-Kalusugan"
              width="52"
              height="52"
            />
            <span>
              <small>E-Kalusugan · City Government of Bago</small>
              <strong>Bago City Primary Care Facility</strong>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <Link
              to={ROUTES.LOGIN}
              className="cinematic-clinic-button cinematic-login"
            >
              Patient Portal <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <CinematicHero onClinicInfo={showClinicInfo} />

        <section
          id="features"
          className="cinematic-section cinematic-shell"
          aria-labelledby="features-title"
        >
          <div className="cinematic-section-heading">
            <div>
              <p className="cinematic-kicker">YOUR DENTAL CARE, CONNECTED</p>
              <h2 id="features-title">
                A clearer queue.
                <br />
                <span>A simpler clinic visit.</span>
              </h2>
            </div>
            <p>
              From your first queue ticket to your next check-up, E-Kalusugan
              keeps the details of your dental visit in one place.
            </p>
          </div>
          <div className="cinematic-feature-layout">
            <div className="cinematic-feature-list">
              {features.map(([icon, title, description]) => (
                <article className="cinematic-feature" key={title}>
                  <span className="cinematic-feature-icon">
                    {createElement(icon, {
                      size: 22,
                      strokeWidth: 1.8,
                      "aria-hidden": true,
                    })}
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
            <figure className="cinematic-ticket-preview">
              <div className="cinematic-preview-heading">
                <span>
                  <Ticket size={19} aria-hidden="true" /> Your ticket, at a
                  glance
                </span>
                <span className="cinematic-sample-label">SAMPLE</span>
              </div>
              <div className="cinematic-preview-image">
                <img
                  src="/assets/manual/patient-ticket.png"
                  alt="Sample dental queue ticket AQ07 showing Waiting status, Dental Check-up, and a notice to stay nearby."
                  width="576"
                  height="669"
                  loading="lazy"
                />
              </div>
              <figcaption>
                <p className="cinematic-kicker">KNOW WHAT TO DO NEXT</p>
                <h3>One number. The details you need.</h3>
                <p>
                  Your patient dashboard shows your queue number, status,
                  selected services, and whether to expect an SMS reminder.
                </p>
                <a
                  href="/assets/manual/patient-ticket.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  View sample ticket <ArrowRight size={16} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          id="how-it-works"
          className="cinematic-steps-section"
          aria-labelledby="steps-title"
        >
          <div className="cinematic-shell cinematic-section">
            <div className="cinematic-section-heading">
              <div>
                <p className="cinematic-kicker">THREE SIMPLE STEPS</p>
                <h2 id="steps-title">Your dental visit starts here.</h2>
              </div>
              <Link to={ROUTES.LOGIN} className="cinematic-text-link">
                Get started in the patient portal{" "}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <ol className="cinematic-steps">
              {steps.map(([icon, title, description], index) => (
                <li key={title}>
                  <div className="cinematic-step-top">
                    <span>0{index + 1}</span>
                    {createElement(icon, {
                      size: 25,
                      strokeWidth: 1.6,
                      "aria-hidden": true,
                    })}
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
            <p className="cinematic-steps-note">
              <Clock3 size={18} aria-hidden="true" /> Queue tickets are for
              today's visit. Follow the current queue and clinic staff's
              instructions.
            </p>
          </div>
        </section>

        <section
          className="cinematic-shell cinematic-section cinematic-help-layout"
          aria-labelledby="questions-title"
        >
          <div>
            <p className="cinematic-kicker">BEFORE YOU VISIT</p>
            <h2 id="questions-title">
              A little help
              <br />
              <span>before you join.</span>
            </h2>
            <p className="cinematic-help-intro">
              New to E-Kalusugan? Here are a few things to know about your
              account and dental queue ticket.
            </p>
            <button
              type="button"
              className="cinematic-text-link"
              aria-haspopup="dialog"
              onClick={() => showClinicInfo("visit")}
            >
              <MapPin size={18} aria-hidden="true" /> Find the clinic{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="cinematic-faq">
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={19} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          id="get-started"
          className="cinematic-shell cinematic-cta"
          aria-labelledby="get-started-title"
        >
          <div>
            <p className="cinematic-kicker">HERE FOR YOUR NEXT SMILE</p>
            <h2 id="get-started-title">Ready for your dental visit?</h2>
            <p>
              Sign in, check today's availability, and request your queue
              ticket.
            </p>
          </div>
          <div className="cinematic-cta-action text-amber-300">
            <Link to={ROUTES.LOGIN} className="cinematic-primary">
              Get a queue ticket <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <span>First visit? Reception can help you register.</span>
          </div>
        </section>
      </main>

      {Object.entries(clinicInfo).map(([topic, { title, content }]) => (
        <dialog
          key={topic}
          id={`clinic-info-${topic}`}
          aria-labelledby={`clinic-info-${topic}-title`}
          className="cinematic-clinic-dialog"
        >
          <h2 id={`clinic-info-${topic}-title`}>{title}</h2>
          <div className="space-y-3">{content}</div>
          <form method="dialog">
            <button className="cinematic-clinic-button cinematic-login">
              Close
            </button>
          </form>
        </dialog>
      ))}

      <footer className="cinematic-footer">
        <div className="cinematic-shell">
          <div className="cinematic-footer-top">
            <div className="cinematic-footer-brand">
              <div className="cinematic-footer-logos">
                <img
                  src="/assets/Logo.webp"
                  alt="E-Kalusugan"
                  width="48"
                  height="48"
                  loading="lazy"
                />
                <img
                  src="/assets/bago-city-pcf.png"
                  alt="Bago City Primary Care Facility seal"
                  width="48"
                  height="48"
                  loading="lazy"
                />
              </div>
              <div>
                <strong>E-KALUSUGAN</strong>
                <p>Dental care for the Bago community.</p>
              </div>
            </div>
            <nav aria-label="Footer navigation">
              <a href="#how-it-works">How it works</a>
              <a href="#features">Features</a>
              <Link to={ROUTES.LOGIN}>Patient login</Link>
            </nav>
          </div>
          <div className="cinematic-footer-bottom">
            <p>Bago City Primary Care Facility · Brgy. Poblacion, Bago City</p>
            <p>© {new Date().getFullYear()} E-Kalusugan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
