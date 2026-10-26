"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

/** layer 0 = far (small, dim, slow), 1 = middle, 2 = near (big, soft, fast) */
type Mote = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  /** extra velocity from attraction and bursts, decays on its own */
  ix: number;
  iy: number;
  phase: number;
  speed: number;
  layer: 0 | 1 | 2;
};

const LAYER = [
  { size: 0.7, alpha: 0.85, drift: 0.55, parallax: 6, share: 0.5 },
  { size: 1.1, alpha: 1.15, drift: 1, parallax: 16, share: 0.35 },
  { size: 2.2, alpha: 0.75, drift: 1.7, parallax: 38, share: 0.15 },
] as const;

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

gsap.ticker.lagSmoothing(0);

const tint = { ...hexToRgb("#d9b779") };
/** 0..1, how strongly the motes are drawn towards the card */
const charge = { v: 0 };
/** average chosen depth, 1 (light) to 3 (deep): fewer, slower motes and a denser, darker haze when deep */
const mood = { depth: 2 };
let burstPending = false;

/** Retint the motes, the mist and the halo; call from any screen. */
export function setAccent(hex: string) {
  gsap.to(tint, { ...hexToRgb(hex), duration: 1.4, ease: "power2.out", roundProps: "r,g,b" });
  gsap.to(document.documentElement, { "--accent": hex, duration: 1.4, ease: "power2.out" });
}

/** The background answers to what happens at the table. */
export const ambient = {
  /** the two cards are about to meet: everything leans in, swirling */
  charge(on: boolean) {
    gsap.to(charge, { v: on ? 1 : 0, duration: on ? 2.4 : 0.8, ease: on ? "power2.in" : "power2.out" });
  },
  /** the peak: everything is blown outwards */
  burst() {
    burstPending = true;
  },
  /** average depth of the chosen mood, 1 to 3 */
  depth(avg: number) {
    gsap.to(mood, { depth: avg, duration: 1.6, ease: "power2.inOut" });
    gsap.to(document.documentElement, { "--vig": 0.5 + 0.25 * ((avg - 1) / 2), duration: 1.6, ease: "power2.inOut" });
  },
};

function makeSprite(r: number, g: number, b: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.3, `rgba(${r},${g},${b},.5)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grad;
  x.fillRect(0, 0, 64, 64);
  return c;
}

/**
 * Three layers of drifting light, slow coloured mist, a vignette and a parallax that follows
 * the finger or the phone. One pre-rendered glow sprite is stamped everywhere, so a frame costs
 * a few dozen drawImage calls. Paused with the tab, off under reduced motion.
 */
export function Ambient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // soft glows need no retina resolution; keeps the canvas cheap so UI tweens never starve
    const dpr = 1;
    let w = 0;
    let h = 0;
    let motes: Mote[] = [];
    let sprite = makeSprite(tint.r, tint.g, tint.b);
    let spriteKey = `${tint.r},${tint.g},${tint.b}`;
    // parallax target and smoothed value, -1..1
    const par = { tx: 0, ty: 0, x: 0, y: 0 };

    const pickLayer = (): 0 | 1 | 2 => {
      const u = Math.random();
      return u < LAYER[0].share ? 0 : u < LAYER[0].share + LAYER[1].share ? 1 : 2;
    };

    const spawn = (fromBottom = false): Mote => {
      const layer = pickLayer();
      const L = LAYER[layer];
      return {
        x: Math.random() * w,
        y: fromBottom ? h + 20 : Math.random() * h,
        r: (0.6 + Math.random() * 1.7) * L.size,
        vx: (Math.random() - 0.5) * 0.12 * L.drift,
        vy: -(0.05 + Math.random() * 0.2) * L.drift,
        ix: 0,
        iy: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.2,
        layer,
      };
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: Math.round(Math.min(72, (w * h) / 11000)) }, () => spawn());
    };
    resize();
    window.addEventListener("resize", resize);

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const onPointer = (e: PointerEvent) => {
      par.tx = clamp((e.clientX / w - 0.5) * 2);
      par.ty = clamp((e.clientY / h - 0.5) * 2);
    };
    let beta0: number | null = null;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      beta0 = beta0 === null ? e.beta : beta0 + (e.beta - beta0) * 0.01;
      par.tx = clamp(e.gamma / 25);
      par.ty = clamp((e.beta - beta0) / 25);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt);

    // slow motes read the same at 30 fps; drawing every other frame leaves the GPU to the cards.
    // Full rate only while the motes swirl into a charging card or scatter from a flip.
    let owed = 0;
    const tick = (_time: number, deltaMs: number) => {
      owed += deltaMs;
      if (owed < 30 && charge.v <= 0.001 && !burstPending) return;
      const dt = Math.min(owed, 50) / 16.7;
      owed = 0;
      const t = performance.now() / 1000;
      const key = `${tint.r},${tint.g},${tint.b}`;
      if (key !== spriteKey) {
        sprite = makeSprite(tint.r, tint.g, tint.b);
        spriteKey = key;
      }
      par.x += (par.tx - par.x) * 0.05 * dt;
      par.y += (par.ty - par.y) * 0.05 * dt;

      // deep = fewer, slower motes and thicker mist; light = the opposite
      const d = (mood.depth - 1) / 2;
      const active = 1 - 0.4 * d;
      const speedMul = 1.25 - 0.55 * d;
      const mistMul = 0.7 + 0.9 * d;
      const cx = w / 2;
      const cy = h * 0.44;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // mist: three huge soft blobs wandering slowly
      for (let k = 0; k < 3; k++) {
        const size = Math.max(w, h) * (0.75 + k * 0.15);
        const mx = w * (0.25 + k * 0.25) + Math.sin(t * 0.07 + k * 2.1) * w * 0.14 + par.x * 12 * (k + 1);
        const my = h * (0.32 + k * 0.17) + Math.cos(t * 0.055 + k * 1.7) * h * 0.1 + par.y * 12 * (k + 1);
        ctx.globalAlpha = (0.085 + 0.03 * Math.sin(t * 0.18 + k)) * mistMul;
        ctx.drawImage(sprite, mx - size / 2, my - size / 2, size, size);
      }

      if (burstPending) {
        burstPending = false;
        for (const m of motes) {
          const dx = m.x - cx;
          const dy = m.y - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const power = (3 + Math.random() * 5) * (0.6 + LAYER[m.layer].drift * 0.5);
          m.ix += (dx / dist) * power;
          m.iy += (dy / dist) * power;
        }
      }

      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const L = LAYER[m.layer];

        if (charge.v > 0.001) {
          const dx = cx - m.x;
          const dy = cy - m.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          // a pull towards the card plus a swirl around it
          m.ix += (nx * 0.035 + -ny * 0.075) * charge.v * L.drift * dt;
          m.iy += (ny * 0.035 + nx * 0.075) * charge.v * L.drift * dt;
          if (dist < 40) motes[i] = spawn(true);
        }
        m.ix *= 0.965;
        m.iy *= 0.965;

        m.x += (m.vx * speedMul + Math.sin(t * 0.3 + m.phase) * 0.05 * L.drift + m.ix) * dt;
        m.y += (m.vy * speedMul + m.iy) * dt;
        if (m.y < -20 || m.y > h + 80 || m.x < -60 || m.x > w + 60) motes[i] = spawn(true);

        // motes beyond the active share fade out instead of popping
        const share = i / motes.length;
        const on = Math.max(0, Math.min(1, (active - share) * 8));
        if (on <= 0) continue;
        const a = (0.22 + 0.45 * (0.5 + 0.5 * Math.sin(t * m.speed + m.phase))) * L.alpha * on * (1 + charge.v * 0.6);
        const size = m.r * 11;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, m.x + par.x * L.parallax - size / 2, m.y + par.y * L.parallax - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    if (!reduce) gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#130f1a]" />
      {/* the halo breathes slowly, like a candle */}
      <div
        aria-hidden
        className="halo pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 42%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%), radial-gradient(ellipse 120% 70% at 50% 120%, #2a1d3a, transparent 60%)",
        }}
      />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse 75% 65% at 50% 45%, transparent 40%, rgba(6,3,10,var(--vig, .55)) 100%)",
        }}
      />
    </>
  );
}
