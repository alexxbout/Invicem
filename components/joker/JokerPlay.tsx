"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { buzz, chime, reduced, tick } from "@/lib/feel";
import { JokerBack } from "./JokerCards";
import { JokerClassic, type DanceMood } from "./JokerClassic";

const CARD_W = "min(76vw, 330px)";

/**
 * The joker played onto the table, ~3.2 s, seen on both phones: it whips in already turning
 * (from the tapped card on the player's phone, from the side on the other), lands with a gold
 * shockwave that knocks the question card down and away, jigs, then slides off.
 */
export function JokerPlay({
  from,
  question,
  onDone,
}: {
  /** where the tapped joker was, to start from it; null on the partner's phone */
  from: DOMRect | null;
  /** the question card to knock off the table */
  question: () => HTMLElement | null;
  onDone: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<DanceMood>("idle");

  useEffect(() => {
    const el = stage.current!;
    const flyer = el.querySelector<HTMLElement>("[data-flyer]")!;
    const inner = el.querySelector("[data-inner]");
    const ring = el.querySelector("[data-ring]");
    const flash = el.querySelector("[data-flash]");
    const q = question();

    const box = el.getBoundingClientRect();
    const w = flyer.offsetWidth || 300;
    const start = from
      ? {
          x: from.left + from.width / 2 - (box.left + box.width / 2),
          y: from.top + from.height / 2 - (box.top + box.height / 2),
          scale: from.width / w,
          rotation: 18,
        }
      : { x: box.width * 0.75, y: 40, scale: 0.55, rotation: 24 };

    const calm = reduced();
    const tl = gsap.timeline({ onComplete: onDone });
    tl.set(flyer, { ...start, opacity: 1 })
      .set(inner, { rotationY: from ? 0 : -180 })
      .to(flyer, { x: 0, y: 0, scale: 1.06, rotation: -3, duration: 1, ease: "power3.inOut" })
      .to(inner, { rotationY: from ? 360 : 0, duration: 1, ease: "power2.inOut" }, "<")
      .call(() => {
        setMood("play");
        chime();
        tick();
        buzz([24, 30, 60]);
      })
      .fromTo(ring, { scale: 0.2, opacity: calm ? 0 : 0.95 }, { scale: 2.4, opacity: 0, duration: 0.9, ease: "power2.out" })
      .to(flash, { opacity: calm ? 0 : 0.7, duration: 0.06, yoyo: true, repeat: 1 }, "<")
      .to(flyer, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(3)" }, "<");
    if (q) tl.to(q, { y: 70, rotation: 6, opacity: 0, filter: "blur(6px)", scale: 0.9, duration: 0.6, ease: "power2.in" }, "<");
    tl.to({}, { duration: 0.8 })
      .call(() => setMood("idle"))
      .to(flyer, { x: -40, y: -24, opacity: 0, rotation: -6, scale: 0.92, duration: 0.55, ease: "power2.in" });
    return () => {
      tl.kill();
    };
    // plays once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={stage} className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
      <div
        data-flash
        className="absolute -inset-[30%] opacity-0"
        style={{ background: "radial-gradient(circle, rgba(227,194,122,.55), rgba(142,27,48,.25) 30%, transparent 55%)" }}
      />
      <div
        data-ring
        className="absolute aspect-square w-[min(60vw,240px)] rounded-full opacity-0"
        style={{ border: "3px solid #e3c27a", boxShadow: "0 0 30px 6px rgba(227,194,122,.6), inset 0 0 24px rgba(227,194,122,.5)" }}
      />
      <div data-flyer className="absolute opacity-0" style={{ width: CARD_W, perspective: 900 }}>
        <div data-inner className="relative" style={{ transformStyle: "preserve-3d" }}>
          <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
            <JokerClassic width="100%" variant="paper" mood={mood} />
          </div>
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <JokerBack width="100%" />
          </div>
        </div>
      </div>
    </div>
  );
}
