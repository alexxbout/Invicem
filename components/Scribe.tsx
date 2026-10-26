"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { buzz, reduced, reveal, rustle, scratch, wax } from "@/lib/feel";
import { ambient } from "./Ambient";
import { edge } from "./EdgeLight";
import { Quill } from "./Card";

const PAPER = "linear-gradient(165deg, #f8f0e3 0%, #eadcc6 100%)";
const FRAME = "inset 0 0 0 1px rgba(255,255,255,.7), inset 0 -40px 80px rgba(120,80,30,.14), 0 24px 40px -14px rgba(0,0,0,.7)";

function PaperCard({ children, width = "min(76vw, 330px)", ratio = "5 / 7" }: { children: React.ReactNode; width?: string; ratio?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-[7%/5%] text-[#2a2132]"
      style={{ width, aspectRatio: ratio, background: PAPER, boxShadow: FRAME, containerType: "inline-size" }}
    >
      <div className="absolute inset-[3.2%] rounded-[5%/3.6%] border border-[#b8914d]/60" />
      <div className="absolute inset-[5.2%] rounded-[4%/2.8%] border border-[#b8914d]/25" />
      {children}
    </div>
  );
}

/** the blank card, turned over: the picker writes their question right on it */
export function WriteCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // the blank card is taken up like a sheet of paper
  useEffect(() => rustle(), []);

  return (
    <div data-rise>
      <PaperCard>
        <div className="absolute inset-[9%] flex flex-col items-center text-center">
          <div className="flex items-center gap-[2cqw] pt-[2cqw] text-[3.4cqw] font-medium uppercase tracking-[0.3em] text-[#8a6a33]">
            <Quill className="size-[4.4cqw]" /> Carte blanche
          </div>
          <textarea
            autoFocus
            value={value}
            maxLength={140}
            onChange={(e) => {
              // the quill scratches as you write, never as you erase
              if (e.target.value.length > value.length) scratch(0.08);
              onChange(e.target.value);
            }}
            placeholder="Écris ta question…"
            aria-label="Ta question"
            className="hand mt-[4cqw] w-full flex-1 resize-none bg-transparent text-center text-[9cqw] leading-[1.15] text-[#2a2132] outline-none placeholder:text-[#2a2132]/30"
          />
          <div className="pb-[1cqw] text-[3cqw] text-[#8a6a33]/80">{value.length}/140</div>
        </div>
      </PaperCard>
    </div>
  );
}

/** what the other player sees meanwhile: a quill at work */
export function QuillWait({ label }: { label: string }) {
  return (
    <div data-rise>
      <PaperCard>
        <div className="absolute inset-[9%] flex flex-col items-center justify-center gap-[6cqw] text-center">
          <div className="relative h-[16cqw] w-[40cqw]">
            <div className="absolute bottom-[1cqw] left-0 right-0 h-px bg-[#8a6a33]/40" />
            <Quill className="scribble absolute bottom-[2cqw] left-[6cqw] size-[13cqw] text-[#a7741c]" />
          </div>
          <p className="hand text-[8cqw] leading-tight text-[#2a2132]/80">{label}</p>
        </div>
      </PaperCard>
    </div>
  );
}

/** a wax seal, red with a gold star */
export function Seal({ className }: { className?: string }) {
  return (
    <div
      className={`grid aspect-square place-items-center rounded-full text-[#f3d27a] ${className ?? ""}`}
      style={{
        background: "radial-gradient(circle at 38% 32%, #d4485c, #8e1b30 60%, #5e0f1e)",
        boxShadow: "0 0 0 3px rgba(142,27,48,.35), 0 6px 14px rgba(0,0,0,.45), inset 0 -3px 6px rgba(0,0,0,.35)",
      }}
    >
      <span className="text-[45%] leading-none">✦</span>
    </div>
  );
}

/** each player's last word, written then sealed until both are in */
export function WordSeal({
  value,
  onChange,
  sealed,
  partnerSealed,
}: {
  value: string;
  onChange: (v: string) => void;
  sealed: boolean;
  partnerSealed: boolean;
}) {
  const sealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sealed) return;
    wax();
    if (reduced()) return;
    gsap.fromTo(sealRef.current, { scale: 2.2, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: "back.out(2)" });
    buzz(30);
  }, [sealed]);

  return (
    <div data-rise className="flex w-full flex-col items-center gap-6">
      <h2 className="display text-center text-[26px] font-light leading-snug">
        Un mot pour ce soir
        <br />
        <em className="text-[18px] text-paper/55">Il restera caché jusqu&apos;à ce que vous ayez écrit tous les deux.</em>
      </h2>
      <PaperCard width="min(70vw, 280px)" ratio="5 / 4">
        <div className="absolute inset-[10%] flex flex-col items-center justify-center gap-[3cqw]">
          <div className="text-[3.6cqw] font-medium uppercase tracking-[0.3em] text-[#8a6a33]">Ton mot de la fin</div>
          <input
            value={value}
            maxLength={28}
            disabled={sealed}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…"
            aria-label="Ton mot de la fin"
            className="hand w-full bg-transparent text-center text-[13cqw] leading-none text-[#2a2132] outline-none placeholder:text-[#2a2132]/30 disabled:opacity-60"
          />
          <div className="h-px w-[70%] bg-[#8a6a33]/40" />
        </div>
        {sealed && (
          <div ref={sealRef} className="absolute inset-0 grid place-items-center bg-[#eadcc6]/70">
            <Seal className="w-[34%]" />
          </div>
        )}
      </PaperCard>
      <p className="flex items-center gap-2 text-[13px] text-paper/60">
        <span className={`size-2 rounded-full ${partnerSealed ? "bg-accent shadow-[0_0_10px_var(--accent)]" : "bg-white/20"}`} />
        {partnerSealed ? "Son mot est scellé" : "Son mot arrive…"}
      </p>
    </div>
  );
}

/** both words, sealed, turned over at the same instant on both phones */
export function WordsReveal({
  mine,
  theirs,
  delayMs,
  onRevealed,
}: {
  mine: string;
  theirs: string;
  delayMs: number;
  onRevealed: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: delayMs / 1000, onComplete: onRevealed });
      tl.to("[data-word-card]", { scale: 1.06, duration: 0.25, ease: "power2.out", stagger: 0 })
        .to("[data-word-inner]", { rotationY: 180, duration: 1.1, ease: "power3.inOut" }, "<")
        .call(
          () => {
            reveal();
            buzz([30, 40, 120]);
            ambient.burst();
            edge.burst();
          },
          [],
          "<0.55",
        )
        .to("[data-word-card]", { scale: 1, duration: 0.6, ease: "back.out(2)" }, "<0.3")
        .fromTo("[data-word-text]", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2 }, "<");
    }, root);
    return () => ctx.revert();
    // plays once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const face = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;

  return (
    <div ref={root} className="flex w-full flex-col items-center gap-6">
      <h2 data-rise className="display text-center text-[26px] font-light">Vos mots</h2>
      <div className="flex w-full justify-center gap-4">
        {[
          ["Toi", mine],
          ["En face", theirs],
        ].map(([who, word]) => (
          <div key={who} className="flex flex-col items-center gap-3">
            <div data-word-card className="relative w-[min(40vw,170px)]" style={{ aspectRatio: "5 / 7", perspective: 900 }}>
              <div data-word-inner className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                <div className="absolute inset-0" style={face}>
                  <PaperCard width="100%">
                    <div className="absolute inset-0 grid place-items-center">
                      <Seal className="w-[44%]" />
                    </div>
                  </PaperCard>
                </div>
                <div className="absolute inset-0" style={{ ...face, transform: "rotateY(180deg)" }}>
                  <PaperCard width="100%">
                    <div className="absolute inset-[10%] grid place-items-center text-center">
                      <span data-word-text className="hand text-[15cqw] leading-tight text-[#2a2132] opacity-0">
                        {word}
                      </span>
                    </div>
                  </PaperCard>
                </div>
              </div>
            </div>
            <span className="text-[12px] uppercase tracking-[0.24em] text-paper/55">{who}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
