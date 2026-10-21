"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; r: number; vx: number; vy: number; phase: number; speed: number };

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

gsap.ticker.lagSmoothing(0);

const tint = { ...hexToRgb("#d9b779") };

/** Retint the motes and the halo; call from any screen. */
export function setAccent(hex: string) {
  gsap.to(tint, { ...hexToRgb(hex), duration: 1.4, ease: "power2.out", roundProps: "r,g,b" });
  gsap.to(document.documentElement, { "--accent": hex, duration: 1.4, ease: "power2.out" });
}

/**
 * Slow drifting motes of light + a halo behind the stage that takes the colour
 * of the current card. Cheap on purpose: ~50 arcs, paused when the tab is hidden.
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

    const spawn = (fromBottom = false): Mote => ({
      x: Math.random() * w,
      y: fromBottom ? h + 10 : Math.random() * h,
      r: 0.6 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.06 + Math.random() * 0.22),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2,
    });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: Math.round(Math.min(60, (w * h) / 14000)) }, () => spawn());
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 16.7;
      const t = performance.now() / 1000;
      const { r, g, b } = tint;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.x += (m.vx + Math.sin(t * 0.3 + m.phase) * 0.05) * dt;
        m.y += m.vy * dt;
        if (m.y < -10) motes[i] = spawn(true);
        const a = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * m.speed + m.phase));
        const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5);
        halo.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (!reduce) gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 42%, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%), radial-gradient(ellipse 120% 70% at 50% 120%, #2a1d3a, transparent 60%), #130f1a",
        }}
      />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
    </>
  );
}
