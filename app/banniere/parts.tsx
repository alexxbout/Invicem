"use client";

import type { CSSProperties, ReactNode } from "react";

/** shared pieces for the README banner mockups (1280×640 stages) */

export const W = 1280;
export const H = 640;

export function Stage({ children, background }: { children: ReactNode; background: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-black">
      <div className="relative overflow-hidden" style={{ width: W, height: H, background }}>
        {children}
      </div>
    </main>
  );
}

/** a card-sized box placed on the stage */
export function Slot({
  x,
  y,
  w,
  r,
  z = 1,
  origin,
  children,
}: {
  x: number;
  y: number;
  w: number;
  r: number;
  z?: number;
  origin?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        aspectRatio: "5 / 7",
        rotate: `${r}deg`,
        transformOrigin: origin,
        zIndex: z,
        filter: "drop-shadow(0 16px 22px rgba(0,0,0,.6))",
      }}
    >
      {children}
    </div>
  );
}

export function Question({ text, theme, hand = false, size = 15 }: { text: string; theme: string; hand?: boolean; size?: number }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7%/5%] text-[#2a2132]"
      style={{ background: "linear-gradient(165deg, #f8f0e3 0%, #eadcc6 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.7)" }}
    >
      <div className="absolute inset-[3.2%] rounded-[5%/3.6%] border border-[#b8914d]/60" />
      <div className="absolute inset-x-0 top-[11%] text-center text-[8px] uppercase tracking-[0.3em] text-[#8a6a33]">{theme}</div>
      <div
        className={`absolute inset-x-[11%] top-1/2 -translate-y-1/2 text-center leading-snug ${hand ? "hand" : "display"}`}
        style={{ fontSize: hand ? size * 1.3 : size }}
      >
        {text}
      </div>
      <div className="absolute inset-x-0 bottom-[9%] text-center text-[9px] text-[#b8914d]">◆◆◇</div>
    </div>
  );
}

export const GOLD = "url(#bannerGold)";

/** gradient defs every ornament svg points at */
export function GoldDefs() {
  return (
    <svg width="0" height="0" className="absolute">
      <defs>
        <linearGradient id="bannerGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1c2" />
          <stop offset=".35" stopColor="#e0b54a" />
          <stop offset=".7" stopColor="#a77a22" />
          <stop offset="1" stopColor="#f3d27a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** a gilded acanthus scroll; mirror it with scale(-1,1) */
export function Volute({ style, size = 120 }: { style?: CSSProperties; size?: number }) {
  return (
    <svg viewBox="0 0 120 80" width={size} className="absolute" style={style} fill="none" stroke={GOLD} strokeLinecap="round">
      <path d="M4 70 C 20 20, 70 6, 104 24 C 120 34, 112 58, 92 56 C 78 55, 76 40, 88 38 C 96 37, 98 46, 92 48" strokeWidth="3" />
      <path d="M20 62 C 34 36, 58 26, 82 30" strokeWidth="1.4" opacity=".8" />
      <path d="M40 50 c 6 -14 18 -20 30 -18 M52 44 c 2 -8 10 -12 16 -12" strokeWidth="1.2" opacity=".7" />
      <path d="M8 66 c 10 -2 18 2 22 10 M14 58 c 8 -6 18 -6 24 0" strokeWidth="1.6" />
      <circle cx="92" cy="48" r="3" fill={GOLD} stroke="none" />
    </svg>
  );
}

/** a small gilded rosette */
export function Rosette({ x, y, size = 34 }: { x: number; y: number; size?: number }) {
  return (
    <svg viewBox="-20 -20 40 40" width={size} className="absolute" style={{ left: x - size / 2, top: y - size / 2, zIndex: 33 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} rx="5" ry="13" cy="-6" fill={GOLD} opacity=".9" transform={`rotate(${i * 45})`} />
      ))}
      <circle r="6" fill="#8e1b30" stroke={GOLD} strokeWidth="2" />
    </svg>
  );
}

/** a warm glow with fine dust drifting in it */
export function Dust({ count, box, seed = 1 }: { count: number; box: [number, number, number, number]; seed?: number }) {
  // deterministic pseudo-random, so every capture matches
  const rnd = (n: number) => {
    const v = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
    return Math.round((v - Math.floor(v)) * 1000) / 1000;
  };
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const size = 1 + rnd(i * 4) * 2.6;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: box[0] + rnd(i * 4 + 1) * box[2],
              top: box[1] + rnd(i * 4 + 2) * box[3],
              width: size,
              height: size,
              background: "#ffe8b0",
              opacity: 0.25 + rnd(i * 4 + 3) * 0.6,
              boxShadow: `0 0 ${size * 3}px #ffd27a`,
            }}
          />
        );
      })}
    </>
  );
}
