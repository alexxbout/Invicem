"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

export type JesterMood = "idle" | "laugh";

const GOLD = "#e3c27a";
const RED = "#b3243a";
const VIOLET = "#5b2483";
const INK = "#2a1530";
const SKIN = "#f4e6d2";

/**
 * A little jester bust that lives on the joker card: bells sway and the eyes blink while idle;
 * when played it laughs, head bobbing, bells jingling, eyes squeezed shut.
 */
export function JesterHead({ mood = "idle", className }: { mood?: JesterMood; className?: string }) {
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lobes = ["[data-lobe=l]", "[data-lobe=c]", "[data-lobe=r]"];
      if (mood === "idle") {
        lobes.forEach((sel, i) =>
          gsap.to(sel, { rotation: i === 1 ? 6 : i === 0 ? -7 : 7, duration: 1.6 + i * 0.3, yoyo: true, repeat: -1, ease: "sine.inOut" }),
        );
        gsap.to("[data-head]", { rotation: 3, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap
          .timeline({ repeat: -1, repeatDelay: 2.6 })
          .to("[data-eye]", { scaleY: 0.1, duration: 0.07 })
          .to("[data-eye]", { scaleY: 1, duration: 0.1 });
      } else {
        gsap.set("[data-eye]", { scaleY: 1 });
        lobes.forEach((sel, i) =>
          gsap.fromTo(sel, { rotation: i === 1 ? -10 : -14 }, { rotation: i === 1 ? 10 : 14, duration: 0.12, yoyo: true, repeat: 9, ease: "sine.inOut" }),
        );
        gsap.fromTo("[data-head]", { rotation: -8, y: 0 }, { rotation: 8, y: -3, duration: 0.16, yoyo: true, repeat: 7, ease: "sine.inOut" });
      }
    }, root);
    return () => ctx.revert();
  }, [mood]);

  const laughing = mood === "laugh";

  return (
    <svg ref={root} viewBox="0 0 100 100" className={className} aria-hidden>
      <g data-head style={{ transformOrigin: "50px 70px" }}>
        {/* cap: three floppy points with bells */}
        <g data-lobe="l" style={{ transformOrigin: "40px 42px" }}>
          <path d="M44 42 Q26 12 9 36 Q22 30 39 48 Z" fill={RED} stroke={GOLD} strokeWidth="1.2" />
          <circle cx="9" cy="38" r="4" fill={GOLD} />
        </g>
        <g data-lobe="r" style={{ transformOrigin: "60px 42px" }}>
          <path d="M56 42 Q74 12 91 36 Q78 30 61 48 Z" fill={RED} stroke={GOLD} strokeWidth="1.2" />
          <circle cx="91" cy="38" r="4" fill={GOLD} />
        </g>
        <g data-lobe="c" style={{ transformOrigin: "50px 42px" }}>
          <path d="M42 43 Q44 8 64 9 Q55 20 58 43 Z" fill={VIOLET} stroke={GOLD} strokeWidth="1.2" />
          <circle cx="65" cy="9" r="4" fill={GOLD} />
        </g>
        <rect x="33" y="40" width="34" height="8" rx="3" fill={GOLD} />
        <path d="M41 44l2-2 2 2-2 2zM48 44l2-2 2 2-2 2zM55 44l2-2 2 2-2 2z" fill={RED} />

        {/* face */}
        <ellipse cx="50" cy="61" rx="14" ry="14.5" fill={SKIN} />
        <circle cx="41" cy="65" r="2.8" fill="#e0566a" opacity=".55" />
        <circle cx="59" cy="65" r="2.8" fill="#e0566a" opacity=".55" />
        {laughing ? (
          <>
            <path d="M41 58q3-3 6 0M53 58q3-3 6 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M43 65q7 9 14 0z" fill={INK} />
            <path d="M46 69q4 2 8 0" stroke="#e0566a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse data-eye cx="44" cy="58.5" rx="1.8" ry="2.4" fill={INK} style={{ transformOrigin: "44px 58.5px" }} />
            <ellipse data-eye cx="56" cy="58.5" rx="1.8" ry="2.4" fill={INK} style={{ transformOrigin: "56px 58.5px" }} />
            <path d="M44 66q6 5 12 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* ruff collar */}
        <path
          d="M30 80l5-6 5 6 5-6 5 6 5-6 5 6 5-6 5 6-2 7H32z"
          fill={GOLD}
          stroke={RED}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="83" r="2.2" fill={RED} />
      </g>
    </svg>
  );
}
