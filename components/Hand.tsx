"use client";

import gsap from "gsap";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type { HandCard } from "@/lib/client";
import { buzz, pick as pickSound, reduced, slide } from "@/lib/feel";
import { BlankBack, CardBack, RareBack } from "./Card";
import { Tap } from "./Tap";

export function Depth({ depth }: { depth: number }) {
  return (
    <span className="flex gap-1.5 text-gold">
      {[1, 2, 3].map((d) => (
        <span key={d} className={`size-[5px] rotate-45 border border-current ${d <= depth ? "bg-current" : ""}`} />
      ))}
    </span>
  );
}

export type HandHandle = {
  /** play the lift-to-centre gesture for a slot; resolves when it is over */
  playPick: (slot: number) => Promise<unknown>;
};

/** resting pose of each candidate in the fan, by slot count */
const pose = (i: number, n: number) => {
  const off = i - (n - 1) / 2;
  return { rotation: off * 9, y: Math.abs(off) * 16 };
};

/**
 * Face-down candidates in a fan: theme and depth are visible, the question is not.
 * The hand is dealt one card at a time from the middle. Picking one lifts it to the
 * table at full card size while the others drop away; `onPick` receives a promise that
 * settles when that motion is over so the caller can swap in the real card without a jump.
 * The partner's phone replays the same gesture through `handle.playPick`.
 */
export function Hand({
  color,
  hand,
  canPick,
  onPick,
  handle,
}: {
  color: number;
  hand: HandCard[];
  canPick: boolean;
  onPick: (slot: number, settled: Promise<unknown>) => void;
  handle?: Ref<HandHandle>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const picked = useRef(false);

  const inners = () => gsap.utils.toArray<HTMLElement>("[data-inner]", rowRef.current);

  // deal from the middle of the table, then float
  useEffect(() => {
    const calm = reduced();
    const ctx = gsap.context(() => {
      const row = rowRef.current!.getBoundingClientRect();
      const cards = inners();
      cards.forEach((el, i) => {
        const p = pose(i, cards.length);
        const float = () =>
          gsap.to(el, { y: p.y - 9, duration: 2.6 + i * 0.45, yoyo: true, repeat: -1, ease: "sine.inOut" });
        if (calm) {
          gsap.set(el, { rotation: p.rotation, y: p.y, opacity: 1 });
          return;
        }
        const box = el.getBoundingClientRect();
        gsap.fromTo(
          el,
          { x: row.left + row.width / 2 - (box.left + box.width / 2), y: -50, rotation: 0, scale: 0.82, opacity: 0 },
          {
            x: 0,
            y: p.y,
            rotation: p.rotation,
            scale: 1,
            opacity: 1,
            duration: 0.75,
            ease: "back.out(1.35)",
            delay: 0.12 + i * 0.14,
            onStart: () => slide(),
            onComplete: float,
          },
        );
      });
      if (calm) gsap.set("[data-label]", { opacity: 1 });
      else gsap.from("[data-label]", { opacity: 0, y: 8, duration: 0.5, delay: 0.55 + cards.length * 0.12 });
    }, rowRef);
    return () => ctx.revert();
  }, []);

  const animatePick = (slot: number) => {
    const row = rowRef.current;
    if (!row || picked.current) return Promise.resolve();
    picked.current = true;

    const cards = inners();
    const labels = gsap.utils.toArray<HTMLElement>("[data-label]", row);
    const chosen = cards[slot];
    if (!chosen) return Promise.resolve();
    const table = row.parentElement!.getBoundingClientRect();

    // stop the float, read where the card sits, then travel to the middle at full size
    gsap.killTweensOf(cards);
    const box = chosen.getBoundingClientRect();
    const targetW = Math.min(window.innerWidth * 0.76, 330);
    const scale = targetW / chosen.offsetWidth;
    const dx = table.left + table.width / 2 - (box.left + box.width / 2);
    const dy = table.top + table.height / 2 - (box.top + box.height / 2);

    chosen.parentElement!.style.zIndex = "30";
    const tl = gsap.timeline();
    tl.to(labels, { opacity: 0, duration: 0.25, ease: "power1.out" }, 0)
      .to(
        cards.filter((_, i) => i !== slot),
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
      // a short lift first, so the card is felt leaving the fan, then the glide to the middle
      .to(chosen, { y: "-=18", scale: 1.06, duration: 0.14, ease: "power2.out" }, 0)
      .to(chosen, { rotation: 0, duration: 0.66, ease: "power3.inOut" }, 0.1)
      .to(chosen, { x: `+=${dx}`, y: `+=${dy + 18}`, scale, duration: 0.66, ease: "power3.inOut" }, 0.1)
      // the halo is drawn once and only its opacity moves: an animated box-shadow repaints every frame
      .to(chosen.querySelector("[data-glow]"), { opacity: 1, duration: 0.35, yoyo: true, repeat: 1 }, 0.2);
    pickSound();
    return tl.then();
  };

  useImperativeHandle(handle, () => ({ playPick: animatePick }));

  const pick = (slot: number) => {
    if (!canPick || picked.current) return;
    buzz(14);
    onPick(slot, animatePick(slot));
  };

  /** the card rises under the finger before the tap completes */
  const press = (el: HTMLElement | null, down: boolean) => {
    if (!canPick || picked.current || !el || reduced()) return;
    gsap.to(el, { scale: down ? 1.06 : 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
  };

  return (
    <div ref={rowRef} className="flex w-full items-start justify-center pb-6">
      {hand.map((h, i) => (
        <Tap
          key={i}
          disabled={!canPick}
          onClick={() => pick(i)}
          onPointerDown={(e) => press(e.currentTarget.querySelector("[data-inner]"), true)}
          onPointerUp={(e) => press(e.currentTarget.querySelector("[data-inner]"), false)}
          onPointerLeave={(e) => press(e.currentTarget.querySelector("[data-inner]"), false)}
          aria-label={h.blank ? "Carte blanche : écrire sa propre question" : `${h.rare ? "Carte rare, " : ""}${h.theme}, profondeur ${h.depth}`}
          className="relative flex w-[var(--w)] flex-none flex-col items-center gap-6 aria-disabled:cursor-default"
          style={
            {
              // overlap is a share of the card, so it holds on any window width
              "--w": "min(33vw, 140px)",
              marginLeft: i === 0 ? 0 : "calc(var(--w) * -0.14)",
              zIndex: hand.length - Math.abs(i - (hand.length - 1) / 2) * 2,
            } as React.CSSProperties
          }
        >
          <div
            data-inner
            className="relative aspect-[5/7] w-full rounded-[7%/5%] opacity-0"
            style={{ filter: "drop-shadow(0 16px 20px rgba(0,0,0,.5))" }}
          >
            <div data-glow className="pointer-events-none absolute inset-0 rounded-[7%/5%] opacity-0" style={{ boxShadow: "0 0 70px 14px var(--accent)" }} />
            {h.rare ? <RareBack /> : h.blank ? <BlankBack /> : <CardBack color={color} />}
          </div>
          <div data-label className="flex flex-col items-center gap-2">
            <span
              className={`text-[10px] font-medium uppercase tracking-[0.18em] ${h.rare ? "text-gold" : "text-paper/75"}`}
            >
              {h.rare ? `✦ ${h.theme}` : h.theme}
            </span>
            {h.blank ? <span className="text-[10px] text-paper/50">à toi d&apos;écrire</span> : <Depth depth={h.depth} />}
          </div>
        </Tap>
      ))}
    </div>
  );
}
