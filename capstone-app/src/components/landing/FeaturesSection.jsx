import React from "react";

/* ── Icons ────────────────────────────────────────────────────────────── */

const BellIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <path
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <circle cx="12" cy="12" r="9" stroke="#e11d48" strokeWidth="2" />
    <path
      d="M12 7v5l3 3"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <circle cx="12" cy="7" r="4" stroke="#e11d48" strokeWidth="2" />
    <path
      d="M4 21c0-4 3.582-7 8-7s8 3 8 7"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="2"
      stroke="#e11d48"
      strokeWidth="2"
    />
    <path
      d="M16 2v4M8 2v4M3 10h18"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="16" r="2.5" stroke="#e11d48" strokeWidth="1.5" />
    <path
      d="M8 15h5"
      stroke="#e11d48"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 18h3"
      stroke="#e11d48"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const UserPlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <circle cx="9" cy="7" r="4" stroke="#e11d48" strokeWidth="2" />
    <path
      d="M3 21c0-4 2.686-7 6-7s6 3 6 7"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19 8v6M16 11h6"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <path
      d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11 4.5-.85 8-5.75 8-11V6l-8-4z"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12l2 2 4-4"
      stroke="#e11d48"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Feature Data ─────────────────────────────────────────────────────── */

const features = [
  {
    icon: <BellIcon />,
    title: "Smart Notifications",
    description: "Get alerted when your turn is coming up.",
  },
  {
    icon: <ClockIcon />,
    title: "Real-Time Updates",
    description: "Track queue position and wait time instantly.",
  },
  {
    icon: <UserIcon />,
    title: "No More Waiting",
    description: "Get your number and come back when ready.",
  },
  {
    icon: <CalendarIcon />,
    title: "Doctor Schedules",
    description: "See availability of your preferred physicians.",
  },
  {
    icon: <UserPlusIcon />,
    title: "Remote Registration",
    description: "Register from the comfort of your home.",
  },
  {
    icon: <ShieldIcon />,
    title: "Data Security",
    description: "Your health information is safe with us.",
  },
];

/* ── Component ────────────────────────────────────────────────────────── */

const FeaturesSection = () => {
  return (
    <section className="w-full bg-gray-50 py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8">
          Why Choose E-KALUSUGAN?
        </h2>

        {/* Cards Grid – 1 col → 2 col → 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Icon circle */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: "#fff0f3", border: "1px solid #fecdd3" }}
              >
                {feature.icon}
              </div>
              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {feature.title}
              </h3>
              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
