"use client";

import gsap from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import { buzz, flip as flipSound, reduced, reveal } from "@/lib/feel";
import { ambient } from "./Ambient";
import { edge } from "./EdgeLight";
import { COLORS } from "@/lib/palette";
import { Glyph } from "./Glyph";

type Props = {
  color: number;
  /** omit for a plain back (palette tiles) */
  symbol?: number;
  flipped?: boolean;
  /** content of the paper face */
  front?: ReactNode;
  /** laid over the back, e.g. what the hidden question is about */
  backNote?: ReactNode;
  /** a written question keeps the blank card's ivory back */
  blank?: boolean;
  /** both phones are waiting for the shared flip: light chases the edges and builds up */
  charging?: boolean;
  /** flip duration in seconds */
  duration?: number;
  /** the big shared moment: flash, sparks, chime, long buzz */
  burst?: boolean;
  /** tilt with the finger, and with the phone when it reports its orientation */
  tilt?: boolean;
  /** slow idle bobbing */
  idle?: boolean;
  width?: string;
};

/** a band of light that sweeps across the face while the card turns */
function Foil() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[7%/5%]">
      <div data-foil className="absolute inset-y-0 left-0 w-[55%]" style={{ transform: "translateX(-140%)", opacity: 0 }}>
        <div
          className="h-full w-full"
          style={{
            transform: "skewX(-18deg)",
            // plain alpha instead of a blend mode: blend modes on a flipping 3D layer make the frame drop
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.42) 50%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

export function CardBack({ color, symbol }: { color: number; symbol?: number }) {
  const c = COLORS[color];
  const line = "color-mix(in srgb, currentColor 55%, transparent)";
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7%/5%]"
      style={{
        background: `linear-gradient(150deg, ${c.from} 0%, ${c.to} 100%)`,
        color: c.ink,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.28), inset 0 -30px 60px rgba(0,0,0,.18)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[.17]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1.5px)",
          backgroundSize: "13px 13px",
        }}
      />
      <div className="absolute inset-[3.2%] rounded-[5%/3.6%] border" style={{ borderColor: line }} />
      <div
        className="absolute inset-[5.2%] rounded-[4%/2.8%] border"
        style={{ borderColor: "color-mix(in srgb, currentColor 25%, transparent)" }}
      />
      <div
        className="absolute left-1/2 top-1/2 grid aspect-square w-[60%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border"
        style={{
          borderColor: line,
          background: "radial-gradient(circle, rgba(255,255,255,.14), rgba(0,0,0,.08) 80%)",
        }}
      >
        <div
          className="absolute inset-[7%] rounded-full border"
          style={{ borderColor: "color-mix(in srgb, currentColor 28%, transparent)" }}
        />
        {symbol === undefined ? (
          <div className="size-[26%] rotate-45 border" style={{ borderColor: line }} />
        ) : (
          <Glyph id={symbol} className="w-[54%] drop-shadow-[0_2px_6px_rgba(0,0,0,.25)]" strokeWidth={1.15} />
        )}
      </div>
      {symbol !== undefined && (
        <>
          <Glyph id={symbol} className="absolute left-[9%] top-[6.5%] w-[11%] opacity-80" strokeWidth={1.6} />
          <Glyph
            id={symbol}
            className="absolute bottom-[6.5%] right-[9%] w-[11%] rotate-180 opacity-80"
            strokeWidth={1.6}
          />
        </>
      )}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(circle at var(--sx, 28%) var(--sy, 18%), rgba(255,255,255,.75), transparent 48%)",
        }}
      />
      <Foil />
    </div>
  );
}

/** golden back of a rare card, with a rainbow sheen and a star */
export function RareBack() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7%/5%]"
      style={{
        background: "linear-gradient(150deg, #fbe7a6 0%, #e0b54a 45%, #a7741c 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.55), inset 0 -30px 60px rgba(90,50,0,.25)",
        color: "#5a3a08",
      }}
    >
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1.5px)", backgroundSize: "11px 11px" }} />
      <div className="absolute inset-[3.2%] rounded-[5%/3.6%] border border-current opacity-60" />
      <div className="absolute inset-[5.2%] rounded-[4%/2.8%] border border-current opacity-30" />
      <div className="absolute left-1/2 top-1/2 grid aspect-square w-[60%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-current">
        <Glyph id={2} className="w-[52%] drop-shadow-[0_0_8px_rgba(255,240,180,.9)]" strokeWidth={1.3} />
      </div>
      <div className="holo absolute inset-0" />
      <span className="twinkle" style={{ left: "22%", top: "16%" }} />
      <span className="twinkle" style={{ left: "78%", top: "82%", animationDelay: "1.4s" }} />
    </div>
  );
}

/** a quill, for blank cards and the writing moments */
export function Quill({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 3C12 4 6 10 5 19c4-6 9-10 15-16z" />
      <path d="M5 19l-2 2M9 13c2-1 4-1 6 0M11 10c2-1 4-1 5-.5" />
    </svg>
  );
}

/** ivory back of the blank card: the picker writes the question */
export function BlankBack() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7%/5%] text-[#a7741c]"
      style={{ background: "linear-gradient(160deg, #fbf3e2, #ead9b8)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.8), inset 0 -30px 60px rgba(120,80,30,.15)" }}
    >
      <div className="absolute inset-[3.2%] rounded-[5%/3.6%] border border-current opacity-70" />
      <div className="absolute inset-[5.2%] rounded-[4%/2.8%] border border-current opacity-30" />
      <div className="absolute left-1/2 top-1/2 grid aspect-square w-[56%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-current opacity-80">
        <Quill className="w-[52%]" />
      </div>
    </div>
  );
}

function Paper({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7%/5%] text-[#2a2132]"
      style={{
        containerType: "inline-size",
        background: "linear-gradient(165deg, #f8f0e3 0%, #eadcc6 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.7), inset 0 -40px 80px rgba(120,80,30,.14)",
      }}
    >
      <div className="absolute inset-[3.2%] rounded-[5%/3.6%] border border-[#b8914d]/60" />
      <div className="absolute inset-[5.2%] rounded-[4%/2.8%] border border-[#b8914d]/25" />
      <div className="absolute inset-[9%] flex flex-col">{children}</div>
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background: "radial-gradient(circle at var(--sx, 28%) var(--sy, 18%), rgba(255,255,255,.9), transparent 50%)",
        }}
      />
      <Foil />
    </div>
  );
}

/** a soft wash of the table colour over the whole screen, for the shared peak */
function flash() {
  const d = document.createElement("div");
  Object.assign(d.style, {
    position: "fixed",
    inset: "0",
    zIndex: "60",
    pointerEvents: "none",
    opacity: "0",
    background:
      "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--accent) 65%, white) 0%, transparent 62%)",
  });
  document.body.appendChild(d);
  gsap
    .timeline({ onComplete: () => d.remove() })
    .to(d, { opacity: 0.75, duration: 0.12, ease: "power2.out" })
    .to(d, { opacity: 0, duration: 1, ease: "power2.in" });
}

function sparks(host: HTMLElement) {
  for (let i = 0; i < 64; i++) {
    const dot = document.createElement("span");
    const size = 2 + Math.random() * 6;
    Object.assign(dot.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: i % 5 === 0 ? "#fff" : "var(--accent)",
      boxShadow: "0 0 14px 3px var(--accent)",
      pointerEvents: "none",
    });
    host.appendChild(dot);
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 220;
    gsap.to(dot, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist + 30,
      scale: 0,
      opacity: 0,
      duration: 1 + Math.random() * 1,
      ease: "power3.out",
      onComplete: () => dot.remove(),
    });
  }
}

const ringStyle = {
  padding: 3,
  background: "conic-gradient(from calc(var(--ang, 0) * 1deg), transparent 0 58%, var(--accent) 100%)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
} as const;

export function Card({
  color,
  symbol,
  flipped = false,
  front,
  backNote,
  blank = false,
  charging = false,
  duration = 1.6,
  burst = false,
  tilt = true,
  idle = true,
  width = "min(76vw, 330px)",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const ringARef = useRef<HTMLDivElement>(null);
  const ringBRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const quick = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);
  /** the phone's tilt sensor is live: it drives the card and the finger is ignored */
  const gyro = useRef(false);

  useEffect(() => {
    quick.current = {
      x: gsap.quickTo(tiltRef.current, "rotationX", { duration: 0.7, ease: "power3" }),
      y: gsap.quickTo(tiltRef.current, "rotationY", { duration: 0.7, ease: "power3" }),
    };
  }, []);

  // the phone itself as a pointer: tilting it tilts the card and moves the sheen
  useEffect(() => {
    if (!tilt || reduced()) return;
    let base: number | null = null;
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    // the sheen eases toward where the phone points instead of jumping with each sensor reading
    const sheen = { x: 50, y: 50, tx: 50, ty: 50 };
    const glide = () => {
      if (!gyro.current) return;
      // settled: no style writes, so the card is not recalculated on idle frames
      if (Math.abs(sheen.tx - sheen.x) < 0.1 && Math.abs(sheen.ty - sheen.y) < 0.1) return;
      sheen.x += (sheen.tx - sheen.x) * 0.08;
      sheen.y += (sheen.ty - sheen.y) * 0.08;
      rootRef.current?.style.setProperty("--sx", `${sheen.x.toFixed(1)}%`);
      rootRef.current?.style.setProperty("--sy", `${sheen.y.toFixed(1)}%`);
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      // once the phone reports its tilt, it alone moves the card: touches no longer do
      gyro.current = true;
      base = base === null ? e.beta : base + (e.beta - base) * 0.02;
      const y = clamp(e.gamma * 0.45, 14);
      const x = clamp(-(e.beta - base) * 0.5, 14);
      quick.current?.y(y);
      quick.current?.x(x);
      sheen.tx = 50 + y * 3;
      sheen.ty = 50 - x * 3;
    };
    window.addEventListener("deviceorientation", onTilt);
    gsap.ticker.add(glide);
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      gsap.ticker.remove(glide);
    };
  }, [tilt]);

  useEffect(() => {
    if (!idle || reduced()) return;
    const tw = gsap.to(floatRef.current, {
      y: -8,
      rotation: 0.6,
      duration: 3.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    return () => {
      tw.kill();
    };
  }, [idle]);

  useEffect(() => {
    const flip = flipRef.current;
    const lift = liftRef.current;
    const shadow = shadowRef.current;
    const target = flipped ? 180 : 0;
    if (first.current) {
      first.current = false;
      gsap.set(flip, { rotationY: target });
      return;
    }
    const calm = reduced();
    const d = calm ? Math.min(duration, 0.5) : duration;
    const from = gsap.getProperty(flip, "rotationY") as number;
    const sign = target >= from ? 1 : -1;
    const foils = gsap.utils.toArray<HTMLElement>("[data-foil]", rootRef.current);

    const tl = gsap.timeline();
    // wind up against the direction, swing past the end, settle with a small wobble
    tl.to(flip, { rotationY: from - sign * (calm ? 0 : 10), duration: d * 0.16, ease: "power2.out", overwrite: "auto" }, 0)
      .to(flip, { rotationY: target + sign * (calm ? 0 : 7), duration: d * 0.56, ease: "power3.inOut" })
      .to(flip, { rotationY: target, duration: d * 0.28, ease: calm ? "power1.out" : "elastic.out(1, 0.45)" });
    if (!calm) {
      tl.to(lift, { scale: 1.09, y: -18, duration: d * 0.45, ease: "power2.out" }, 0)
        .to(lift, { scale: 1, y: 0, duration: d * 0.55, ease: "power2.inOut" }, d * 0.45)
        // the shadow shrinks and fades while the card is up, then spreads back as it lands
        .to(shadow, { scaleX: 0.74, opacity: 0.35, y: 22, duration: d * 0.45, ease: "power2.out" }, 0)
        .to(shadow, { scaleX: 1, opacity: 1, y: 0, duration: d * 0.55, ease: "power2.inOut" }, d * 0.45)
        // fades in, sweeps, and is already fully faded before it reaches the end, so nothing cuts off
        .fromTo(foils, { xPercent: -140 }, { xPercent: 330, duration: d * 0.72, ease: "sine.inOut" }, d * 0.12)
        .to(foils, { opacity: 1, duration: d * 0.12, ease: "none" }, d * 0.12)
        .to(foils, { opacity: 0, duration: d * 0.3, ease: "power1.in" }, d * 0.54);
    }
    tl.call(
      () => {
        if (burst && flipped) {
          if (!calm) {
            flash();
            if (burstRef.current) sparks(burstRef.current);
          }
          reveal();
          ambient.burst();
          edge.burst();
          buzz([30, 40, 30, 40, 160]);
        } else {
          flipSound();
          buzz(12);
        }
      },
      [],
      d * 0.5,
    );
    return () => {
      tl.kill();
      gsap.set(foils, { opacity: 0 });
    };
    // duration / burst are read once per flip on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  // waiting for the shared flip: light chases the edges, the beat quickens until the peak
  useEffect(() => {
    const glow = glowRef.current;
    const lift = liftRef.current;
    const rings = [ringARef.current, ringBRef.current];
    if (!charging) {
      gsap.to([glow, ...rings], { opacity: 0, duration: 0.4 });
      return;
    }
    const calm = reduced();
    const pulse = gsap.fromTo(
      glow,
      { opacity: 0.2, scale: 1 },
      { opacity: 1, scale: 1.05, duration: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut" },
    );
    const hum = calm
      ? null
      : gsap.to(lift, { scale: 1.025, duration: 0.24, yoyo: true, repeat: -1, ease: "sine.inOut" });
    const spinA = gsap.to(rings[0], { "--ang": 360, duration: 2.2, repeat: -1, ease: "none" });
    const spinB = gsap.to(rings[1], { "--ang": -360, duration: 3.1, repeat: -1, ease: "none" });
    gsap.fromTo(rings, { opacity: 0 }, { opacity: 1, duration: 0.7, stagger: 0.15 });
    const parts = [pulse, spinA, spinB, ...(hum ? [hum] : [])];
    ambient.charge(true);
    // the charge ramps up so the flip feels earned
    const ramp = gsap.to(parts, { timeScale: 3.4, duration: 2.4, ease: "power2.in" });
    return () => {
      ambient.charge(false);
      ramp.kill();
      parts.forEach((p) => p.kill());
      gsap.set(lift, { scale: 1 });
    };
  }, [charging]);

  const onMove = (e: React.PointerEvent) => {
    const root = rootRef.current;
    if (!root || !tilt || gyro.current) return;
    const r = root.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    quick.current?.y(nx * 22);
    quick.current?.x(-ny * 22);
    root.style.setProperty("--sx", `${(nx + 0.5) * 100}%`);
    root.style.setProperty("--sy", `${(ny + 0.5) * 100}%`);
  };

  const onLeave = () => {
    if (gyro.current) return;
    quick.current?.x(0);
    quick.current?.y(0);
  };

  const face = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{ width, aspectRatio: "5 / 7", perspective: 1100 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerUp={onLeave}
    >
      <div ref={burstRef} className="pointer-events-none absolute inset-0 z-10" />
      <div ref={floatRef} className="absolute inset-0">
        <div ref={liftRef} className="absolute inset-0">
          <div
            ref={glowRef}
            className="absolute -inset-1 rounded-[7%/5%] opacity-0"
            style={{ boxShadow: "0 0 70px 14px var(--accent)" }}
          />
          <div
            ref={shadowRef}
            className="absolute inset-x-[6%] -bottom-[5%] h-[8%] rounded-[50%] bg-black/60 blur-xl"
            aria-hidden
          />
          <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div ref={flipRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute inset-0" style={face}>
                {blank ? <BlankBack /> : <CardBack color={color} symbol={symbol} />}
                {backNote}
              </div>
              <div className="absolute inset-0" style={{ ...face, transform: "rotateY(180deg)" }}>
                <Paper>{front}</Paper>
              </div>
            </div>
            <div ref={ringARef} className="pointer-events-none absolute -inset-[3px] rounded-[7%/5%] opacity-0" style={ringStyle} />
            <div ref={ringBRef} className="pointer-events-none absolute -inset-[7px] rounded-[7%/5%] opacity-0" style={ringStyle} />
          </div>
        </div>
      </div>
    </div>
  );
}
