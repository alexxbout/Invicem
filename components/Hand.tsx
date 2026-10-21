"use client";

import gsap from "gsap";
import { useRef } from "react";
import type { Question } from "@/lib/client";
import { CardBack } from "./Card";

const TILT = ["-7deg", "0deg", "7deg"];

export function Depth({ depth }: { depth: number }) {
  return (
    <span className="flex gap-1.5 text-gold">
      {[1, 2, 3].map((d) => (
        <span key={d} className={`size-[5px] rotate-45 border border-current ${d <= depth ? "bg-current" : ""}`} />
      ))}
    </span>
  );
}

/** Three face-down candidates: theme and depth are visible, the question is not. */
export function Hand({
  color,
  hand,
  canPick,
  onPick,
}: {
  color: number;
  hand: Pick<Question, "theme" | "depth">[];
  canPick: boolean;
  onPick: (slot: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  const pick = (slot: number) => {
    if (!canPick || picked.current) return;
    picked.current = true;
    const tiles = rowRef.current!.querySelectorAll<HTMLElement>("[data-tile]");
    tiles.forEach((el, i) => {
      if (i === slot) gsap.to(el, { y: -26, scale: 1.12, duration: 0.45, ease: "power3.out" });
      else gsap.to(el, { opacity: 0, y: 24, scale: 0.9, duration: 0.4, ease: "power2.in" });
    });
    onPick(slot);
  };

  return (
    <div ref={rowRef} className="flex w-full items-start justify-center gap-2">
      {hand.map((h, i) => (
        <button
          key={i}
          data-tile
          disabled={!canPick}
          onClick={() => pick(i)}
          aria-label={`${h.theme}, profondeur ${h.depth}`}
          className="flex w-[30%] max-w-[132px] flex-col items-center gap-3 disabled:cursor-default"
          style={{ "--i": i, rotate: TILT[i] ?? "0deg" } as React.CSSProperties}
        >
          <div className="relative aspect-[5/7] w-full" style={{ filter: "drop-shadow(0 14px 18px rgba(0,0,0,.5))" }}>
            <CardBack color={color} />
          </div>
          <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-paper/70">{h.theme}</span>
          <Depth depth={h.depth} />
        </button>
      ))}
    </div>
  );
}
