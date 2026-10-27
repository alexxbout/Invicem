"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import type { Duo as DuoKind, Role } from "@/lib/client";
import { buzz, reduced, reveal, scratch } from "@/lib/feel";
import { Quill } from "./Card";
import { Tap } from "./Tap";

/** the five notches of a scale, named so each position means something */
export const notches = (low: string, high: string) => {
  const lc = (w: string) => w.charAt(0).toLowerCase() + w.slice(1);
  return [low, `Plutôt ${lc(low)}`, "Entre les deux", `Plutôt ${lc(high)}`, high];
};
const notchOf = (v: number) => Math.round(Math.max(0, Math.min(100, v)) / 25);

/**
 * The word, written on the card itself with a quill. Once both are turned over, the other's
 * word writes itself on the line under mine, letter by letter, as if their pen were moving.
 */
export function WordOnCard({
  value,
  onChange,
  sealed,
  theirs,
}: {
  value: string;
  onChange: (v: string) => void;
  sealed: boolean;
  /** the other's word, once revealed */
  theirs?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!theirs || !ref.current) return;
    const letters = ref.current.querySelectorAll("[data-l]");
    scratch(Math.min(1.6, letters.length * 0.09), 0.25);
    if (reduced()) return;
    gsap.fromTo(letters, { opacity: 0, y: 2, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, stagger: 0.09, delay: 0.25, ease: "power1.out" });
  }, [theirs]);

  const line = "relative flex w-[80%] items-end gap-[2cqw] border-b border-[#b8914d]/60 pb-[1cqw]";
  const ink = "hand flex-1 text-center text-[10cqw] leading-none";
  return (
    <div className="mt-[7cqw] flex w-full flex-col items-center gap-[3cqw]">
      <div className={line}>
        <Quill className="mb-[1cqw] w-[7cqw] shrink-0 text-[#a77a22]" />
        {sealed || theirs ? (
          <span className={`${ink} text-[#2a2132]/80`}>{value}</span>
        ) : (
          <input
            value={value}
            maxLength={28}
            onChange={(e) => onChange(e.target.value.replace(/\s+/g, " ").trimStart())}
            placeholder="ton mot…"
            aria-label="Ton mot"
            className={`${ink} w-0 bg-transparent text-[#2a2132] outline-none placeholder:text-[#2a2132]/25`}
          />
        )}
        {theirs && <span className="absolute -bottom-[4.2cqw] left-0 text-[2.8cqw] uppercase tracking-[0.2em] text-[#8a6a33]">toi</span>}
      </div>
      {theirs && (
        <div className={line}>
          <Quill className="mb-[1cqw] w-[7cqw] shrink-0 -scale-x-100 text-[#a77a22]" />
          <div ref={ref} className={`${ink} text-[#6e2a1e]`} aria-label={theirs}>
            {[...theirs].map((ch, i) => (
              <span key={i} data-l className="inline-block">
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
          </div>
          <span className="absolute -bottom-[4.2cqw] left-0 text-[2.8cqw] uppercase tracking-[0.2em] text-[#8a6a33]">en face</span>
        </div>
      )}
    </div>
  );
}

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
  word = "",
  onAnswer,
  onRevealed,
}: {
  duo: DuoKind;
  role: Role;
  sealed: Record<Role, boolean>;
  answers: Record<Role, number | string> | null;
  /** ms until the shared reveal, null until both have answered */
  revealInMs: number | null;
  /** the word being written on the card, for a "word" duo */
  word?: string;
  onAnswer: (value: number | string) => void;
  onRevealed: () => void;
}) {
  const other: Role = role === "a" ? "b" : "a";
  const [notch, setNotch] = useState(2);
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
      <p data-rise className="display py-2 text-[17px] italic text-paper/75">
        {String(answers[role]).toLowerCase() === String(answers[other]).toLowerCase() ? "Le même mot !" : "Racontez-vous."}
      </p>
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
      {duo.kind === "scale" && (
        <div className="w-full max-w-[320px]">
          {/* the notch under the cursor, in words */}
          <p className="display mb-1 text-center text-[21px] text-gold">{notches(duo.low, duo.high)[notch]}</p>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={notch}
            onChange={(e) => setNotch(Number(e.target.value))}
            aria-label={`${duo.low} ou ${duo.high}`}
            aria-valuetext={notches(duo.low, duo.high)[notch]}
            className="duo-range w-full"
          />
        </div>
      )}
      <Tap
        onClick={() => onAnswer(duo.kind === "scale" ? notch * 25 : word.trim())}
        disabled={duo.kind === "word" && !word.trim()}
        className="rounded-full bg-gradient-to-b from-[#ecd09a] to-[#c79a50] px-9 py-3 text-[15px] font-medium text-[#2a1d0a] transition active:scale-95 aria-disabled:opacity-40"
      >
        {duo.kind === "word" ? "Sceller mon mot" : "Sceller ma réponse"}
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
  const same = notchOf(mine) === notchOf(theirs);
  return (
    <div ref={ref} className="flex w-full max-w-[320px] flex-col items-center gap-3">
      <div className="relative mt-7 h-[2px] w-full rounded bg-paper/20">
        <div
          data-gap
          className="absolute -top-[1px] h-[4px] origin-left rounded"
          style={{ left: `${left}%`, width: `${width}%`, background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }}
        />
        {/* on the same notch, one shared mark instead of two on top of each other */}
        {(same
          ? [{ at: mine, label: "Vous deux", gold: true }]
          : [
              { at: mine, label: "Toi", gold: true },
              { at: theirs, label: "En face", gold: false },
            ]
        ).map((m) => (
          <div key={m.label} data-mark className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${m.at}%` }}>
            <span className={`absolute bottom-[14px] whitespace-nowrap text-[11px] ${m.gold ? "text-gold" : "text-paper/70"}`}>{m.label}</span>
            <span className={`size-3.5 rounded-full border-2 ${m.gold ? "border-gold bg-[#2a1d0a]" : "border-paper bg-[#1d1727]"}`} />
          </div>
        ))}
      </div>
      {same ? (
        <p className="text-[13px] text-gold">Vous deux : {notches(low, high)[notchOf(mine)]}</p>
      ) : (
        <div className="grid w-full grid-cols-2 gap-2 text-center">
          <p className="text-[13px] text-gold">Toi : {notches(low, high)[notchOf(mine)]}</p>
          <p className="text-[13px] text-paper/75">En face : {notches(low, high)[notchOf(theirs)]}</p>
        </div>
      )}
    </div>
  );
}
