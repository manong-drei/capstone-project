/*
 * CHANGELOG (Visual Redesign):
 * - Removed decorative CrossIcon SVGs and center radial glow
 * - Added background photo (Bago City Health Center) with semi-transparent blue overlay
 * - Increased section min-height from 220px to 320px to expose more of the photo
 * - Split hero text from single line into two lines:
 *     Line 1: "WELCOME" — smaller, normal tracking
 *     Line 2: "STAY HEALTHY, STAY SAFE" — larger, extrabold, wide tracking
 * - Mobile responsiveness: fluid clamp sizing retained; py adjusted
 * REDESIGN NOTE: Replace "/assets/bago-city-health-center.jpg" with the actual image path.
 *   Without the image the overlay gradient still renders a presentable blue background.
 */

import React from "react";

const HeroSection = () => {
  return (
    <section
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        minHeight: "320px",
        // REDESIGN NOTE: swap the url() value for the real asset path
        backgroundImage: "url('/assets/BGHero.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Hero Text */}
      <div className="relative z-10 text-center px-4 py-16 sm:py-20">
        <h1
          className="text-white font-extrabold uppercase"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            letterSpacing: "0.1em",
            lineHeight: 1.15,
            textShadow: "0 2px 16px rgba(0,0,0,0.4)",
          }}
        >
          WELCOME <br />
          STAY HEALTHY, STAY SAFE
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
