"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { buzz, reduced, tick } from "@/lib/feel";

/** a jester's cap with three bells, the classic joker mark */
export function JesterIcon({ className, strokeWidth = 1.4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* three floppy points: the side ones rise then hang down, each ending in a bell */}
      <path d="M5.2 15C4.4 9 3 5.5 2.2 12.4C3.8 8.5 6.6 8 8.6 15C9.2 9.4 10.6 4.6 14.6 3.8C12.9 5.6 13.9 10 15.4 15C17.4 8 20.2 8.5 21.8 12.4C21 5.5 19.6 9 18.8 15Z" />
      <path d="M4.6 15h14.8v2.4a.9.9 0 0 1-.9.9H5.5a.9.9 0 0 1-.9-.9z" />
      <path d="M8.3 16.7h.01M12 16.7h.01M15.7 16.7h.01" strokeWidth={2.2} />
      <circle cx="2.2" cy="13.8" r="1.2" />
      <circle cx="15.9" cy="3.6" r="1.15" />
      <circle cx="21.8" cy="13.8" r="1.2" />
    </svg>
  );
}

/** one joker the answering player still holds (or the empty slot of a spent one) */
export function JokerToken({ available, onUse }: { available: boolean; onUse: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);

  const use = () => {
    if (!available) return;
    buzz(16);
    if (!reduced()) gsap.to(ref.current, { y: -26, scale: 1.25, rotation: 12, opacity: 0, duration: 0.45, ease: "power2.in" });
    onUse();
  };

  return (
    <button
      ref={ref}
      onClick={use}
      disabled={!available}
      aria-label={available ? "Jouer un joker : passer cette carte" : "Joker déjà joué"}
      className={`flex flex-col items-center gap-1 transition active:scale-95 ${available ? "" : "opacity-35"}`}
    >
      <span
        className={`grid aspect-[5/7] w-[42px] place-items-center rounded-[6px] border ${
          available ? "joker-idle border-gold/70 text-gold" : "border-dashed border-white/25 text-white/30"
        }`}
        style={
          available
            ? { background: "linear-gradient(160deg, #3a1d56, #160b24)", boxShadow: "0 6px 16px -4px rgba(0,0,0,.6)" }
            : undefined
        }
      >
        <JesterIcon className="w-[70%]" />
      </span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-paper/45">Joker</span>
    </button>
  );
}

/** the joker slapped onto the table, seen on both phones before the card goes back */
export function JokerFlash() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    tick();
    if (reduced()) {
      const tl = gsap.timeline().fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 }).to(el, { opacity: 0, duration: 0.3 }, 0.8);
      return () => {
        tl.kill();
      };
    }
    const tl = gsap
      .timeline()
      .fromTo(
        el,
        { scale: 0.3, rotation: -35, y: 80, opacity: 0 },
        { scale: 1, rotation: 6, y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
      )
      .to(el, { rotation: -3, duration: 0.35, ease: "sine.inOut" })
      .to(el, { scale: 1.3, rotation: -8, opacity: 0, duration: 0.4, ease: "power2.in" }, 0.95);
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <div
        ref={ref}
        className="grid aspect-[5/7] w-[min(46vw,190px)] place-items-center rounded-[7%/5%] border border-gold/70 opacity-0"
        style={{
          background: "linear-gradient(160deg, #3f1f5e, #150a22)",
          boxShadow: "0 0 60px 6px color-mix(in srgb, var(--accent) 45%, transparent), 0 24px 40px -10px rgba(0,0,0,.7)",
        }}
      >
        <div className="flex flex-col items-center gap-3 text-gold">
          <JesterIcon className="w-[56%] min-w-[80px] drop-shadow-[0_0_10px_rgba(217,183,121,.6)]" strokeWidth={1.2} />
          <span className="display text-[20px] uppercase tracking-[0.3em]">Joker</span>
        </div>
      </div>
    </div>
  );
}
