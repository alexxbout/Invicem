"use client";

import gsap from "gsap";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type { HandCard } from "@/lib/client";
import { buzz, pick as pickSound, reduced, slide } from "@/lib/feel";
import { motion } from "@/lib/motion";
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
  nudge = false,
  onPick,
  handle,
}: {
  color: number;
  hand: HandCard[];
  canPick: boolean;
  /** glow softly to say "pick one" after a long pause */
  nudge?: boolean;
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
      const fromY = canPick ? 160 : -160;
      const t = motion.tempo();
      cards.forEach((el, i) => {
        const p = pose(i, cards.length);
        // the fan never lands exactly the same way twice
        p.rotation = motion.vary(p.rotation, 0.18);
        const float = () =>
          gsap.to(el, { y: p.y - 9, duration: 2.6 + i * 0.45, yoyo: true, repeat: -1, ease: "sine.inOut" });
        if (calm) {
          gsap.set(el, { rotation: p.rotation, y: p.y, opacity: 1 });
          return;
        }
        const box = el.getBoundingClientRect();
        gsap.fromTo(
          el,
          { x: row.left + row.width / 2 - (box.left + box.width / 2), y: fromY, rotation: canPick ? 0 : 180 - p.rotation, scale: 0.82, opacity: 0 },
          {
            x: 0,
            y: p.y,
            rotation: p.rotation,
            scale: 1,
            opacity: 1,
            duration: motion.vary(0.75 * t, 0.06),
            ease: motion.settle(),
            delay: (0.12 + i * 0.14) * t,
            onStart: () => slide(),
            onComplete: float,
          },
        );
      });
      if (calm) gsap.set("[data-label]", { opacity: 1 });
      else gsap.from("[data-label]", { opacity: 0, y: 8, duration: 0.5, delay: 0.55 + cards.length * 0.12 });
    }, rowRef);
    return () => ctx.revert();
    // dealt once: a new hand remounts with its own key
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /** the card follows the finger upward; a flick or a long enough pull plays it */
  const drag = useRef<{ y: number; t: number; dy: number; el: HTMLElement } | null>(null);
  const grab = (e: React.PointerEvent<HTMLElement>) => {
    if (!canPick || picked.current || reduced()) return;
    drag.current = { y: e.clientY, t: e.timeStamp, dy: 0, el: e.currentTarget };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  /** a pull that sprang back must not count as a tap */
  const sprangAt = useRef(0);
  const pull = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    // upward follows the finger, downward resists
    const raw = e.clientY - d.y;
    d.dy = raw < 0 ? raw * 0.8 : raw * 0.15;
    gsap.set(d.el, { y: d.dy });
  };
  const release = (slot: number, at: number) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return false;
    const speed = d.dy / Math.max(1, at - d.t);
    if (d.dy < -60 || (d.dy < -20 && speed < -0.5)) {
      gsap.to(d.el, { y: 0, duration: 0.5, ease: "power2.out" });
      pick(slot);
      return true;
    }
    if (Math.abs(d.dy) > 8) sprangAt.current = at;
    gsap.to(d.el, { y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    return false;
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
          onClick={(e) => {
            if (e.timeStamp - sprangAt.current > 300) pick(i);
          }}
          onPointerDown={(e) => {
            grab(e);
            press(e.currentTarget.querySelector("[data-inner]"), true);
          }}
          onPointerMove={pull}
          onPointerUp={(e) => {
            release(i, e.timeStamp);
            press(e.currentTarget.querySelector("[data-inner]"), false);
          }}
          onPointerLeave={(e) => press(e.currentTarget.querySelector("[data-inner]"), false)}
          aria-label={h.blank ? "Carte blanche : écrire sa propre question" : `${h.rare ? "Carte rare, " : ""}${h.theme}, profondeur ${h.depth}`}
          className="relative flex w-[var(--w)] flex-none flex-col items-center gap-6 aria-disabled:cursor-default"
          // the finger drags the card, so the browser must not take the gesture for a scroll
          style={
            {
              // overlap is a share of the card, so it holds on any window width
              "--w": "min(33vw, 140px)",
              touchAction: canPick ? "none" : undefined,
              marginLeft: i === 0 ? 0 : "calc(var(--w) * -0.14)",
              zIndex: hand.length - Math.abs(i - (hand.length - 1) / 2) * 2,
            } as React.CSSProperties
          }
        >
          <div
            data-inner
            className={`relative aspect-[5/7] w-full rounded-[7%/5%] opacity-0 ${nudge && canPick ? "nudge" : ""}`}
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
