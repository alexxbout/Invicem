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
let constellationPending = false;

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
  /** the peak: everything is blown outwards, and a constellation draws itself */
  burst() {
    burstPending = true;
    constellationPending = true;
  },
  /** a constellation draws itself in the sky, then fades */
  constellation() {
    constellationPending = true;
  },
  /** average depth of the chosen mood, 1 to 3 */
  depth(avg: number) {
    gsap.to(mood, { depth: avg, duration: 1.6, ease: "power2.inOut" });
    gsap.to(document.documentElement, { "--vig": 0.5 + 0.25 * ((avg - 1) / 2), duration: 1.6, ease: "power2.inOut" });
  },
};

/** a star: a sharp white point inside a small tinted glow */
function makeStar(r: number, g: number, b: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const x = c.getContext("2d")!;
  const grad = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.1, "rgba(255,250,240,.95)");
  grad.addColorStop(0.18, `rgba(${r},${g},${b},.45)`);
  grad.addColorStop(0.45, `rgba(${r},${g},${b},.08)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grad;
  x.fillRect(0, 0, 32, 32);
  return c;
}

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
    let stars: { x: number; y: number; r: number; base: number; tw: number; phase: number; depth: number }[] = [];
    // now and then a shooting star; on each reveal, a constellation drawn for a moment
    let shooting: { x: number; y: number; vx: number; vy: number; born: number } | null = null;
    let nextShot = 4 + Math.random() * 8;
    let constellation: { pts: number[]; born: number } | null = null;
    let nextConstellation = 20 + Math.random() * 25;
    const rand = (n: number) => Math.floor(Math.random() * n);
    let sprite = makeSprite(tint.r, tint.g, tint.b);
    let spriteKey = `${tint.r},${tint.g},${tint.b}`;
    let starSprite = makeStar(tint.r, tint.g, tint.b);
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
      // a still sky: the stars replace the drifting motes
      motes = [];
      stars = Array.from({ length: Math.round(Math.min(140, (w * h) / 2600)) }, () => {
        const near = Math.random() < 0.12;
        return {
          x: Math.random() * w,
          y: Math.random() * h * 0.85,
          r: near ? 1.3 + Math.random() * 0.9 : 0.5 + Math.random() * 0.7,
          base: near ? 0.75 : 0.25 + Math.random() * 0.4,
          tw: 0.6 + Math.random() * 2.2,
          phase: Math.random() * Math.PI * 2,
          depth: near ? 14 : 4 + Math.random() * 6,
        };
      });
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
      if (owed < 30 && charge.v <= 0.001 && !burstPending && !shooting && !constellation && !constellationPending) return;
      const dt = Math.min(owed, 50) / 16.7;
      owed = 0;
      const t = performance.now() / 1000;
      const key = `${tint.r},${tint.g},${tint.b}`;
      if (key !== spriteKey) {
        sprite = makeSprite(tint.r, tint.g, tint.b);
        starSprite = makeStar(tint.r, tint.g, tint.b);
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

      // a faint nebula: the three soft blobs, dimmed, so the stars read on a deep sky
      for (let k = 0; k < 3; k++) {
        const size = Math.max(w, h) * (0.75 + k * 0.15);
        const mx = w * (0.25 + k * 0.25) + Math.sin(t * 0.07 + k * 2.1) * w * 0.14 + par.x * 12 * (k + 1);
        const my = h * (0.32 + k * 0.17) + Math.cos(t * 0.055 + k * 1.7) * h * 0.1 + par.y * 12 * (k + 1);
        ctx.globalAlpha = (0.045 + 0.015 * Math.sin(t * 0.18 + k)) * mistMul;
        ctx.drawImage(sprite, mx - size / 2, my - size / 2, size, size);
      }

      // the stars: still, each twinkling at its own pace, brighter as the cards draw near
      const lift = 1 + charge.v * 0.9;
      for (const st of stars) {
        const a = st.base * (0.55 + 0.45 * Math.sin(t * st.tw + st.phase)) * lift;
        const size = st.r * 11;
        ctx.globalAlpha = Math.min(1, a);
        ctx.drawImage(starSprite, st.x + par.x * st.depth - size / 2, st.y + par.y * st.depth - size / 2, size, size);
      }

      if (!shooting && t > nextShot) {
        const fromLeft = Math.random() < 0.5;
        shooting = { x: fromLeft ? w * Math.random() * 0.4 : w * (0.6 + Math.random() * 0.4), y: h * Math.random() * 0.3, vx: (fromLeft ? 1 : -1) * w * 0.9, vy: h * 0.35, born: t };
      }
      if (shooting) {
        const age = t - shooting.born;
        if (age > 0.9) {
          shooting = null;
          nextShot = t + 9 + Math.random() * 14;
        } else {
          // a streak: a row of shrinking glows behind the head
          for (let i = 0; i < 14; i++) {
            const back = age - i * 0.012;
            if (back < 0) break;
            const x = shooting.x + shooting.vx * back;
            const y = shooting.y + shooting.vy * back;
            const size = (14 - i) * 1.4;
            ctx.globalAlpha = (1 - i / 14) * Math.sin((age / 0.9) * Math.PI) * 0.9;
            ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
          }
        }
      }

      // a new constellation each time: a bright star somewhere in the sky, and four to seven of
      // its neighbours joined one to the next. Also now and then on its own.
      if (!constellation && t > nextConstellation) constellationPending = true;
      // a called one replaces whatever is drawn
      if (constellationPending && stars.length) {
        constellationPending = false;
        nextConstellation = t + 35 + Math.random() * 40;
        const bright = stars.map((st, i) => i).filter((i) => stars[i].y > h * 0.08 && stars[i].y < h * 0.45 && stars[i].base > 0.45);
        const seed = bright.length ? bright[rand(bright.length)] : rand(stars.length);
        const s0 = stars[seed];
        const reach = Math.min(w, h) * 0.38;
        const near = stars
          .map((st, i) => ({ i, d: Math.hypot(st.x - s0.x, st.y - s0.y) }))
          .filter((p) => p.i !== seed && p.d < reach && p.d > 14)
          .sort((p, q) => p.d - q.d - (stars[q.i].base - stars[p.i].base) * 40)
          .slice(0, 4 + rand(4))
          .map((p) => p.i);
        const order = [seed];
        const rest = near;
        while (rest.length) {
          const last = stars[order[order.length - 1]];
          rest.sort((p, q) => Math.hypot(stars[p].x - last.x, stars[p].y - last.y) - Math.hypot(stars[q].x - last.x, stars[q].y - last.y));
          order.push(rest.shift()!);
        }
        if (order.length > 2) constellation = { pts: order, born: t };
      }

      if (constellation) {
        const age = t - constellation.born;
        if (age > 4) constellation = null;
        else {
          const k = Math.min(1, age / 1.2);
          const fade = age < 2.6 ? 1 : 1 - (age - 2.6) / 1.4;
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = `rgba(${tint.r},${tint.g},${tint.b},${0.45 * fade})`;
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          const pts = constellation.pts;
          // the lines draw themselves from star to star
          const reach = k * (pts.length - 1);
          for (let i = 0; i < pts.length - 1 && i < reach; i++) {
            const a = stars[pts[i]];
            const b = stars[pts[i + 1]];
            const f = Math.min(1, reach - i);
            const ax = a.x + par.x * a.depth;
            const ay = a.y + par.y * a.depth;
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + (b.x + par.x * b.depth - ax) * f, ay + (b.y + par.y * b.depth - ay) * f);
          }
          ctx.stroke();
          for (const i of pts) {
            const st = stars[i];
            const size = 26 * fade;
            ctx.globalAlpha = fade;
            ctx.drawImage(starSprite, st.x + par.x * st.depth - size / 2, st.y + par.y * st.depth - size / 2, size, size);
          }
        }
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
