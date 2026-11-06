import { useEffect, useRef } from "react";
import { ArrowRight, Bell, Check, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import PatientHomeTab from "@/components/dashboards/patient/PatientHomeTab";
import "./cinematic-landing.css";

export function CinematicHero({ onClinicInfo }) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let disposed = false;
    let cleanup;

    async function enableMotion() {
      if (!motion.matches || cleanup) return;
      try {
        const { animateCinematicHero } = await import("./cinematic-hero-motion");
        if (!disposed && motion.matches && !cleanup) {
          cleanup = animateCinematicHero(containerRef.current, cardRef.current, phoneRef.current);
        }
      } catch (error) {
        console.warn("Could not load landing page animations.", error);
      }
    }

    void enableMotion();
    motion.addEventListener("change", enableMotion);
    return () => {
      disposed = true;
      motion.removeEventListener("change", enableMotion);
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="cinematic-stage"
      aria-label="Public dental services and E-Kalusugan"
    >
      <div className="cinematic-intro">
        <div className="cinematic-shell cinematic-intro-layout">
          <div className="cinematic-intro-copy">
            <p className="cinematic-intro-label">Public dental services</p>
            <h1>Dental care for <span>the people of Bago.</span></h1>
            <p className="cinematic-intro-description">
              Get your dental queue ticket, check dentist availability, and
              follow your turn with E-Kalusugan. A simpler clinic visit starts here.
            </p>
            <div className="cinematic-intro-actions">
              <Link to={ROUTES.LOGIN} className="cinematic-clinic-button cinematic-dental-button">
                Get a queue ticket <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className="cinematic-clinic-button cinematic-visit-button">How it works</a>
            </div>
            <div className="cinematic-clinic-links">
              <button type="button" className="cinematic-clinic-button cinematic-dental-button" aria-haspopup="dialog" onClick={() => onClinicInfo("dental")}>
                Explore dental services <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button type="button" className="cinematic-clinic-button cinematic-visit-button" aria-haspopup="dialog" onClick={() => onClinicInfo("visit")}>
                <MapPin size={16} aria-hidden="true" /> Plan your visit
              </button>
              <button type="button" className="cinematic-clinic-button cinematic-visit-button" aria-haspopup="dialog" onClick={() => onClinicInfo("oral")}>
                Oral Health
              </button>
            </div>
          </div>
          <p className="cinematic-photo-caption">
            <MapPin size={14} aria-hidden="true" /> Bago City Health Center · Brgy. Poblacion
          </p>
        </div>
      </div>

      <div ref={cardRef} className="cinematic-card" id="experience">
        <div className="cinematic-sheen" aria-hidden="true" />
        <div className="cinematic-card-grid">
          <div className="cinematic-card-copy cinematic-copy-left">
            <p className="cinematic-eyebrow text-orange-300!">
              CARE, ON YOUR TERMS
            </p>
            <h2>
              Your place in line.
              <br />
              <span className="text-blue-200">Your day back.</span>
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Your dental queue, right on your phone. Check today's dentist
              availability, follow your ticket, and stay nearby for your turn.
            </p>
            <div className="mt-7 flex items-center gap-2 text-xs text-blue-100/75">
              <ShieldCheck
                size={16}
                className="text-orange-300"
                aria-hidden="true"
              />{" "}
              Built around you and your community.
            </div>
          </div>

          <div className="cinematic-phone-wrap">
            <div
              ref={phoneRef}
              className="cinematic-phone"
              role="img"
              aria-label="Patient home tab preview with sample data: now serving 05, next in queue 06, queue registration and appointment history. This is an illustration, not a live patient session."
            >
              <div className="cinematic-phone-screen" aria-hidden="true">
                <div className="cinematic-island" />
                <div className="cinematic-status-bar">
                  <span>9:41</span>
                  <span className="tracking-widest">••• ▰</span>
                </div>
                <div className="cinematic-patient-preview" inert>
                  <div className="flex items-center gap-2 bg-[#1e4db7] px-4 py-3 text-white">
                    <img
                      src="/assets/ekalusugan-logo-small.webp"
                      alt="logo"
                      className="size-7 rounded-full"
                    />
                    <span className="text-xs font-bold tracking-widest">
                      E-KALUSUGAN
                    </span>
                  </div>
                  <PatientHomeTab
                    queueStatus={{ now_serving: "05", next_queuing: "06" }}
                    doctorAvailability={1}
                    hasActiveQueue={false}
                    queue={null}
                  />
                </div>
                <div className="cinematic-home-indicator" />
              </div>
            </div>
            <div
              className="cinematic-badge cinematic-badge-top"
              aria-hidden="true"
            >
              <span className="cinematic-badge-icon">
                <Bell size={18} />
              </span>
              <div>
                <strong>Follow your turn</strong>
                <span>Queue updates, in one place.</span>
              </div>
            </div>
            <div
              className="cinematic-badge cinematic-badge-bottom"
              aria-hidden="true"
            >
              <span className="cinematic-badge-icon">
                <Check size={18} />
              </span>
              <div>
                <strong>Your time, reclaimed.</strong>
                <span>Less time in the waiting room.</span>
              </div>
            </div>
          </div>

          <div className="cinematic-card-copy cinematic-copy-right">
            <span className="cinematic-wordmark">
              E-KALU<span>SUGAN.</span>
            </span>
            <span className="mt-5 block text-xs leading-6 tracking-wide text-blue-100/60">
              Healthcare that
              <br />
              moves with you.
            </span>
            <span className="mt-8 inline-block rounded-full border border-white/15 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-blue-100/80">
              Patient home · Sample data
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
