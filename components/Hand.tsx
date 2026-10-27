"use client";

import gsap from "gsap";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type { HandCard } from "@/lib/client";
import { buzz, pick as pickSound, reduced, slide } from "@/lib/feel";
import { motion } from "@/lib/motion";
import { BlankBack, CardBack, RareBack } from "./Card";
import { bottomGrip, reach, type Grip } from "./glove/glove";
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
  /** a card held down: which one, and the glove that came under it */
  const held = useRef<{ slot: number; grip: Promise<Grip> | null; timer: number } | null>(null);

  const inners = () => gsap.utils.toArray<HTMLElement>("[data-inner]", rowRef.current);

  // deal from the middle of the table, then float
  useEffect(() => {
    const calm = reduced();
    const ctx = gsap.context(() => {}, rowRef);
    // one frame later: the new screen gets painted first, then the deal starts on a quiet frame
    const raf = requestAnimationFrame(() => ctx.add(() => {
      const cards = inners();
      // each card on its own GPU layer, moved as a ready image; the blended sheen waits
      // for the cards to land, so nothing has to be re-blended while they fly
      const sheens = gsap.utils.toArray<HTMLElement>("[data-sheen]", rowRef.current);
      gsap.set(cards, { willChange: "transform, opacity" });
      if (!calm) {
        gsap.set(sheens, { opacity: 0 });
        gsap.to(sheens, { opacity: 1, duration: 0.6, delay: (0.9 + cards.length * 0.14) * motion.tempo() });
      }
      const fromY = canPick ? 160 : -160;
      const t = motion.tempo();
      // a glove deals from where it stays, low on my side (or high, across the table). For each
      // card in turn it turns towards that card's place, moves forward a little, sends the card,
      // and draws back; then it aims at the next one. Once the hand is dealt, it withdraws.
      const boxes = cards.map((el) => el.getBoundingClientRect());
      const order = canPick ? boxes.map((_, i) => i) : boxes.map((_, i) => boxes.length - 1 - i);
      const mid = boxes.length ? boxes[Math.floor(boxes.length / 2)] : null;
      const hold = mid ? { x: mid.left + mid.width / 2, y: canPick ? mid.bottom + mid.height * 0.55 : mid.top - mid.height * 0.55 } : null;
      /** how far the hand turns towards a card's place, in degrees */
      const leanOf = (i: number) =>
        hold ? Math.max(-30, Math.min(30, ((boxes[i].left + boxes[i].width / 2 - hold.x) / boxes[i].width) * 24)) * (canPick ? 1 : -1) : 0;
      const launches: gsap.core.Tween[] = [];
      if (!calm && hold && mid) {
        const base = canPick ? 0 : 180;
        void reach(hold, { width: mid.width * 0.6, angle: base + leanOf(order[0]), duration: 0.28, from: 200, tone: canPick ? "gold" : "red" }).then((g) => {
          const el = g.el;
          if (!el) return order.forEach((i) => launches[i]?.play());
          const hx = Number(gsap.getProperty(el, "x"));
          const hy = Number(gsap.getProperty(el, "y"));
          const tl = gsap.timeline({ onComplete: () => void g.release() });
          order.forEach((i, k) => {
            const a = base + leanOf(i);
            const rad = (a * Math.PI) / 180;
            // aim: turn towards the card's place, the wrist shifting a little that way
            const ax = hx + Math.sin(rad) * 6;
            const ay = hy - Math.cos(rad) * 6 + Math.abs(leanOf(i)) * 0.2;
            tl.to(el, { rotation: a, x: ax, y: ay, duration: k === 0 ? 0.08 : 0.13 * t, ease: "power2.inOut" })
              // the push forward sends the card
              .to(el, {
                x: ax + Math.sin(rad) * 20,
                y: ay - Math.cos(rad) * 20,
                duration: 0.08,
                ease: "power2.out",
                onStart: () => void launches[i]?.play(),
              })
              // and the hand draws back
              .to(el, { x: ax, y: ay, duration: 0.11 * t, ease: "power2.inOut" });
          });
          tl.to(el, { rotation: base, x: hx, y: hy, duration: 0.15, ease: "power2.inOut" }).to({}, { duration: 0.08 });
        });
      }
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
        // each card waits in the glove's hand, and leaves it for its place when pushed
        const b = boxes[i];
        const from = hold ? { x: hold.x - (b.left + b.width / 2), y: hold.y - (b.top + b.height / 2) } : { x: 0, y: fromY };
        launches[i] = gsap.fromTo(
          el,
          { x: from.x, y: from.y, rotation: (canPick ? 0 : 180) + leanOf(i), scale: 0.6, opacity: 0 },
          {
            x: 0,
            y: p.y,
            rotation: p.rotation,
            scale: 1,
            opacity: 1,
            duration: motion.vary(0.42 * t, 0.06),
            ease: motion.settle(),
            paused: !!hold,
            onStart: () => slide(),
            onComplete: float,
          },
        );
      });
      if (calm) gsap.set("[data-label]", { opacity: 1 });
      // the labels come once the cards are on the table
      else gsap.from("[data-label]", { opacity: 0, y: 8, duration: 0.5, delay: 0.4 + cards.length * 0.32 * t });
    }));
    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
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
    // a glove comes up, pinches the card by its bottom edge, and only then lifts it with the
    // motion, letting go near the middle
    let grip: Grip | null = null;
    // a long press may already have brought the glove under this card: it carries on from there
    const pre = held.current?.slot === slot ? held.current.grip : null;
    held.current = null;
    if (!reduced()) {
      tl.pause();
      void (pre ?? reach(bottomGrip(chosen), { width: box.width * 0.55, duration: 0.3, from: 260, tone: canPick ? "gold" : "red" })).then((g) => {
        grip = g;
        tl.play();
      });
    }
    tl.eventCallback("onUpdate", () => grip?.follow(bottomGrip(chosen)));
    tl.call(() => void grip?.release(), [], 0.62);
    pickSound();
    return tl.then();
  };

  useImperativeHandle(handle, () => ({ playPick: animatePick }));

  const pick = (slot: number) => {
    if (!canPick || picked.current) return;
    buzz(14);
    onPick(slot, animatePick(slot));
  };

  /** held down a moment, a card gets the glove under it at once, ready to take it */
  const holdStart = (slot: number, el: HTMLElement | null) => {
    if (!canPick || picked.current || !el || reduced()) return;
    const h = { slot, grip: null as Promise<Grip> | null, timer: 0 };
    h.timer = window.setTimeout(() => {
      h.grip = reach(bottomGrip(el), { width: el.getBoundingClientRect().width * 0.55, duration: 0.22, from: 140 });
    }, 220);
    held.current = h;
  };
  const holdEnd = () => {
    const h = held.current;
    if (!h) return;
    window.clearTimeout(h.timer);
    // a tap that picks the card follows the release: the pick then keeps the glove
    window.setTimeout(() => {
      if (picked.current) return;
      void h.grip?.then((g) => g.release());
      if (held.current === h) held.current = null;
    }, 90);
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
          onPointerDown={(e) => {
            press(e.currentTarget.querySelector("[data-inner]"), true);
            holdStart(i, e.currentTarget.querySelector("[data-inner]"));
          }}
          onPointerUp={(e) => {
            press(e.currentTarget.querySelector("[data-inner]"), false);
            holdEnd();
          }}
          onPointerLeave={(e) => {
            press(e.currentTarget.querySelector("[data-inner]"), false);
            holdEnd();
          }}
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
            className={`relative aspect-[5/7] w-full rounded-[7%/5%] opacity-0 ${nudge && canPick ? "nudge" : ""}`}
            // a box-shadow drawn once with the card, not a filter recomputed on every frame of motion
            style={{ boxShadow: "0 18px 26px -10px rgba(0,0,0,.6)" }}
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
            {h.blank ? (
              <span className="text-[10px] text-paper/50">à toi d&apos;écrire</span>
            ) : h.duo ? (
              <span className="flex items-center gap-1.5 text-[10px] text-gold/80">
                <Depth depth={h.depth} /> à deux
              </span>
            ) : (
              <Depth depth={h.depth} />
            )}
          </div>
        </Tap>
      ))}
    </div>
  );
}
