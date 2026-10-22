"use client";

import gsap from "gsap";
import { useEffect, useId, useRef } from "react";

/** "laugh" is the played state: a slow knowing tilt, a wink and a wider smirk */
export type JesterMood = "idle" | "laugh";

const GOLD = "#e3c27a";
const RED = "#8e1b30";
const NIGHT = "#1a0828";

/**
 * The joker as an engraved gold line portrait behind a red domino mask: a narrow face, an
 * almond gaze, a crooked smile, a diamond under the eye, a cap whose long tails end in bells.
 * Idle, the tails drift and the eyes glance aside; played, the head tilts and he winks.
 */
export function JesterHead({ mood = "idle", className }: { mood?: JesterMood; className?: string }) {
  const root = useRef<SVGSVGElement>(null);
  const shine = `shine${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tails = ["[data-tail=l]", "[data-tail=c]", "[data-tail=r]"];
      // a glint of light running along the gold line work
      gsap.fromTo(
        "[data-shine]",
        { attr: { x1: -60, x2: -20 } },
        { attr: { x1: 120, x2: 160 }, duration: 2.6, repeat: -1, repeatDelay: 1.6, ease: "sine.inOut" },
      );
      if (mood === "idle") {
        tails.forEach((sel, i) =>
          gsap.to(sel, { rotation: [-3, 2.5, 3][i], duration: 3 + i * 0.6, yoyo: true, repeat: -1, ease: "sine.inOut" }),
        );
        // a slow sideways glance now and then
        gsap
          .timeline({ repeat: -1, repeatDelay: 2.2 })
          .to("[data-pupil]", { x: 1.4, duration: 0.5, ease: "power2.inOut" })
          .to("[data-pupil]", { x: 1.4, duration: 1.2 })
          .to("[data-pupil]", { x: 0, duration: 0.6, ease: "power2.inOut" });
        gsap.fromTo("[data-glint]", { opacity: 0 }, { opacity: 1, duration: 0.25, yoyo: true, repeat: -1, repeatDelay: 3.4 });
      } else {
        gsap.to("[data-face]", { rotation: -7, duration: 0.6, ease: "power3.out" });
        gsap.to("[data-wink]", { scaleY: 0.12, duration: 0.12, delay: 0.35, yoyo: true, repeat: 1, repeatDelay: 0.45 });
        tails.forEach((sel, i) =>
          gsap.fromTo(sel, { rotation: [-6, 5, 6][i] }, { rotation: [4, -4, -4][i], duration: 0.22, yoyo: true, repeat: 5, ease: "sine.inOut" }),
        );
      }
    }, root);
    return () => ctx.revert();
  }, [mood]);

  const played = mood === "laugh";
  const line = { stroke: `url(#${shine})`, strokeWidth: 1.1, strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <svg ref={root} viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <linearGradient data-shine id={shine} gradientUnits="userSpaceOnUse" x1="-60" y1="0" x2="-20" y2="30">
          <stop offset="0" stopColor={GOLD} />
          <stop offset=".5" stopColor="#fff4d6" />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <g data-face style={{ transformOrigin: "50px 62px" }}>
        {/* cap: three long tails, each ending in a small bell */}
        <g data-tail="l" style={{ transformOrigin: "40px 40px" }}>
          <path d="M41 40C33 26 20 22 12 30c-3 3-4 8-2 13 2-6 6-9 11-8 8 1 13 5 17 8z" fill={RED} {...line} />
          <path d="M14 31c4-2 10-1 15 3" fill="none" {...line} strokeWidth={0.6} opacity={0.7} />
          <circle cx="10" cy="45" r="2.2" fill={NIGHT} {...line} />
        </g>
        <g data-tail="r" style={{ transformOrigin: "60px 40px" }}>
          <path d="M59 40c8-14 21-18 29-10 3 3 4 8 2 13-2-6-6-9-11-8-8 1-13 5-17 8z" fill={RED} {...line} />
          <path d="M86 31c-4-2-10-1-15 3" fill="none" {...line} strokeWidth={0.6} opacity={0.7} />
          <circle cx="90" cy="45" r="2.2" fill={NIGHT} {...line} />
        </g>
        <g data-tail="c" style={{ transformOrigin: "50px 38px" }}>
          <path d="M44 39c-1-14 4-25 14-30 5-2 10 0 12 4-5-2-9 0-11 4-3 6-3 14-3 22z" fill="#3d1660" {...line} />
          <circle cx="70.5" cy="13" r="2.2" fill={NIGHT} {...line} />
        </g>
        <path d="M33 42c11-6 23-6 34 0" fill="none" {...line} strokeWidth={2.4} />
        <path d="M43 39.2l1.4-1.4 1.4 1.4-1.4 1.4zM48.6 38.1l1.4-1.4 1.4 1.4-1.4 1.4zM54.2 39.2l1.4-1.4 1.4 1.4-1.4 1.4z" fill={NIGHT} />

        {/* face: narrow, pointed chin */}
        <path d="M35.5 44c-.6 15 4 27 14.5 37 10.5-10 15.1-22 14.5-37" fill={NIGHT} {...line} />
        {/* domino mask */}
        <path
          d="M35 50.5c4-5 10-5 15-1.4 5-3.6 11-3.6 15 1.4-1 5-4.5 7.2-8.5 7-3 0-5-1.4-6.5-3-1.5 1.6-3.5 3-6.5 3-4 .2-7.5-2-8.5-7z"
          fill={RED}
          {...line}
        />
        {/* almond eyes */}
        <path d="M39 52.4c2.4-2.2 5.6-2.2 8 0-2.4 1.8-5.6 1.8-8 0z" fill="#f2e6cf" />
        <g data-wink style={{ transformOrigin: "57px 52.4px" }}>
          <path d="M53 52.4c2.4-2.2 5.6-2.2 8 0-2.4 1.8-5.6 1.8-8 0z" fill="#f2e6cf" />
          <circle data-pupil cx="57" cy="52.4" r="1.25" fill={NIGHT} />
        </g>
        <circle data-pupil cx="43" cy="52.4" r="1.25" fill={NIGHT} />
        <circle data-glint cx="43.6" cy="51.9" r=".4" fill="#fff" />
        {/* brows, raised on one side */}
        <path d="M38.5 47.6c2.6-1.6 5.6-1.8 8.4-.6M53.2 46.4c2.8-1.6 6-1.4 8.6.4" fill="none" {...line} strokeWidth={0.9} />
        {/* nose, diamond tear, crooked smile */}
        <path d="M50 55.5l-1.6 7.5c1 .6 2.2.6 3.3.2" fill="none" {...line} strokeWidth={0.8} />
        <path d="M58 60.5l1.3-1.6 1.3 1.6-1.3 1.6z" fill={RED} stroke={GOLD} strokeWidth={0.5} />
        <path
          d={played ? "M42.5 68.5c4 4.2 10.5 4 15.5-1.8" : "M43.5 69.4c3.6 2 8.6 1.6 13-1.6"}
          fill="none"
          {...line}
          strokeWidth={1}
        />
        <path d={played ? "M57.6 66.4l1.4-.9" : "M56.2 67.6l1.2-.7"} fill="none" {...line} strokeWidth={0.9} />

        {/* high collar */}
        <path d="M33 79l9 7 8-6 8 6 9-7" fill="none" {...line} />
        <path d="M37 83l5 6 8-4 8 4 5-6" fill="none" {...line} strokeWidth={0.7} opacity={0.7} />
      </g>
    </svg>
  );
}
