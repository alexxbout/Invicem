"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import type { Question } from "@/lib/client";
import { CardBack } from "./Card";

export function Depth({ depth }: { depth: number }) {
  return (
    <span className="flex gap-1.5 text-gold">
      {[1, 2, 3].map((d) => (
        <span key={d} className={`size-[5px] rotate-45 border border-current ${d <= depth ? "bg-current" : ""}`} />
      ))}
    </span>
  );
}

/** resting pose of each candidate in the fan, by slot count */
const pose = (i: number, n: number) => {
  const mid = (n - 1) / 2;
  const off = i - mid;
  return { rotation: off * 9, y: Math.abs(off) * 16 };
};

/**
 * Face-down candidates in a fan: theme and depth are visible, the question is not.
 * Picking one lifts it to the middle of the table at full card size while the others
 * drop away; `onPick` receives a promise that settles when that motion is over, so the
 * caller can swap in the real card without a jump.
 */
export function Hand({
  color,
  hand,
  canPick,
  onPick,
}: {
  color: number;
  hand: Pick<Question, "theme" | "depth">[];
  canPick: boolean;
  onPick: (slot: number, settled: Promise<unknown>) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  // resting fan + a slow, offset float so the hand feels alive
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-inner]");
      cards.forEach((el, i) => {
        const p = pose(i, cards.length);
        gsap.set(el, { rotation: p.rotation, y: p.y });
        gsap.to(el, {
          y: p.y - 9,
          duration: 2.6 + i * 0.45,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: i * 0.3,
        });
      });
    }, rowRef);
    return () => ctx.revert();
  }, []);

  const pick = (slot: number) => {
    const row = rowRef.current;
    if (!canPick || picked.current || !row) return;
    picked.current = true;

    const inners = gsap.utils.toArray<HTMLElement>("[data-inner]", row);
    const labels = gsap.utils.toArray<HTMLElement>("[data-label]", row);
    const chosen = inners[slot];
    const table = row.parentElement!.getBoundingClientRect();
    const box = chosen.getBoundingClientRect();

    // measure at rest: stop the float, read where the card sits, then travel to the middle at full size
    gsap.killTweensOf(inners);
    const targetW = Math.min(window.innerWidth * 0.76, 330);
    const scale = targetW / chosen.offsetWidth;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const dx = table.left + table.width / 2 - cx;
    const dy = table.top + table.height / 2 - cy;

    chosen.parentElement!.style.zIndex = "30";
    const tl = gsap.timeline();
    tl.to(labels, { opacity: 0, duration: 0.25, ease: "power1.out" }, 0)
      .to(
        inners.filter((_, i) => i !== slot),
        {
          y: "+=90",
          x: (i: number) => (i === 0 ? -50 : 50),
          rotation: (i: number) => (i === 0 ? -22 : 22),
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
        },
        0,
      )
      .to(chosen, { rotation: 0, duration: 0.7, ease: "power3.inOut" }, 0)
      .to(chosen, { x: `+=${dx}`, y: `+=${dy}`, scale, duration: 0.7, ease: "power3.inOut" }, 0)
      .to(chosen, { boxShadow: "0 0 70px 14px var(--accent)", duration: 0.35, yoyo: true, repeat: 1 }, 0.2);

    onPick(slot, tl.then());
  };

  return (
    <div ref={rowRef} className="flex w-full items-start justify-center pb-6">
      {hand.map((h, i) => (
        <button
          key={i}
          data-tile
          disabled={!canPick}
          onClick={() => pick(i)}
          aria-label={`${h.theme}, profondeur ${h.depth}`}
          className="relative flex w-[var(--w)] flex-none flex-col items-center gap-6 disabled:cursor-default"
          style={{
            "--i": i,
            // overlap is a share of the card, so it holds on any window width
            "--w": "min(33vw, 140px)",
            marginLeft: i === 0 ? 0 : "calc(var(--w) * -0.14)",
            zIndex: hand.length - Math.abs(i - (hand.length - 1) / 2) * 2,
          } as React.CSSProperties}
        >
          <div
            data-inner
            className="relative aspect-[5/7] w-full rounded-[7%/5%]"
            style={{ filter: "drop-shadow(0 16px 20px rgba(0,0,0,.5))" }}
          >
            <CardBack color={color} />
          </div>
          <div data-label className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-paper/75">{h.theme}</span>
            <Depth depth={h.depth} />
          </div>
        </button>
      ))}
    </div>
  );
}
