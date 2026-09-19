import { useEffect, useRef } from "react";
import { ArrowDown, Bell, Check, HeartPulse, ShieldCheck } from "lucide-react";
import PatientHomeTab from "@/components/dashboards/patient/PatientHomeTab";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./cinematic-landing.css";

gsap.registerPlugin(ScrollTrigger);

export function CinematicHero() {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => {
    const media = gsap.matchMedia();

    // Keep the complete page readable on touch screens and with reduced motion.
    media.add("(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)", () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 72px",
          end: () => `+=${window.innerHeight * 2.5}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(".cinematic-intro", { opacity: 0, scale: 1.08, filter: "blur(12px)", duration: 1 })
        .fromTo(cardRef.current, { yPercent: 120, scale: 0.88 }, { yPercent: 0, scale: 1, duration: 1.4, ease: "power3.inOut" }, 0)
        .from(".cinematic-phone-wrap", { y: 100, rotationX: 25, rotationY: -20, opacity: 0, duration: 1.2 }, 0.7)
        .from(".cinematic-card-copy", { y: 30, opacity: 0, stagger: 0.15, duration: 0.8 }, 1.1)
        .from(".cinematic-badge", { y: 25, scale: 0.85, opacity: 0, stagger: 0.15, duration: 0.8 }, 1.5)
        .to({}, { duration: 1 });
    }, containerRef);

    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const card = cardRef.current;
      const rotateX = gsap.quickTo(phoneRef.current, "rotationX", { duration: 0.6 });
      const rotateY = gsap.quickTo(phoneRef.current, "rotationY", { duration: 0.6 });
      const move = (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
        rotateX((0.5 - y / rect.height) * 12);
        rotateY((x / rect.width - 0.5) * 12);
      };
      const reset = () => { rotateX(0); rotateY(0); };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", reset);
      return () => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", reset);
        card.style.removeProperty("--mouse-x");
        card.style.removeProperty("--mouse-y");
      };
    }, containerRef);

    return () => media.revert();
  }, []);

  return (
    <section ref={containerRef} className="cinematic-stage" aria-label="A better healthcare experience">
      <div className="cinematic-intro">
        <p className="cinematic-eyebrow"><span /> BAGO CITY HEALTHCARE FACILITY</p>
        <h1>Less waiting.<br /><span>More living.</span></h1>
        <p className="mx-auto mt-7 max-w-lg text-base leading-relaxed text-blue-50 sm:text-lg">
          Your time matters. Get your queue number, follow your turn,
          and make room for what matters most.
        </p>
        <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#1a3a8f]/60 px-4 py-2 text-xs text-white">
          <HeartPulse size={15} className="text-orange-300" aria-hidden="true" /> Stay healthy. Stay safe.
        </div>
        <div className="cinematic-scroll-cue" aria-hidden="true"><span>SCROLL TO DISCOVER</span><ArrowDown size={17} /></div>
      </div>

      <div ref={cardRef} className="cinematic-card" id="experience">
        <div className="cinematic-sheen" aria-hidden="true" />
        <div className="cinematic-card-grid">
          <div className="cinematic-card-copy cinematic-copy-left">
            <p className="cinematic-eyebrow text-orange-300!">CARE, ON YOUR TERMS</p>
            <h2>Your place in line.<br /><span className="text-blue-200/65">Your day back.</span></h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/70">
              E-KALUSUGAN brings your healthcare visit closer. Follow your queue,
              check doctor schedules, and arrive when it’s time.
            </p>
            <div className="mt-7 flex items-center gap-2 text-xs text-blue-100/75"><ShieldCheck size={16} className="text-orange-300" aria-hidden="true" /> Built around you and your community.</div>
          </div>

          <div className="cinematic-phone-wrap">
            <div ref={phoneRef} className="cinematic-phone" role="img" aria-label="Patient home tab preview with sample data: now serving 05, next in queue 06, queue registration and appointment history. This is an illustration, not a live patient session.">
              <div className="cinematic-phone-screen" aria-hidden="true">
                <div className="cinematic-island" />
                <div className="cinematic-status-bar"><span>9:41</span><span className="tracking-widest">••• ▰</span></div>
                <div className="cinematic-patient-preview" inert>
                  <div className="flex items-center gap-2 bg-[#1e4db7] px-4 py-3 text-white">
                    <img src="/assets/Logo.webp" alt="" className="size-7 rounded-full" />
                    <span className="text-xs font-bold tracking-widest">E-KALUSUGAN</span>
                    <Bell size={16} className="ml-auto" />
                  </div>
                  <PatientHomeTab
                    queueStatus={{ now_serving: "05", next_queuing: "06" }}
                    doctorAvailability={1}
                    hasActiveQueue={false}
                    queue={null}
                    myQueueSubtitle="No active queue"
                  />
                </div>
                <div className="cinematic-home-indicator" />
              </div>
            </div>
            <div className="cinematic-badge cinematic-badge-top" aria-hidden="true"><span className="cinematic-badge-icon"><Bell size={18} /></span><div><strong>Follow your turn</strong><span>Queue updates, in one place.</span></div></div>
            <div className="cinematic-badge cinematic-badge-bottom" aria-hidden="true"><span className="cinematic-badge-icon text-emerald-300!"><Check size={18} /></span><div><strong>Your time, reclaimed.</strong><span>Less time in the waiting room.</span></div></div>
          </div>

          <div className="cinematic-card-copy cinematic-copy-right">
            <span className="cinematic-wordmark">E-KALU<span>SUGAN.</span></span>
            <span className="mt-5 block text-xs leading-6 tracking-wide text-blue-100/60">Healthcare that<br />moves with you.</span>
            <span className="mt-8 inline-block rounded-full border border-white/15 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-blue-100/80">Patient home · Sample data</span>
          </div>
        </div>
      </div>
    </section>
  );
}
