"use client";

import gsap from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import { COLORS } from "@/lib/palette";
import { Glyph } from "./Glyph";

type Props = {
  color: number;
  /** omit for a plain back (palette tiles) */
  symbol?: number;
  flipped?: boolean;
  /** content of the paper face */
  front?: ReactNode;
  /** card hums and glows, used while both phones wait for the shared flip */
  charging?: boolean;
  /** flip duration in seconds */
  duration?: number;
  /** spark burst at the middle of the flip */
  burst?: boolean;
  /** tilt with the finger / pointer */
  tilt?: boolean;
  /** slow idle bobbing */
  idle?: boolean;
  width?: string;
};

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
    </div>
  );
}

export function Card({
  color,
  symbol,
  flipped = false,
  front,
  charging = false,
  duration = 0.9,
  burst = false,
  tilt = true,
  idle = true,
  width = "min(76vw, 330px)",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const quick = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  useEffect(() => {
    quick.current = {
      x: gsap.quickTo(tiltRef.current, "rotationX", { duration: 0.7, ease: "power3" }),
      y: gsap.quickTo(tiltRef.current, "rotationY", { duration: 0.7, ease: "power3" }),
    };
  }, []);

  useEffect(() => {
    if (!idle) return;
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
    const target = flipped ? 180 : 0;
    if (first.current) {
      first.current = false;
      gsap.set(flip, { rotationY: target });
      return;
    }
    const tl = gsap.timeline();
    tl.to(flip, { rotationY: target, duration, ease: "power3.inOut", overwrite: "auto" }, 0)
      .to(lift, { scale: 1.09, y: -18, duration: duration * 0.45, ease: "power2.out" }, 0)
      .to(lift, { scale: 1, y: 0, duration: duration * 0.55, ease: "power2.inOut" }, duration * 0.45);
    if (burst && flipped) {
      tl.call(
        () => {
          const host = burstRef.current;
          if (!host) return;
          for (let i = 0; i < 34; i++) {
            const dot = document.createElement("span");
            const size = 3 + Math.random() * 5;
            Object.assign(dot.style, {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 12px 2px var(--accent)",
              pointerEvents: "none",
            });
            host.appendChild(dot);
            const angle = Math.random() * Math.PI * 2;
            const dist = 90 + Math.random() * 170;
            gsap.to(dot, {
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              scale: 0,
              opacity: 0,
              duration: 1 + Math.random() * 0.8,
              ease: "power3.out",
              onComplete: () => dot.remove(),
            });
          }
        },
        [],
        duration * 0.5,
      );
    }
    return () => {
      tl.kill();
    };
    // duration / burst are read once per flip on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped]);

  useEffect(() => {
    const glow = glowRef.current;
    const lift = liftRef.current;
    if (!charging) {
      gsap.to(glow, { opacity: 0, duration: 0.5 });
      return;
    }
    const pulse = gsap.fromTo(
      glow,
      { opacity: 0.2, scale: 1 },
      { opacity: 1, scale: 1.05, duration: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut" },
    );
    const hum = gsap.to(lift, { scale: 1.025, duration: 0.24, yoyo: true, repeat: -1, ease: "sine.inOut" });
    return () => {
      pulse.kill();
      hum.kill();
      gsap.set(lift, { scale: 1 });
    };
  }, [charging]);

  const onMove = (e: React.PointerEvent) => {
    const root = rootRef.current;
    if (!root || !tilt) return;
    const r = root.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    quick.current?.y(nx * 22);
    quick.current?.x(-ny * 22);
    root.style.setProperty("--sx", `${(nx + 0.5) * 100}%`);
    root.style.setProperty("--sy", `${(ny + 0.5) * 100}%`);
  };

  const onLeave = () => {
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
            className="absolute inset-x-[6%] -bottom-[5%] h-[8%] rounded-[50%] bg-black/60 blur-xl"
            aria-hidden
          />
          <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div ref={flipRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute inset-0" style={face}>
                <CardBack color={color} symbol={symbol} />
              </div>
              <div className="absolute inset-0" style={{ ...face, transform: "rotateY(180deg)" }}>
                <Paper>{front}</Paper>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
