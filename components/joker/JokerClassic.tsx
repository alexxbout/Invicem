"use client";

import gsap from "gsap";
import { useEffect, useId, useRef } from "react";

export type DanceMood = "idle" | "play";

const INK = "#1b1020";
const VIOLET = "#4b1f73";
const RED = "#b3243a";
const GOLD = "#e0b54a";
const SKIN = "#f7efe2";

/** a limb drawn as an inked tube: dark outline under a coloured stroke */
function Limb({ d, color, w = 9 }: { d: string; color: string; w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

const Bell = ({ x, y, r = 3.4 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={GOLD} stroke={INK} strokeWidth="1.4" />
    <path d={`M${x - r * 0.5} ${y + r * 0.2}h${r}`} stroke={INK} strokeWidth="1" />
  </g>
);

/**
 * The classic joker: a jester in full figure, inked outlines over flat colour, mid-dance,
 * a marotte raised in one hand and a fan of cards in the other. Idle he sways to a slow beat;
 * played he breaks into a quick jig, marotte waving, bells jingling.
 */
export function DancingJester({ mood = "idle", className }: { mood?: DanceMood; className?: string }) {
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const fast = mood === "play";
      const beat = fast ? 0.22 : 1.1;
      const reps = fast ? 11 : -1;
      const ease = "sine.inOut";
      gsap.fromTo("[data-body]", { y: 0 }, { y: fast ? -7 : -3, duration: beat, yoyo: true, repeat: reps, ease });
      gsap.fromTo("[data-head]", { rotation: -4 }, { rotation: 5, duration: beat * 1.3, yoyo: true, repeat: reps, ease });
      gsap.fromTo("[data-arm=l]", { rotation: -6 }, { rotation: fast ? 16 : 7, duration: beat, yoyo: true, repeat: reps, ease });
      gsap.fromTo("[data-arm=r]", { rotation: 4 }, { rotation: fast ? -12 : -4, duration: beat * 1.2, yoyo: true, repeat: reps, ease });
      gsap.fromTo("[data-leg=kick]", { rotation: -4 }, { rotation: fast ? 18 : 6, duration: beat, yoyo: true, repeat: reps, ease });
      gsap.fromTo("[data-leg=stand]", { rotation: 2 }, { rotation: fast ? -6 : -2, duration: beat, yoyo: true, repeat: reps, ease });
      ["l", "c", "r"].forEach((k, i) =>
        gsap.fromTo(
          `[data-tail=${k}]`,
          { rotation: -4 + i },
          { rotation: (fast ? 10 : 4) * (i === 1 ? -1 : 1), duration: beat * (1 + i * 0.2), yoyo: true, repeat: reps, ease },
        ),
      );
    }, root);
    return () => ctx.revert();
  }, [mood]);

  const o = (x: number, y: number) => ({ transformOrigin: `${x}px ${y}px` });

  return (
    <svg ref={root} viewBox="34 14 156 212" className={className} aria-hidden>
      <g data-body>
        {/* standing leg and curled shoe */}
        <g data-leg="stand" style={o(95, 146)}>
          <Limb d="M95 146 L82 182 L90 216" color={RED} w={14} />
          <path d="M80 214c6 6 18 7 28 2 4-2 6-7 2-9-3-1-5 2-3 4" fill={VIOLET} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <Bell x={107} y={207} r={2.6} />
          <path d="M86 160l3 3-3 3-3-3zM84 190l3 3-3 3-3-3z" fill={GOLD} stroke={INK} strokeWidth="1" />
        </g>
        {/* kicking leg */}
        <g data-leg="kick" style={o(106, 146)}>
          <Limb d="M106 146 L134 170 L163 158" color={VIOLET} w={14} />
          <path d="M160 152c8-2 16 0 20 6 1 4-3 6-6 4-2-2 0-4 2-3" fill={RED} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <Bell x={178} y={161} r={2.6} />
          <path d="M120 158l3 3-3 3-3-3zM148 163l3 3-3 3-3-3z" fill={GOLD} stroke={INK} strokeWidth="1" />
        </g>

        {/* torso, split violet and red, gold buttons and belt */}
        <path d="M84 98Q92 102 100 102V146Q93 146 88 143Z" fill={VIOLET} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M116 98Q108 102 100 102V146Q107 146 112 143Z" fill={RED} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M90 108l4 6-4 6-4-6zM110 108l4 6-4 6-4-6zM92 126l4 6-4 6-4-6zM108 126l4 6-4 6-4-6z" fill={RED} opacity=".55" />
        <path d="M90 108l4 6-4 6-4-6zM92 126l4 6-4 6-4-6z" fill={RED} opacity=".9" />
        <path d="M110 108l4 6-4 6-4-6zM108 126l4 6-4 6-4-6z" fill={VIOLET} opacity=".9" />
        <path d="M100 108l3 4-3 4-3-4zM100 120l3 4-3 4-3-4zM100 132l3 4-3 4-3-4z" fill={GOLD} stroke={INK} strokeWidth="1" />
        <path d="M87 140Q100 146 113 140L112.5 147Q100 152 87.5 147Z" fill={GOLD} stroke={INK} strokeWidth="1.6" />

        {/* arm raising the marotte */}
        <g data-arm="l" style={o(86, 101)}>
          <path d="M44 168L58 64" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M44 168L58 64" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="59" cy="57" r="7" fill={SKIN} stroke={INK} strokeWidth="1.6" />
          <path d="M52 54c1-7 5-11 7-12 2 1 6 5 7 12-4-2-10-2-14 0z" fill={RED} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          <Bell x={59} y={41} r={2.2} />
          <path d="M56 58.5h1.2M61 58.5h1.2M56.5 61.5q2.5 2 5 0" stroke={INK} strokeWidth="1" fill="none" strokeLinecap="round" />
          <Limb d="M86 101 L66 104 L56 86" color={VIOLET} w={11} />
          <circle cx="56" cy="84" r="4.6" fill={SKIN} stroke={INK} strokeWidth="1.6" />
        </g>

        {/* arm holding a fan of cards */}
        <g data-arm="r" style={o(114, 101)}>
          <g transform="translate(150 88)">
            {[-24, -6, 12].map((a, i) => (
              <g key={i} transform={`rotate(${a})`}>
                <rect x="-6" y="-20" width="13" height="18" rx="1.6" fill={SKIN} stroke={INK} strokeWidth="1.3" />
                <path d={i === 1 ? "M0.5-14l2.5 3.5-2.5 3.5-2.5-3.5z" : "M0.5-15c-3 2-3 5 0 7 3-2 3-5 0-7z"} fill={i === 1 ? RED : INK} />
              </g>
            ))}
          </g>
          <Limb d="M114 101 L136 112 L148 94" color={RED} w={11} />
          <circle cx="149" cy="92" r="4.6" fill={SKIN} stroke={INK} strokeWidth="1.6" />
        </g>

        {/* ruff collar */}
        <path
          d="M76 92L84 104L90 94L96 106L100 95L104 106L110 94L116 104L124 92L100 88Z"
          fill={GOLD}
          stroke={INK}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M84 104L90 94L96 106L100 95L104 106L110 94L116 104" fill="none" stroke={RED} strokeWidth="1.2" />

        {/* head and cap */}
        <g data-head style={o(100, 86)}>
          <g data-tail="l" style={o(90, 58)}>
            <path d="M90 60C80 44 64 38 52 46c-4 3-5 9-3 15 3-7 8-9 14-8 10 2 16 6 22 10z" fill={RED} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <Bell x={48} y={63} />
          </g>
          <g data-tail="r" style={o(110, 58)}>
            <path d="M110 60c10-16 26-22 38-14 4 3 5 9 3 15-3-7-8-9-14-8-10 2-16 6-22 10z" fill={VIOLET} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <Bell x={152} y={63} />
          </g>
          <g data-tail="c" style={o(100, 56)}>
            <path d="M93 58c-2-18 4-32 18-38 6-2 12 1 13 6-6-3-11 0-14 5-4 8-5 17-5 27z" fill={GOLD} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <Bell x={125} y={27} />
          </g>
          <path d="M84 62Q100 54 116 62L114 69Q100 62 86 69Z" fill={RED} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M93 63.4l2-2 2 2-2 2zM99 61.5l2-2 2 2-2 2zM105 63.4l2-2 2 2-2 2z" fill={GOLD} />
          <path d="M87 68c-1 12 4 20 13 23 9-3 14-11 13-23-8-4-18-4-26 0z" fill={SKIN} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M90 74q4-3 8 0M102 74q4-3 8 0" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M92.5 75.5q1.5 1 3 0M104.5 75.5q1.5 1 3 0" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M100 76l-1.5 5h2.5" fill="none" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M93 84q7 6 14 0q-7 2-14 0z" fill={RED} stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M107.6 78.5l1.4-1.8 1.4 1.8-1.4 1.8z" fill={RED} />
        </g>
      </g>
    </svg>
  );
}

/** the banner across the foot of the card */
function Ribbon() {
  return (
    <svg viewBox="0 0 200 46" className="absolute bottom-[5%] left-1/2 w-[92%] -translate-x-1/2" aria-hidden>
      <path d="M8 16l18 4v18L8 34l8-9z" fill="#8a1a2c" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M192 16l-18 4v18l18-4-8-9z" fill="#8a1a2c" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M22 10Q100 2 178 10V32Q100 24 22 32Z" fill={RED} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M26 13Q100 5.5 174 13M26 29Q100 21.5 174 29" fill="none" stroke={GOLD} strokeWidth="1" />
      <text x="100" y="24" textAnchor="middle" fill={GOLD} stroke={INK} strokeWidth=".5" fontSize="15" letterSpacing="6" fontFamily="Georgia, serif" fontWeight="bold">
        JOKER
      </text>
    </svg>
  );
}

/**
 * Variant "paper": the old playing-card look, aged ivory with ink.
 * Variant "night": the same figure on violet velvet, gold frame, for the app's dark table.
 */
export function JokerClassic({
  width = 200,
  mood = "idle",
  variant = "paper",
}: {
  width?: number;
  mood?: DanceMood;
  variant?: "paper" | "night";
}) {
  const grain = useId().replace(/:/g, "");
  const paper = variant === "paper";
  return (
    <div
      className="relative overflow-hidden rounded-[7%/5%]"
      style={{
        width,
        aspectRatio: "5 / 7",
        background: paper
          ? "radial-gradient(70% 55% at 50% 45%, #f6ebd2 0%, #ecdcb8 60%, #d8c08e 100%)"
          : "radial-gradient(90% 70% at 50% 42%, #4d1b73 0%, #2a0c42 70%, #1a0629 100%)",
        boxShadow: paper
          ? "inset 0 0 0 1.5px #3a2a1a, inset 0 0 40px rgba(120,80,30,.35), 0 20px 40px -12px rgba(0,0,0,.7)"
          : `inset 0 0 0 1.5px ${GOLD}, 0 20px 40px -12px rgba(0,0,0,.7)`,
      }}
    >
      {paper && (
        <svg className="absolute inset-0 h-full w-full opacity-40 mix-blend-multiply" aria-hidden>
          <filter id={grain}>
            <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7" />
            <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .4  0 0 0 0 .2  0 0 0 .55 0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${grain})`} />
        </svg>
      )}
      <div
        className="absolute inset-[3.5%] rounded-[5%/3.6%] border"
        style={{ borderColor: paper ? "#3a2a1a88" : `${GOLD}aa` }}
      />
      <div className="absolute left-1/2 top-[3.5%] w-[80%] -translate-x-1/2">
        <DancingJester mood={mood} className="w-full" />
      </div>
      <Ribbon />
      <div className="engrave-sheen" />
    </div>
  );
}
