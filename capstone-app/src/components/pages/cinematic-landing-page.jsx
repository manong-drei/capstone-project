import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock,
  HeartPulse,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createElement } from "react";
import { ROUTES } from "@/constants/routes";
import { CinematicHero } from "./cinematic-landing-hero";

const features = [
  [
    Bell,
    "Smart notifications",
    "A little heads-up goes a long way. Get alerted when your turn is coming up.",
  ],
  [
    Clock,
    "Real-time updates",
    "Stay in the know. Track your queue position and estimated wait time.",
  ],
  [
    User,
    "No more waiting",
    "Get your number, go about your day, and come back when you’re ready.",
  ],
  [
    CalendarDays,
    "Doctor schedules",
    "Plan your visit with the availability of your preferred physicians.",
  ],
  [
    UserPlus,
    "Remote registration",
    "Start your healthcare journey from the comfort of your home.",
  ],
  [
    ShieldCheck,
    "Data security",
    "Your health information deserves care, too. Keep it protected in your account.",
  ],
];

export default function CinematicLandingPage() {
  return (
    <div className="cinematic-page">
      <a href="#main-content" className="cinematic-skip">
        Skip to content
      </a>
      <header className="cinematic-nav">
        <nav
          className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8"
          aria-label="Main navigation"
        >
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5"
            aria-label="E-KALUSUGAN home"
          >
            <img
              src="/assets/Logo.webp"
              alt=""
              className="size-9 rounded-full"
            />
            <span className="text-xs font-extrabold tracking-[0.1em] sm:text-sm">
              E-KALUSUGAN<span className="text-orange-600">.</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 text-xs font-medium text-blue-100 md:flex">
            <a href="#features">Why E-Kalusugan</a>
            <a href="#get-started">Your next visit</a>
          </div>
          <Link to={ROUTES.LOGIN} className="cinematic-login">
            Log in <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <CinematicHero />
        <section
          id="features"
          className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-28"
        >
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="cinematic-eyebrow text-orange-700!">
                A BETTER WAY TO GET BETTER
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Small details.
                <br />
                <span className="text-[#1e4db7]">A healthier experience.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-slate-500">
              Everything you loved about E-KALUSUGAN, designed around one simple
              idea: healthcare should fit into your life.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([Icon, title, description], index) => (
              <article
                key={title}
                className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                    {createElement(Icon, {
                      size: 21,
                      strokeWidth: 1.6,
                      "aria-hidden": true,
                    })}
                  </span>
                  <span className="text-[10px] tracking-widest text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="max-w-xs text-sm leading-7 text-slate-500">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="get-started"
          className="cinematic-cta mx-4 mb-5 rounded-3xl px-6 py-16 text-center sm:mx-6 sm:py-24"
        >
          <HeartPulse
            className="mx-auto mb-6 text-[#ffffff]"
            size={30}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="cinematic-eyebrow text-[#ffffff]!">
            LESS WAITING STARTS HERE
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-[#ffffff] sm:text-6xl">
            Make time for
            <br />a healthier you.
          </h2>
          <p className="mx-auto mb-8 mt-5 max-w-md text-sm leading-7 text-[#ffffff]">
            A simpler visit is just a few clicks away. Sign in to start planning
            your next healthcare visit.
          </p>
          <Link to={ROUTES.LOGIN} className="cinematic-primary">
            Schedule your visit <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <p className="mt-6 text-xs text-[#ffffff]">
            Bago City Healthcare Facility · Here for our community.
          </p>
        </section>
      </main>

      <footer className="flex flex-col items-center justify-between gap-5 bg-slate-900 px-6 py-8 text-center text-xs text-slate-300 sm:flex-row sm:text-left lg:px-16">
        <p>
          <span className="font-bold tracking-wider text-white">
            E-KALUSUGAN
          </span>
          <span className="mt-1.5 block">
            Making healthcare accessible for everyone.
          </span>
        </p>
        <div className="flex gap-6">
          <Link to={ROUTES.HOME}>Home</Link>
          <a href="#features">Features</a>
          <Link to={ROUTES.LOGIN}>Log in</Link>
        </div>
        <p>© {new Date().getFullYear()} E-KALUSUGAN</p>
      </footer>
    </div>
  );
}
