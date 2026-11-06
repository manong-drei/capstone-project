import { useEffect, useRef } from "react";
import { ArrowRight, Bell, Check, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import PatientHomeTab from "@/components/dashboards/patient/PatientHomeTab";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./cinematic-landing.css";

gsap.registerPlugin(ScrollTrigger);

export function CinematicHero({ onClinicInfo }) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => {
    const media = gsap.matchMedia();

    media.add(
      "(min-width: 1024px) and (min-height: 718px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: containerRef.current,
            start: () => `top ${getComputedStyle(containerRef.current).getPropertyValue("--cinematic-nav-height").trim()}`,
            end: () => `+=${window.innerHeight * 2}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.35,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .fromTo(
            cardRef.current,
            { yPercent: 100 },
            { yPercent: 0, duration: 1.4 },
            0,
          )
          .set(".cinematic-intro", { autoAlpha: 0 })
          .from(
            ".cinematic-phone-wrap",
            {
              y: 60,
              opacity: 0,
              duration: 1.2,
            },
            0.7,
          )
          .from(
            ".cinematic-card-copy",
            { y: 30, opacity: 0, stagger: 0.15, duration: 0.8 },
            1.1,
          )
          .from(
            ".cinematic-badge",
            { y: 20, opacity: 0, stagger: 0.15, duration: 0.8 },
            1.5,
          )
          .to({}, { duration: 0.4 });
      },
      containerRef,
    );

    media.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const card = cardRef.current;
        const rotateX = gsap.quickTo(phoneRef.current, "rotationX", {
          duration: 0.6,
        });
        const rotateY = gsap.quickTo(phoneRef.current, "rotationY", {
          duration: 0.6,
        });
        const sheenX = gsap.quickTo(".cinematic-sheen", "x", {
          duration: 0.4,
        });
        const sheenY = gsap.quickTo(".cinematic-sheen", "y", {
          duration: 0.4,
        });
        const move = (event) => {
          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          sheenX(x - rect.width / 2);
          sheenY(y - rect.height * 0.3);
          rotateX((0.5 - y / rect.height) * 12);
          rotateY((x / rect.width - 0.5) * 12);
        };
        const reset = () => {
          rotateX(0);
          rotateY(0);
          sheenX(0);
          sheenY(0);
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", reset);
        return () => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", reset);
        };
      },
      containerRef,
    );

    // Short, narrow, and touch viewports use a reveal without pinning the page.
    media.add(
      "(prefers-reduced-motion: no-preference) and ((width < 1024px) or (height < 718px) or (hover: none) or (not (pointer: fine)))",
      () => {
        gsap.from(".cinematic-intro-copy > *", {
          y: 24,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power2.out",
        });

        const revealTargets = gsap.utils.toArray([
          ".cinematic-card-copy",
          ".cinematic-phone-wrap",
          ".cinematic-badge",
        ]);
        revealTargets.forEach((el) => {
          gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          });
        });
      },
      containerRef,
    );

    return () => media.revert();
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
                      src="/assets/Logo.webp"
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
