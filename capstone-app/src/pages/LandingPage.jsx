import {
  Bell,
  CalendarDays,
  Clock,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { createElement } from "react";
import { useNavigate } from "react-router-dom";

const features = [
  [Bell, "Smart Notifications", "Get alerted when your turn is coming up."],
  [Clock, "Real-Time Updates", "Track queue position and wait time instantly."],
  [User, "No More Waiting", "Get your number and come back when ready."],
  [
    CalendarDays,
    "Doctor Schedules",
    "See availability of your preferred physicians.",
  ],
  [UserPlus, "Remote Registration", "Register from the comfort of your home."],
  [ShieldCheck, "Data Security", "Your health information is safe with us."],
];

export function Footer() {
  const columns = [
    ["Quick Links", ["Home", "Doctors", "Help"]],
    ["Support", ["Contact Us", "Privacy Policy", "Terms"]],
    ["About", ["About Us", "Blog", "Careers"]],
  ];

  return (
    <footer className="w-full bg-slate-900 px-4 pb-5 pt-8 sm:px-8 sm:pt-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <h1 className="mb-2 text-sm font-bold tracking-wide text-white">
              E-KALUSUGAN
            </h1>
            <p className="text-xs leading-relaxed text-gray-400">
              Making healthcare accessible for everyone.
            </p>
          </div>
          {columns.map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">
                {heading}
              </h4>
              <ul className="space-y-1.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs text-gray-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
          © 2026 E-KALUSUGAN. All rights reserved. | Bago City Healthcare
          Facility
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="flex w-full items-center justify-between bg-linear-to-r from-[#1a3a8f] to-[#1e4db7] px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
          aria-label="E-KALUSUGAN home"
        >
          <img
            src="/assets/Logo.webp"
            alt="logo"
            className="size-8 shrink-0 rounded-full object-cover sm:size-9"
          />
          <span className="text-sm font-extrabold tracking-widest text-white sm:text-base md:text-lg">
            E-KALUSUGAN
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="rounded-full border-2 border-orange-500 px-3 py-1 text-xs font-semibold text-orange-500 transition hover:bg-orange-500 hover:text-white active:scale-95 sm:px-5 sm:py-1.5 sm:text-sm"
        >
          Login
        </button>
      </nav>

      <main>
        <section className="flex min-h-80 items-center justify-center bg-[url('/assets/BGHero.webp')] bg-cover bg-center px-4 py-16 text-center sm:py-20">
          <h1 className="text-[clamp(1.5rem,5vw,2.5rem)] font-extrabold leading-tight tracking-[0.1em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.4)]">
            WELCOME
            <br />
            STAY HEALTHY, STAY SAFE
          </h1>
        </section>

        <section className="bg-[#1e3a8a] px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-bold text-white sm:mb-8 sm:text-2xl">
              Why Choose E-KALUSUGAN?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {features.map(([Icon, title, description]) => (
                <article
                  key={title}
                  className="rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
                    {createElement(Icon, {
                      className: "size-5 text-[#1e4db7]",
                      "aria-hidden": true,
                    })}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-gray-800">
                    {title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-500">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center bg-linear-to-br from-orange-500 via-orange-400 to-orange-300 px-4 py-10 text-center sm:px-6 sm:py-14">
          <h2 className="mb-3 max-w-sm text-[clamp(1.1rem,3vw,1.5rem)] font-extrabold leading-snug text-white sm:max-w-md">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="mb-7 max-w-xs text-xs leading-relaxed text-orange-100 sm:mb-8 sm:max-w-sm sm:text-sm">
            Join thousands of patients who have already experienced hassle-free
            healthcare scheduling.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full max-w-xs rounded-md bg-white px-6 py-2.5 text-xs font-semibold text-[#ea651d] transition hover:bg-orange-50 active:scale-95 sm:w-auto sm:max-w-none sm:px-10 sm:py-3 sm:text-sm"
          >
            Schedule Your Visit Today
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
