"use client";

import type { ReactNode } from "react";
import { JesterHead, type JesterMood } from "./JesterHead";

const GOLD = "#e3c27a";
const RED = "#9e1c33";

/** a gold filigree curl for card corners, drawn for the top-left corner */
function Flourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <path d="M3 22C3 10 10 3 22 3" />
      <path d="M7 22c0-8 7-15 15-15" opacity=".6" />
      <path d="M22 3c4 0 6 3 4 6s-6 2-6-1 3-4 5-2" />
      <path d="M3 22c0 4 3 6 6 4s2-6-1-6-4 3-2 5" />
      <path d="M11 11l3 3" />
      <circle cx="15.5" cy="15.5" r="1.4" fill={GOLD} />
    </svg>
  );
}

function Corners() {
  return (
    <>
      <Flourish className="absolute left-[5%] top-[4%] w-[22%]" />
      <Flourish className="absolute right-[5%] top-[4%] w-[22%] -scale-x-100" />
      <Flourish className="absolute bottom-[4%] left-[5%] w-[22%] -scale-y-100" />
      <Flourish className="absolute bottom-[4%] right-[5%] w-[22%] -scale-100" />
    </>
  );
}

/** where the light catches the engravings: [left %, top %, delay s] */
const GLINTS: [number, number, number][] = [
  [14, 10, 0],
  [86, 90, 1.1],
  [50, 15, 2.3],
  [30, 62, 0.6],
  [72, 40, 1.8],
];

function Shell({
  children,
  background,
  width,
  shimmer = true,
}: {
  children: ReactNode;
  background: string;
  width: number | string;
  shimmer?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[7%/5%]"
      style={{
        width,
        aspectRatio: "5 / 7",
        background,
        boxShadow: `inset 0 0 0 1.5px ${GOLD}, 0 20px 40px -12px rgba(0,0,0,.7)`,
        containerType: "inline-size",
      }}
    >
      {children}
      {shimmer && (
        <>
          <div className="engrave-sheen" />
          {GLINTS.map(([x, y, delay], i) => (
            <span key={i} className="twinkle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }} />
          ))}
        </>
      )}
    </div>
  );
}

/** A — tarot royal: violet velvet, double gold frame, filigree corners, jester in a red medallion, red ribbon */
export function JokerRoyal({ width = 200, mood = "idle" }: { width?: number; mood?: JesterMood }) {
  return (
    <Shell width={width} background="radial-gradient(120% 90% at 50% 35%, #5a2585 0%, #2a0c42 70%, #1a0629 100%)">
      <div className="absolute inset-[4%] rounded-[5%/3.6%] border" style={{ borderColor: `${GOLD}aa` }} />
      <div className="absolute inset-[6.5%] rounded-[4%/2.8%] border" style={{ borderColor: `${GOLD}55` }} />
      <Corners />
      <div
        className="absolute left-1/2 top-[44%] grid aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
        style={{
          background: `radial-gradient(circle, #c42e47 0%, ${RED} 60%, #5e0f1e 100%)`,
          boxShadow: `0 0 0 2px ${GOLD}, 0 0 0 5px #2a0c42, 0 0 0 6px ${GOLD}88, 0 0 30px 4px ${RED}88`,
        }}
      >
        <JesterHead mood={mood} className="w-[86%]" />
      </div>
      <svg viewBox="0 0 200 40" className="absolute bottom-[10%] left-1/2 w-[86%] -translate-x-1/2" aria-hidden>
        <path d="M6 10h188l-10 10 10 10H6l10-10z" fill={RED} stroke={GOLD} strokeWidth="1.5" />
        <text x="100" y="25" textAnchor="middle" fill={GOLD} fontSize="15" letterSpacing="7" fontFamily="Georgia, serif">
          JOKER
        </text>
      </svg>
    </Shell>
  );
}

const harlequin = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40'><path d='M14 0L28 20 14 40 0 20z' fill='#7d1630'/><path d='M14 0L28 20 14 40 0 20z' fill='none' stroke='#e3c27a' stroke-opacity='.45' stroke-width='.8'/></svg>`,
);

/** B — arlequin: red and violet diamonds under gold lines, a gold cartouche, letters down the corners */
export function JokerHarlequin({ width = 200, mood = "idle" }: { width?: number; mood?: JesterMood }) {
  const letters = "JOKER".split("");
  return (
    <Shell width={width} background={`url("data:image/svg+xml,${harlequin}") center/14% auto, #3b1159`}>
      <div className="absolute inset-[4%] rounded-[5%/3.6%] border-2" style={{ borderColor: GOLD }} />
      <div
        className="absolute left-1/2 top-1/2 grid aspect-[4/5] w-[64%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[50%]"
        style={{
          background: "radial-gradient(circle at 50% 40%, #4c1a70, #22072f)",
          boxShadow: `0 0 0 2px ${GOLD}, 0 0 0 6px #22072f, 0 0 0 7.5px ${GOLD}, 0 12px 30px rgba(0,0,0,.6)`,
        }}
      >
        <JesterHead mood={mood} className="w-[88%]" />
      </div>
      {[false, true].map((flip) => (
        <div
          key={String(flip)}
          className={`absolute flex flex-col items-center leading-[1.05] ${flip ? "bottom-[7%] right-[8%] rotate-180" : "left-[8%] top-[7%]"}`}
          style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "8cqw", textShadow: "0 1px 0 #000" }}
        >
          {letters.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      ))}
    </Shell>
  );
}

/** C — art déco: violet with a gold sunburst, a red arch, stepped gold frame, the name in tall capitals */
export function JokerDeco({ width = 200, mood = "idle" }: { width?: number; mood?: JesterMood }) {
  return (
    <Shell
      width={width}
      background={`repeating-conic-gradient(from 0deg at 50% 42%, ${GOLD}22 0deg 4deg, transparent 4deg 12deg), radial-gradient(90% 70% at 50% 42%, #4d1b73, #1f0832)`}
    >
      <div
        className="absolute inset-[4%]"
        style={{
          border: `1.5px solid ${GOLD}`,
          clipPath: "polygon(6% 0,94% 0,100% 4%,100% 96%,94% 100%,6% 100%,0 96%,0 4%)",
        }}
      />
      <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M18 104V52a32 32 0 0 1 64 0v52" fill="none" stroke={RED} strokeWidth="7" />
        <path d="M18 104V52a32 32 0 0 1 64 0v52" fill="none" stroke={GOLD} strokeWidth="1.2" />
        <path d="M11 104V52a39 39 0 0 1 78 0v52" fill="none" stroke={GOLD} strokeWidth=".6" opacity=".7" />
        <path d="M14 112h72M22 117h56" stroke={GOLD} strokeWidth=".8" />
        <path d="M50 6l3 5-3 5-3-5z" fill={GOLD} />
      </svg>
      <div className="absolute left-1/2 top-[40%] w-[56%] -translate-x-1/2 -translate-y-1/2">
        <JesterHead mood={mood} className="w-full" />
      </div>
      <div
        className="absolute bottom-[9%] left-0 right-0 text-center"
        style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "11cqw", letterSpacing: "0.32em", paddingLeft: "0.32em" }}
      >
        JOKER
      </div>
    </Shell>
  );
}

/** the back every joker shares while held: violet, gold lattice, a red seal */
export function JokerBack({ width = 60 }: { width?: number | string }) {
  return (
    <Shell
      width={width}
      shimmer={false}
      background={`repeating-linear-gradient(45deg, ${GOLD}33 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, ${GOLD}33 0 1px, transparent 1px 9px), #3a1258`}
    >
      <div className="absolute inset-[7%] rounded-[5%/3.6%] border" style={{ borderColor: `${GOLD}aa` }} />
      <div
        className="absolute left-1/2 top-1/2 aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: RED, boxShadow: `0 0 0 1.5px ${GOLD}` }}
      >
        <JesterHead className="h-full w-full" />
      </div>
    </Shell>
  );
}
