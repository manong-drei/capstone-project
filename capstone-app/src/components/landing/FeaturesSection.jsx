import {
  Bell,
  Clock,
  User,
  CalendarDays,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

/* ── Feature Data ─────────────────────────────────────────────────────── */

const features = [
  {
    Icon: Bell,
    title: "Smart Notifications",
    description: "Get alerted when your turn is coming up.",
  },
  {
    Icon: Clock,
    title: "Real-Time Updates",
    description: "Track queue position and wait time instantly.",
  },
  {
    Icon: User,
    title: "No More Waiting",
    description: "Get your number and come back when ready.",
  },
  {
    Icon: CalendarDays,
    title: "Doctor Schedules",
    description: "See availability of your preferred physicians.",
  },
  {
    Icon: UserPlus,
    title: "Remote Registration",
    description: "Register from the comfort of your home.",
  },
  {
    Icon: ShieldCheck,
    title: "Data Security",
    description: "Your health information is safe with us.",
  },
];

/* ── Component ────────────────────────────────────────────────────────── */

const FeaturesSection = () => {
  return (
    <section className="w-full py-10 sm:py-12 px-4 sm:px-6 bg-[#1E3A8A]">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-white">
          Why Choose E-KALUSUGAN?
        </h2>

        {/* Cards Grid – 1 col → 2 col → 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map(({ Icon, title, description }, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Icon circle */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-blue-50 border border-blue-200">
                <Icon
                  className="w-5 h-5 text-[#1e4db7]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {title}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
