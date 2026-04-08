import React from "react";

// Decorative medical cross SVG
const CrossIcon = ({ size = 48, opacity = 0.15, strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity }}
  >
    <rect
      x="18"
      y="4"
      width="12"
      height="40"
      rx="3"
      stroke="white"
      strokeWidth={strokeWidth}
      fill="none"
    />
    <rect
      x="4"
      y="18"
      width="40"
      height="12"
      rx="3"
      stroke="white"
      strokeWidth={strokeWidth}
      fill="none"
    />
  </svg>
);

const HeroSection = () => {
  return (
    <section
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        minHeight: "220px",
        background:
          "linear-gradient(135deg, #0d2060 0%, #1a3aab 40%, #1565c0 70%, #0d47a1 100%)",
      }}
    >
      {/* Decorative crosses — hidden on xs, shown from sm up */}
      <div className="hidden sm:block absolute top-4 left-6 opacity-20">
        <CrossIcon size={36} opacity={1} strokeWidth={2} />
      </div>
      <div className="hidden md:block absolute top-10 left-24 opacity-10">
        <CrossIcon size={56} opacity={1} strokeWidth={1.5} />
      </div>
      <div className="hidden sm:block absolute top-2 left-[38%] opacity-20">
        <CrossIcon size={28} opacity={1} strokeWidth={2} />
      </div>
      <div className="hidden sm:block absolute top-6 right-8 opacity-20">
        <CrossIcon size={60} opacity={1} strokeWidth={1.5} />
      </div>
      <div className="hidden md:block absolute top-3 right-28 opacity-10">
        <CrossIcon size={30} opacity={1} strokeWidth={2} />
      </div>
      <div className="hidden sm:block absolute bottom-4 left-10 opacity-20">
        <CrossIcon size={44} opacity={1} strokeWidth={1.5} />
      </div>
      <div className="hidden sm:block absolute bottom-3 right-16 opacity-10">
        <CrossIcon size={50} opacity={1} strokeWidth={2} />
      </div>
      <div className="hidden md:block absolute bottom-6 right-40 opacity-20">
        <CrossIcon size={28} opacity={1} strokeWidth={2} />
      </div>

      {/* Center glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(30,100,220,0.35) 0%, transparent 70%)",
        }}
      />

      {/* Hero Text */}
      <div className="relative z-10 text-center px-4 py-14">
        <h1
          className="text-white font-extrabold uppercase tracking-widest"
          style={{
            fontSize: "clamp(1.3rem, 4vw, 2rem)",
            letterSpacing: "0.18em",
            textShadow: "0 2px 16px rgba(0,0,0,0.3)",
          }}
        >
          WELCOME STAY HEALTHY, STAY SAFE
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
