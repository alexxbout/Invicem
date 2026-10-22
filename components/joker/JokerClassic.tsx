"use client";

import gsap from "gsap";
import { useEffect, useId, useImperativeHandle, useRef, type Ref } from "react";
import { reduced } from "@/lib/feel";
import { JesterFigure, type DanceMood } from "./JesterFigure";

export type { DanceMood };

const GOLD = "#e0b54a";
const RED = "#b3243a";
const RED_DARK = "#7a1426";
const VIOLET = "#4b1f73";
const PERSPECTIVE = 900;

/**
 * Depth of each layer in px. The layers are pushed back or forward in real 3D and
 * counter-scaled so the card looks flat at rest; tilting it reveals the depth.
 */
const DEPTH = { bg: 0, pattern: 6, rosette: 16, frame: 26, figure: 44, ribbon: 58, glints: 70 } as const;
type LayerKey = keyof typeof DEPTH;

const fit = (z: number) => (PERSPECTIVE - z) / PERSPECTIVE;

/** filigree for one corner (top-left), engraved: thick gold under fine ink, acanthus leaves, a gem */
export function Corner({ c, gold }: { c: string; gold: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path data-draw pathLength={1} d="M0 58C0 25 25 0 58 0" stroke={gold} strokeWidth="3.6" />
      <path d="M0 58C0 25 25 0 58 0" stroke={c} strokeWidth=".7" />
      <path data-draw pathLength={1} d="M8 50C10 26 26 10 50 8" stroke={c} strokeWidth="1" />
      <path data-draw pathLength={1} d="M13 46C16 29 29 16 46 13" stroke={RED} strokeWidth=".7" strokeDasharray="0.1 3.2" />
      {/* curls at both ends */}
      <path data-draw pathLength={1} d="M58 0c11 0 17 8 11 16s-16 5-15-2 7-10 12-6" stroke={gold} strokeWidth="2.6" />
      <path d="M58 0c11 0 17 8 11 16s-16 5-15-2 7-10 12-6" stroke={c} strokeWidth=".5" />
      <path data-draw pathLength={1} d="M0 58c0 11 8 17 16 11s5-16-2-15-10 7-6 12" stroke={gold} strokeWidth="2.6" />
      <path d="M0 58c0 11 8 17 16 11s5-16-2-15-10 7-6 12" stroke={c} strokeWidth=".5" />
      {/* acanthus leaves, filled so their width swells and tapers */}
      <g className="leaf-sway">
        <path d="M21 21c9-7 20-7 25 2-9 3-17 3-25-2z" fill={gold} stroke={c} strokeWidth=".6" />
        <path d="M23 22c7-2 14-1 19 2" stroke={c} strokeWidth=".45" />
        <path d="M21 21c-7 9-7 20 2 25 3-9 3-17-2-25z" fill={gold} stroke={c} strokeWidth=".6" />
        <path d="M22 23c-2 7-1 14 2 19" stroke={c} strokeWidth=".45" />
        <path d="M30 14c5-4 11-3 13 1-5 2-9 1-13-1zM14 30c-4 5-3 11 1 13 2-5 1-9-1-13z" fill={VIOLET} stroke={c} strokeWidth=".5" />
      </g>
      <path d="M36 36c10 2 16 10 18 20M36 36c2 10 10 16 20 18" stroke={RED} strokeWidth="1.2" />
      <path d="M36 36c10 2 16 10 18 20M36 36c2 10 10 16 20 18" stroke={gold} strokeWidth=".4" />
      {/* gem with a moving glint */}
      <circle cx="19" cy="19" r="4.6" fill={RED} stroke={gold} strokeWidth="1.8" />
      <circle cx="19" cy="19" r="2.4" fill="#d9475f" />
      <circle className="gem-glint" cx="17.4" cy="17.4" r="1.2" fill="#fff" />
      {[
        [30, 5.6],
        [5.6, 30],
        [44, 3],
        [3, 44],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i < 2 ? 1.5 : 1} fill={gold} stroke={c} strokeWidth=".3" />
      ))}
      <circle cx="67" cy="14" r="2" fill={VIOLET} stroke={gold} strokeWidth=".8" />
      <circle cx="14" cy="67" r="2" fill={VIOLET} stroke={gold} strokeWidth=".8" />
    </g>
  );
}

/** a vine running along a side: thick gilded stem, swaying leaves, red berries */
export function Vine({ c, gold }: { c: string; gold: string }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path data-draw pathLength={1} d="M0 0C10 14 -8 28 0 42S10 70 0 84" stroke={gold} strokeWidth="2.4" />
      <path d="M0 0C10 14 -8 28 0 42S10 70 0 84" stroke={c} strokeWidth=".5" />
      {[10, 30, 52, 72].map((y, i) => (
        <g key={y} className="leaf-sway" style={{ animationDelay: `${i * 0.6}s` }}>
          <path
            d={i % 2 ? `M1 ${y}c7-5 13-3 14 3-7 3-12 1-14-3z` : `M-1 ${y}c-7-5-13-3-14 3 7 3 12 1 14-3z`}
            fill={gold}
            stroke={c}
            strokeWidth=".6"
          />
          <path d={i % 2 ? `M2 ${y + 0.4}c4-1.6 8-1 11 1.4` : `M-2 ${y + 0.4}c-4-1.6-8-1-11 1.4`} stroke={c} strokeWidth=".4" />
        </g>
      ))}
      {[20, 41, 62].map((y, i) => (
        <circle key={y} cx={i % 2 ? -4 : 4} cy={y} r="1.6" fill={RED} stroke={c} strokeWidth=".4" />
      ))}
    </g>
  );
}

/** the playing-card index: J over a small jester cap */
function Index({ c }: { c: string }) {
  return (
    <g>
      <text x="0" y="0" textAnchor="middle" fontSize="20" fontFamily="Georgia, serif" fill={RED} stroke={c} strokeWidth=".4">
        J
      </text>
      <path d="M-7 12c-1-5-4-7-7-7 3-2 6-1 8 2 1-4 3-7 6-8 3 1 5 4 6 8 2-3 5-4 8-2-3 0-6 2-7 7z" fill={RED} stroke={c} strokeWidth=".8" />
      <path d="M-8 12h16v2.6h-16z" fill={GOLD} stroke={c} strokeWidth=".6" />
    </g>
  );
}

export type JokerHandle = {
  /** layers drop in one after another and the frame draws itself */
  assemble: () => gsap.core.Timeline;
  /** the played moment: layers spread apart in depth, then snap back */
  burst: () => gsap.core.Timeline;
};

/**
 * The joker card, built from stacked layers: aged paper (or night velvet), a faint harlequin
 * lattice, a sunburst rosette, an ornate frame with filigree corners, vines and indices, the
 * dancing jester, the ribbon, and glints on top. Tilt it (finger, pointer or phone) to see
 * the layers part; it also sways slightly on its own so the depth is never flat.
 */
export function JokerClassic({
  width = 200,
  mood = "idle",
  variant = "paper",
  intro = false,
  handle,
}: {
  /** px, or any CSS width */
  width?: number | string;
  mood?: DanceMood;
  variant?: "paper" | "night";
  /** play the assembly animation when mounted */
  intro?: boolean;
  handle?: Ref<JokerHandle>;
}) {
  const uid = useId().replace(/:/g, "");
  const gold = `gold${uid}`;
  const swayRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const quick = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);
  const paper = variant === "paper";
  const line = paper ? "#3a2a1a" : GOLD;

  /** layers in stacking order, found by their data-layer attribute */
  const all = () =>
    (Object.keys(DEPTH) as LayerKey[]).flatMap((k) => {
      const el = tiltRef.current?.querySelector<HTMLElement>(`[data-layer="${k}"]`);
      return el ? [[k, el] as const] : [];
    });

  const assemble = () => {
    const tl = gsap.timeline();
    const draws = tiltRef.current?.querySelectorAll("[data-draw]") ?? [];
    tl.set(draws, { strokeDasharray: 1, strokeDashoffset: 1 });
    all().forEach(([k, el], i) => {
      const z = DEPTH[k];
      tl.fromTo(
        el,
        { z: z + 260, rotationX: 28, opacity: 0, scale: fit(z) * 1.1 },
        { z, rotationX: 0, opacity: 1, scale: fit(z), duration: 0.9, ease: "power3.out" },
        i * 0.13,
      );
    });
    tl.to(draws, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.015 }, 0.35);
    const ribbon = tiltRef.current?.querySelector('[data-layer="ribbon"] > svg');
    if (ribbon) tl.fromTo(ribbon, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "back.out(1.6)" }, 0.8);
    return tl;
  };

  const burst = () => {
    const tl = gsap.timeline();
    all().forEach(([k, el]) => {
      const z = DEPTH[k];
      tl.to(el, { z: z * 2.8, duration: 0.35, ease: "power2.out" }, 0).to(el, { z, duration: 0.9, ease: "elastic.out(1, 0.45)" }, 0.35);
    });
    return tl;
  };

  useImperativeHandle(handle, () => ({ assemble, burst }));

  useEffect(() => {
    all().forEach(([k, el]) => gsap.set(el, { z: DEPTH[k], scale: fit(DEPTH[k]) }));
    quick.current = {
      x: gsap.quickTo(tiltRef.current, "rotationX", { duration: 0.8, ease: "power3" }),
      y: gsap.quickTo(tiltRef.current, "rotationY", { duration: 0.8, ease: "power3" }),
    };
    if (reduced()) return;
    // light running round the gilding
    const shimmer = gsap.fromTo(`#${gold}`, { attr: { x1: 0, x2: 250 } }, { attr: { x1: 250, x2: 500 }, duration: 5, repeat: -1, ease: "none" });
    // a slow figure-of-eight so the layers part even when nobody touches the card
    const sway = gsap.timeline({ repeat: -1, yoyo: true });
    sway
      .to(swayRef.current, { rotationY: 7, rotationX: -3, duration: 3.2, ease: "sine.inOut" })
      .to(swayRef.current, { rotationY: -7, rotationX: 3, duration: 3.2, ease: "sine.inOut" });
    const opening = intro ? assemble() : null;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      quick.current?.y(Math.max(-16, Math.min(16, e.gamma * 0.5)));
      quick.current?.x(Math.max(-12, Math.min(12, -(e.beta - 45) * 0.4)));
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      sway.kill();
      shimmer.kill();
      opening?.kill();
      window.removeEventListener("deviceorientation", onTilt);
    };
    // mount-only: layers and handlers are set once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    quick.current?.y(((e.clientX - r.left) / r.width - 0.5) * 30);
    quick.current?.x(-((e.clientY - r.top) / r.height - 0.5) * 24);
  };
  const onLeave = () => {
    quick.current?.x(0);
    quick.current?.y(0);
  };

  const layer = "absolute inset-0";
  const grain = `grain${uid}`;

  return (
    <div style={{ width, aspectRatio: "5 / 7", perspective: PERSPECTIVE }} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={swayRef} className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        <div ref={tiltRef} className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
          {/* 0 · paper or velvet */}
          <div
            data-layer="bg"
            className={`${layer} overflow-hidden rounded-[7%/5%]`}
            style={{
              background: paper
                ? "radial-gradient(70% 55% at 50% 45%, #f7edd6 0%, #ecdcb8 60%, #d5bb86 100%)"
                : "radial-gradient(90% 70% at 50% 42%, #4d1b73 0%, #2a0c42 70%, #1a0629 100%)",
              boxShadow: paper
                ? "inset 0 0 0 1.5px #3a2a1a, inset 0 0 50px rgba(120,80,30,.4), 0 24px 44px -14px rgba(0,0,0,.75)"
                : `inset 0 0 0 1.5px ${GOLD}, 0 24px 44px -14px rgba(0,0,0,.75)`,
            }}
          >
            {paper && (
              <svg className="absolute inset-0 h-full w-full opacity-45 mix-blend-multiply" aria-hidden>
                <filter id={grain}>
                  <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="4" seed="11" />
                  <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .4  0 0 0 0 .2  0 0 0 .6 0" />
                </filter>
                <rect width="100%" height="100%" filter={`url(#${grain})`} />
              </svg>
            )}
          </div>

          {/* 1 · faint harlequin lattice */}
          <div data-layer="pattern" className={`${layer} overflow-hidden rounded-[7%/5%]`}>
            <svg viewBox="0 0 250 350" className="h-full w-full" aria-hidden>
              <defs>
                <pattern id={`lat${uid}`} width="22" height="32" patternUnits="userSpaceOnUse">
                  <path d="M11 0L22 16 11 32 0 16z" fill="none" stroke={line} strokeWidth=".5" opacity=".18" />
                  <circle cx="11" cy="16" r=".9" fill={line} opacity=".18" />
                </pattern>
              </defs>
              <rect x="20" y="20" width="210" height="310" fill={`url(#lat${uid})`} />
            </svg>
          </div>

          {/* 2 · sunburst rosette behind the figure */}
          <div data-layer="rosette" className={layer}>
            <svg viewBox="0 0 250 350" className="h-full w-full" aria-hidden>
              <g className="joker-rosette" style={{ transformOrigin: "125px 160px" }}>
                {Array.from({ length: 48 }, (_, i) => {
                  const a = (i / 48) * Math.PI * 2;
                  const r1 = i % 2 ? 66 : 58;
                  return (
                    <path
                      key={i}
                      d={`M${(125 + Math.cos(a) * r1).toFixed(1)} ${(160 + Math.sin(a) * r1).toFixed(1)}L${(125 + Math.cos(a) * 96).toFixed(1)} ${(160 + Math.sin(a) * 96).toFixed(1)}`}
                      stroke={i % 4 === 0 ? RED : line}
                      strokeWidth={i % 4 === 0 ? 1.4 : 0.6}
                      opacity={paper ? 0.55 : 0.7}
                    />
                  );
                })}
              </g>
              <circle cx="125" cy="160" r="98" fill="none" stroke={line} strokeWidth="1.4" opacity=".7" />
              <circle cx="125" cy="160" r="102" fill="none" stroke={GOLD} strokeWidth="2.4" opacity=".75" />
              <circle cx="125" cy="160" r="106" fill="none" stroke={line} strokeWidth=".6" strokeDasharray="1.5 3" opacity=".7" />
              <circle cx="125" cy="160" r="56" fill={paper ? "#f3e4c2" : "#3a1558"} stroke={line} strokeWidth=".8" opacity=".9" />
            </svg>
          </div>

          {/* 3 · ornate frame */}
          <div data-layer="frame" className={layer}>
            <svg viewBox="0 0 250 350" className="h-full w-full" aria-hidden>
              <defs>
                <linearGradient id={gold} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="250" y2="120" spreadMethod="repeat">
                  <stop offset="0" stopColor="#8a6418" />
                  <stop offset=".3" stopColor="#e0b54a" />
                  <stop offset=".5" stopColor="#fff1c2" />
                  <stop offset=".7" stopColor="#e0b54a" />
                  <stop offset="1" stopColor="#8a6418" />
                </linearGradient>
              </defs>
              <rect data-draw pathLength={1} x="8" y="8" width="234" height="334" rx="13" fill="none" stroke={line} strokeWidth="2.4" />
              <rect data-draw pathLength={1} x="13" y="13" width="224" height="324" rx="10" fill="none" stroke={`url(#${gold})`} strokeWidth="3.4" />
              <rect x="13" y="13" width="224" height="324" rx="10" fill="none" stroke={line} strokeWidth=".5" />
              <rect x="17.5" y="17.5" width="215" height="315" rx="8" fill="none" stroke={RED} strokeWidth=".9" />
              <rect x="20.5" y="20.5" width="209" height="309" rx="7" fill="none" stroke={line} strokeWidth=".8" strokeDasharray="0.1 3.4" strokeLinecap="round" />
              <g transform="translate(20 20)">
                <Corner c={line} gold={`url(#${gold})`} />
              </g>
              <g transform="translate(230 20) scale(-1 1)">
                <Corner c={line} gold={`url(#${gold})`} />
              </g>
              <g transform="translate(20 330) scale(1 -1)">
                <Corner c={line} gold={`url(#${gold})`} />
              </g>
              <g transform="translate(230 330) scale(-1 -1)">
                <Corner c={line} gold={`url(#${gold})`} />
              </g>
              <g transform="translate(24 133)">
                <Vine c={line} gold={`url(#${gold})`} />
              </g>
              <g transform="translate(226 133) scale(-1 1)">
                <Vine c={line} gold={`url(#${gold})`} />
              </g>
              {/* top crest: gilded scrolls, a red fleuron, violet petals, a gem */}
              <g transform="translate(125 21)">
                {[1, -1].map((k) => (
                  <g key={k} transform={`scale(${k} 1)`}>
                    <path d="M4 2c8 0 12-7 20-7 7 0 10 5 7 9-2 3-7 2-6-1" fill="none" stroke={`url(#${gold})`} strokeWidth="2.2" />
                    <path d="M4 2c8 0 12-7 20-7 7 0 10 5 7 9-2 3-7 2-6-1" fill="none" stroke={line} strokeWidth=".5" />
                    <path d="M2-3c5-4 11-2 12 3-5 2-9 1-12-3z" fill={VIOLET} stroke={line} strokeWidth=".6" />
                  </g>
                ))}
                <path d="M0-16c5 5 5 11 0 16-5-5-5-11 0-16z" fill={RED} stroke={`url(#${gold})`} strokeWidth="1.2" />
                <circle cx="0" cy="3" r="3" fill={RED} stroke={`url(#${gold})`} strokeWidth="1.2" />
                <circle className="gem-glint" cx="-1" cy="2" r=".8" fill="#fff" />
              </g>
              <g transform="translate(42 54)">
                <Index c={line} />
              </g>
              <g transform="translate(208 280) rotate(180)">
                <Index c={line} />
              </g>
            </svg>
          </div>

          {/* 4 · the jester */}
          <div data-layer="figure" className={layer}>
            <div className="absolute left-1/2 top-[8%] w-[78%] -translate-x-1/2">
              <JesterFigure mood={mood} className="w-full drop-shadow-[0_6px_6px_rgba(0,0,0,.35)]" />
            </div>
          </div>

          {/* 5 · ribbon */}
          <div data-layer="ribbon" className={layer}>
            <svg viewBox="0 0 250 350" className="h-full w-full" style={{ transformOrigin: "50% 89%" }} aria-hidden>
              <g transform="translate(25 291)">
                <path d="M0 16l24 4v22L0 38l10-11z" fill={RED} stroke={line} strokeWidth="1.3" />
                <path d="M200 16l-24 4v22l24-4-10-11z" fill={RED} stroke={line} strokeWidth="1.3" />
                <path d="M3 18.6l18 3M3 35.4l18-3M197 18.6l-18 3M197 35.4l-18-3" stroke={GOLD} strokeWidth=".8" />
                <path d="M24 20l9 6v16l-9 0zM176 20l-9 6v16l9 0z" fill={RED_DARK} />
                <path d="M18 6Q100 -3 182 6V40Q100 31 18 40Z" fill="#f6ead0" stroke={line} strokeWidth="1.6" />
                <path d="M22 9.6Q100 1 178 9.6M22 36.4Q100 27.8 178 36.4" fill="none" stroke={GOLD} strokeWidth="1.8" />
                <path d="M22 9.6Q100 1 178 9.6M22 36.4Q100 27.8 178 36.4" fill="none" stroke={RED} strokeWidth=".5" />
                <text x="100" y="29.5" textAnchor="middle" fill={RED_DARK} fontSize="21" letterSpacing="5" fontFamily="Georgia, serif" fontWeight="bold">
                  JOKER
                </text>
              </g>
            </svg>
          </div>

          {/* 6 · glints and sheen on top */}
          <div data-layer="glints" className={`${layer} overflow-hidden rounded-[7%/5%]`}>
            <div className="engrave-sheen" />
            {[
              [12, 8, 0],
              [88, 92, 1.1],
              [50, 5, 2.3],
              [24, 55, 0.6],
              [78, 38, 1.8],
              [50, 88, 2.9],
            ].map(([x, y, d], i) => (
              <span key={i} className="twinkle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
