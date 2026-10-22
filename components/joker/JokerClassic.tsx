"use client";

import gsap from "gsap";
import { useEffect, useId, useImperativeHandle, useRef, type Ref } from "react";
import { reduced } from "@/lib/feel";
import { JesterFigure, type DanceMood } from "./JesterFigure";

export type { DanceMood };

const GOLD = "#e0b54a";
const RED = "#b3243a";
const PERSPECTIVE = 900;

/**
 * Depth of each layer in px. The layers are pushed back or forward in real 3D and
 * counter-scaled so the card looks flat at rest; tilting it reveals the depth.
 */
const DEPTH = { bg: 0, pattern: 6, rosette: 16, frame: 26, figure: 44, ribbon: 58, glints: 70 } as const;
type LayerKey = keyof typeof DEPTH;

const fit = (z: number) => (PERSPECTIVE - z) / PERSPECTIVE;

/** filigree for one corner (top-left); other corners mirror it */
function Corner({ c }: { c: string }) {
  return (
    <g fill="none" stroke={c} strokeLinecap="round" strokeLinejoin="round">
      <path data-draw pathLength={1} d="M0 52C0 22 22 0 52 0" strokeWidth="1.4" />
      <path data-draw pathLength={1} d="M7 46C9 24 24 9 46 7" strokeWidth=".8" />
      <path data-draw pathLength={1} d="M52 0c9 0 14 7 9 14s-14 5-13-2 6-9 10-5" strokeWidth="1.2" />
      <path data-draw pathLength={1} d="M0 52c0 9 7 14 14 9s5-14-2-13-9 6-5 10" strokeWidth="1.2" />
      <path data-draw pathLength={1} d="M18 18c6-3 12-2 15 3-6 2-11 2-15-3zM18 18c-3 6-2 12 3 15 2-6 2-11-3-15z" strokeWidth=".9" />
      <path data-draw pathLength={1} d="M30 30c8 2 14 8 16 16M30 30c2 8 8 14 16 16" strokeWidth=".7" />
      <circle cx="18" cy="18" r="2.4" fill={c} stroke="none" />
      <circle cx="61" cy="12" r="1.4" fill={c} stroke="none" />
      <circle cx="12" cy="61" r="1.4" fill={c} stroke="none" />
    </g>
  );
}

/** a vine running along a side, leaves alternating */
function Vine({ c }: { c: string }) {
  return (
    <g fill="none" stroke={c} strokeLinecap="round">
      <path data-draw pathLength={1} d="M0 0C10 14 -8 28 0 42S10 70 0 84" strokeWidth="1" />
      {[10, 30, 52, 72].map((y, i) => (
        <path
          key={y}
          d={i % 2 ? `M1 ${y}c6-4 11-2 12 3-6 2-10 1-12-3z` : `M-1 ${y}c-6-4-11-2-12 3 6 2 10 1 12-3z`}
          strokeWidth=".8"
          fill={c}
          fillOpacity=".25"
        />
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
  width?: number;
  mood?: DanceMood;
  variant?: "paper" | "night";
  /** play the assembly animation when mounted */
  intro?: boolean;
  handle?: Ref<JokerHandle>;
}) {
  const uid = useId().replace(/:/g, "");
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
              <rect data-draw pathLength={1} x="9" y="9" width="232" height="332" rx="12" fill="none" stroke={line} strokeWidth="2" />
              <rect data-draw pathLength={1} x="15" y="15" width="220" height="320" rx="9" fill="none" stroke={GOLD} strokeWidth="2.2" />
              <rect x="20" y="20" width="210" height="310" rx="7" fill="none" stroke={line} strokeWidth=".7" strokeDasharray="1 3" />
              <g transform="translate(20 20)">
                <Corner c={line} />
              </g>
              <g transform="translate(230 20) scale(-1 1)">
                <Corner c={line} />
              </g>
              <g transform="translate(20 330) scale(1 -1)">
                <Corner c={line} />
              </g>
              <g transform="translate(230 330) scale(-1 -1)">
                <Corner c={line} />
              </g>
              <g transform="translate(24 133)">
                <Vine c={line} />
              </g>
              <g transform="translate(226 133) scale(-1 1)">
                <Vine c={line} />
              </g>
              {/* top crest */}
              <g transform="translate(125 20)">
                <path d="M-26 0c8 0 12-6 18-6 4 0 6 3 8 6 2-3 4-6 8-6 6 0 10 6 18 6" fill="none" stroke={line} strokeWidth="1.1" />
                <path d="M0-10l5 7-5 7-5-7z" fill={RED} stroke={line} strokeWidth=".8" />
                <circle cx="0" cy="-3" r="1.4" fill={GOLD} />
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
              <g transform="translate(25 296)">
                <path d="M2 14l22 5v20L2 34l9-10z" fill="#7a1426" stroke={line} strokeWidth="1.3" />
                <path d="M198 14l-22 5v20l22-5-9-10z" fill="#7a1426" stroke={line} strokeWidth="1.3" />
                <path d="M24 19l8 6v14l-8 0zM176 19l-8 6v14l8 0z" fill="#5e0f1e" />
                <path d="M20 8Q100 0 180 8V34Q100 26 20 34Z" fill={RED} stroke={line} strokeWidth="1.5" />
                <path d="M24 11.5Q100 4 176 11.5M24 30.5Q100 23 176 30.5" fill="none" stroke={GOLD} strokeWidth="1" />
                <path d="M30 13Q100 6 170 13" fill="none" stroke="#fff" strokeWidth=".6" opacity=".35" />
                <text x="100" y="26" textAnchor="middle" fill={GOLD} stroke="#3a1008" strokeWidth=".6" fontSize="16" letterSpacing="7" fontFamily="Georgia, serif" fontWeight="bold">
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
