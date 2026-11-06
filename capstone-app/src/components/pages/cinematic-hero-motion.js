import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function animateCinematicHero(container, card, phone) {
  const media = gsap.matchMedia();

  media.add(
    "(min-width: 1024px) and (min-height: 718px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    () => {
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: container,
          start: () => `top ${getComputedStyle(container).getPropertyValue("--cinematic-nav-height").trim()}`,
          end: () => `+=${window.innerHeight * 2}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.35,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .fromTo(
          card,
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
    container,
  );

  media.add(
    "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    () => {
      const rotateX = gsap.quickTo(phone, "rotationX", {
        duration: 0.6,
      });
      const rotateY = gsap.quickTo(phone, "rotationY", {
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
    container,
  );

  // Short, narrow, and touch viewports use a reveal without pinning the page.
  media.add(
    "(prefers-reduced-motion: no-preference) and ((width < 1024px) or (height < 718px) or (hover: none) or (not (pointer: fine)))",
    () => {
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
    container,
  );

  return () => media.revert();
}
