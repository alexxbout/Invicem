"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import type { Duo as DuoKind, Role } from "@/lib/client";
import { buzz, reduced, reveal } from "@/lib/feel";
import { Tap } from "./Tap";

/**
 * A duo card: each player answers for themselves on their own phone, in secret
 * (a cursor between two words, or a single word), then both answers turn over together.
 */
export function DuoPanel({
  duo,
  role,
  sealed,
  answers,
  revealInMs,
  onAnswer,
  onRevealed,
}: {
  duo: DuoKind;
  role: Role;
  sealed: Record<Role, boolean>;
  answers: Record<Role, number | string> | null;
  /** ms until the shared reveal, null until both have answered */
  revealInMs: number | null;
  onAnswer: (value: number | string) => void;
  onRevealed: () => void;
}) {
  const other: Role = role === "a" ? "b" : "a";
  const [value, setValue] = useState(50);
  const [text, setText] = useState("");
  const [shown, setShown] = useState(false);

  // both answers turn over at the same server instant on both phones
  useEffect(() => {
    if (revealInMs === null || !answers) return;
    const t = window.setTimeout(() => {
      setShown(true);
      reveal();
      buzz([20, 30, 60]);
      onRevealed();
    }, revealInMs);
    return () => window.clearTimeout(t);
    // the reveal is scheduled once, when both answers are in
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealInMs, answers !== null]);

  if (shown && answers) {
    return duo.kind === "scale" ? (
      <ScaleReveal low={duo.low} high={duo.high} mine={Number(answers[role])} theirs={Number(answers[other])} />
    ) : (
      <WordsSide mine={String(answers[role])} theirs={String(answers[other])} />
    );
  }

  if (sealed[role]) {
    return (
      <div data-rise className="flex flex-col items-center gap-2 py-3">
        <p className="display text-[16px] italic text-paper/70">{sealed[other] ? "On retourne…" : "Sa réponse arrive…"}</p>
        <p className="text-[12px] text-paper/40">Ta réponse est scellée</p>
      </div>
    );
  }

  return (
    <div data-rise className="flex w-full flex-col items-center gap-4">
      {duo.kind === "scale" ? (
        <div className="w-full max-w-[320px]">
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label={`${duo.low} ou ${duo.high}`}
            className="duo-range w-full"
          />
          <div className="mt-1 flex justify-between text-[12px] text-paper/60">
            <span>{duo.low}</span>
            <span>{duo.high}</span>
          </div>
        </div>
      ) : (
        <input
          value={text}
          maxLength={28}
          onChange={(e) => setText(e.target.value.replace(/\s+/g, " ").trimStart())}
          placeholder="Ton mot…"
          aria-label="Ton mot"
          className="hand w-full max-w-[260px] border-b border-gold/40 bg-transparent pb-1 text-center text-[30px] leading-none text-paper outline-none placeholder:text-paper/25"
        />
      )}
      <Tap
        onClick={() => onAnswer(duo.kind === "scale" ? value : text.trim())}
        disabled={duo.kind === "word" && !text.trim()}
        className="rounded-full bg-gradient-to-b from-[#ecd09a] to-[#c79a50] px-9 py-3 text-[15px] font-medium text-[#2a1d0a] transition active:scale-95 aria-disabled:opacity-40"
      >
        Sceller ma réponse
      </Tap>
    </div>
  );
}

/** the line between the two words, with both cursors gliding to where each of you put them */
function ScaleReveal({ low, high, mine, theirs }: { low: string; high: string; mine: number; theirs: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-mark]", { left: "50%", opacity: 0, duration: 1.2, ease: "power3.out", stagger: 0.15 });
      gsap.from("[data-gap]", { scaleX: 0, opacity: 0, duration: 0.8, delay: 0.9, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);
  const left = Math.min(mine, theirs);
  const width = Math.abs(mine - theirs);
  const close = width <= 12;
  return (
    <div ref={ref} className="flex w-full max-w-[320px] flex-col items-center gap-3">
      <div className="relative mt-7 h-[2px] w-full rounded bg-paper/20">
        <div
          data-gap
          className="absolute -top-[1px] h-[4px] origin-left rounded"
          style={{ left: `${left}%`, width: `${width}%`, background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }}
        />
        {[
          { at: mine, label: "Toi", gold: true },
          { at: theirs, label: "En face", gold: false },
        ].map((m) => (
          <div key={m.label} data-mark className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${m.at}%` }}>
            <span className={`absolute bottom-[14px] whitespace-nowrap text-[11px] ${m.gold ? "text-gold" : "text-paper/70"}`}>{m.label}</span>
            <span className={`size-3.5 rounded-full border-2 ${m.gold ? "border-gold bg-[#2a1d0a]" : "border-paper bg-[#1d1727]"}`} />
          </div>
        ))}
      </div>
      <div className="flex w-full justify-between text-[12px] text-paper/60">
        <span>{low}</span>
        <span>{high}</span>
      </div>
      <p className="display text-[15px] italic text-paper/65">{close ? "Presque au même endroit." : "Parlez de cet écart."}</p>
    </div>
  );
}

/** the two words, side by side, turning over */
function WordsSide({ mine, theirs }: { mine: string; theirs: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-word]", { rotationY: 90, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.12 });
    }, ref);
    return () => ctx.revert();
  }, []);
  const same = mine.toLowerCase() === theirs.toLowerCase();
  return (
    <div ref={ref} className="flex flex-col items-center gap-2" style={{ perspective: 600 }}>
      <div className="flex gap-3">
        {[
          { w: mine, label: "Toi" },
          { w: theirs, label: "En face" },
        ].map((x) => (
          <div key={x.label} data-word className="flex flex-col items-center gap-1">
            <div
              className="hand grid min-w-[120px] place-items-center rounded-lg px-3 py-2 text-[26px] leading-none text-[#2a2132]"
              style={{ background: "linear-gradient(165deg, #f8f0e3, #e3d3ba)", boxShadow: "inset 0 0 0 1px rgba(184,145,77,.6)" }}
            >
              {x.w}
            </div>
            <span className="text-[11px] tracking-wide text-paper/55">{x.label}</span>
          </div>
        ))}
      </div>
      <p className="display text-[15px] italic text-paper/65">{same ? "Le même mot !" : "Racontez-vous."}</p>
    </div>
  );
}
