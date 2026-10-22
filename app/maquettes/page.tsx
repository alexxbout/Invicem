"use client";

import gsap from "gsap";
import { useRef, useState, type ComponentType } from "react";
import type { JesterMood } from "@/components/joker/JesterHead";
import { JokerClassic } from "@/components/joker/JokerClassic";
import { JokerBack } from "@/components/joker/JokerCards";

type Design = ComponentType<{ width?: number; mood?: JesterMood }>;

const Paper: Design = ({ width, mood }) => <JokerClassic width={width} mood={mood === "laugh" ? "play" : "idle"} variant="paper" intro />;
const Night: Design = ({ width, mood }) => <JokerClassic width={width} mood={mood === "laugh" ? "play" : "idle"} variant="night" intro />;

const DESIGNS: { key: string; name: string; note: string; Card: Design }[] = [
  { key: "A", name: "Papier ancien", note: "Le joker des vieux jeux : encre et aplats sur papier vieilli", Card: Paper },
  { key: "B", name: "Nuit", note: "Le même bouffon sur velours violet, cadre or", Card: Night },
];

function MiniQuestion({ w = 120 }: { w?: number }) {
  return (
    <div
      className="grid place-items-center rounded-[7%/5%] px-3 text-center text-[9px] leading-tight text-[#2a2132]"
      style={{ width: w, aspectRatio: "5/7", background: "linear-gradient(165deg,#f8f0e3,#eadcc6)", boxShadow: "inset 0 0 0 1px #b8914d88" }}
    >
      <span style={{ fontFamily: "Georgia, serif" }}>Quel moment voudrais-tu revivre une seule fois ?</span>
    </div>
  );
}

function Phone({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <div className="relative flex h-[360px] w-[190px] flex-col items-center overflow-hidden rounded-[28px] border border-white/15 bg-[#130f1a] px-4 pb-4 pt-8">
        {children}
      </div>
      <figcaption className="max-w-[200px] text-center text-[13px] text-paper/70">{title}</figcaption>
    </figure>
  );
}

const btn = "rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-[11px] text-paper";

/** plays the "joker lands" sequence with a given card design */
function EffectStage({ Card, short = false, onDone }: { Card: Design; short?: boolean; onDone: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const [mood, setMood] = useState<JesterMood>("idle");

  const run = (el: HTMLDivElement | null) => {
    if (!el || el.dataset.ran) return;
    el.dataset.ran = "1";
    const q = el.querySelector("[data-q]");
    const flyer = el.querySelector("[data-flyer]");
    const inner = el.querySelector("[data-inner]");
    const flash = el.querySelector("[data-flash]");
    const confetti = el.querySelector("[data-confetti]") as HTMLElement;

    // gold dust rather than confetti: fine sparks that rise, drift and fade
    const burst = () => {
      for (let i = 0; i < 60; i++) {
        const p = document.createElement("span");
        const size = 1.5 + Math.random() * 3;
        Object.assign(p.style, {
          position: "absolute",
          left: "50%",
          top: "45%",
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: i % 6 === 0 ? "#fff3d6" : "#e3c27a",
          boxShadow: "0 0 8px 2px rgba(227,194,122,.7)",
        });
        confetti.appendChild(p);
        const a = Math.random() * Math.PI * 2;
        const d = 60 + Math.random() * 190;
        gsap
          .timeline({ onComplete: () => p.remove() })
          .to(p, { x: Math.cos(a) * d, y: Math.sin(a) * d, duration: 0.9, ease: "power3.out" })
          .to(p, { y: "-=60", opacity: 0, duration: 1.4, ease: "sine.in" });
      }
    };

    if (short) {
      // "coup de théâtre", ~2.1 s: the joker whips in from the side already turning, lands with a
      // gold shockwave that knocks the question down and away, a quick jig, then it slides off
      const ring = el.querySelector("[data-ring]");
      gsap
        .timeline({ onComplete: onDone })
        .set(flyer, { x: 230, y: 40, scale: 0.55, rotation: 24 })
        .set(inner, { rotationY: -180 })
        .to(flyer, { x: 0, y: 0, scale: 1.06, rotation: -3, duration: 0.48, ease: "power4.out" })
        .to(inner, { rotationY: 0, duration: 0.48, ease: "power3.out" }, "<")
        .call(() => setMood("laugh"))
        .fromTo(ring, { scale: 0.2, opacity: 0.95 }, { scale: 2.4, opacity: 0, duration: 0.75, ease: "power2.out" })
        .to(flash, { opacity: 0.7, duration: 0.06, yoyo: true, repeat: 1 }, "<")
        .to(flyer, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(3)" }, "<")
        .to(q, { y: 60, rotation: 6, opacity: 0, filter: "blur(6px)", scale: 0.9, duration: 0.5, ease: "power2.in" }, "<")
        .to({}, { duration: 0.5 })
        .call(() => setMood("idle"))
        .to(flyer, { x: -40, y: -24, opacity: 0, rotation: -6, scale: 0.92, duration: 0.42, ease: "power2.in" });
      return;
    }

    gsap
      .timeline({ onComplete: onDone })
      .set(flyer, { y: 260, scale: 0.28, rotation: -20 })
      .set(inner, { rotationY: 180 })
      // the joker leaves the hand, spinning up to the table
      .to(flyer, { y: 0, scale: 1, rotation: 0, duration: 0.7, ease: "power3.out" })
      .to(inner, { rotationY: 0, duration: 0.7, ease: "power2.inOut" }, "<")
      // it slams down: flash, confetti, the question is swept off the table
      .to(flash, { opacity: 0.9, duration: 0.08 })
      .call(burst)
      .call(() => setMood("laugh"))
      .to(flash, { opacity: 0, duration: 0.7 })
      .to(flyer, { scale: 1.08, duration: 0.1, yoyo: true, repeat: 1 }, "<")
      .to(q, { x: -60, rotation: -8, opacity: 0, filter: "blur(8px)", scale: 0.92, duration: 0.8, ease: "power2.inOut" }, "<0.1")
      // the jester laughs, then the joker bows out
      .to({}, { duration: 1.3 })
      .call(() => setMood("idle"))
      .to(flyer, { y: -40, scale: 0.85, opacity: 0, rotation: 8, duration: 0.5, ease: "power2.in" });
  };

  return (
    <div ref={stage} className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm">
      <div ref={run} className="relative grid h-[520px] w-[360px] place-items-center">
        <div data-q className="absolute">
          <MiniQuestion w={220} />
        </div>
        <div data-flyer className="absolute" style={{ perspective: 900 }}>
          <div data-inner className="relative" style={{ transformStyle: "preserve-3d" }}>
            <div style={{ backfaceVisibility: "hidden" }}>
              <Card width={220} mood={mood} />
            </div>
            <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <JokerBack width={220} />
            </div>
          </div>
        </div>
        <div
          data-flash
          className="pointer-events-none absolute inset-[-200px] opacity-0"
          style={{ background: "radial-gradient(circle, rgba(227,194,122,.55), rgba(142,27,48,.25) 30%, transparent 55%)" }}
        />
        <div data-confetti className="pointer-events-none absolute inset-0" />
        <div
          data-ring
          className="pointer-events-none absolute size-[220px] rounded-full opacity-0"
          style={{ border: "3px solid #e3c27a", boxShadow: "0 0 30px 6px rgba(227,194,122,.6), inset 0 0 24px rgba(227,194,122,.5)" }}
        />
      </div>
    </div>
  );
}

export default function Maquettes() {
  const [playing, setPlaying] = useState<{ Card: Design; short: boolean } | null>(null);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-14 px-5 py-10">
      <section className="flex flex-col gap-6">
        <h1 className="display text-[30px] font-light">Cartes joker</h1>
        <div className="flex flex-wrap justify-center gap-8">
          {DESIGNS.map(({ key, name, note, Card }) => (
            <figure key={key} className="flex w-[280px] flex-col items-center gap-3">
              <Card width={260} />
              <figcaption className="text-center">
                <div className="display text-[18px]">
                  {key} · {name}
                </div>
                <div className="text-[12px] text-paper/55">{note}</div>
              </figcaption>
              <div className="flex gap-2">
                <button className={btn} onClick={() => setPlaying({ Card, short: true })}>
                  Effet court
                </button>
                <button className={btn} onClick={() => setPlaying({ Card, short: false })}>
                  Effet long
                </button>
              </div>
            </figure>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 text-[12px] text-paper/55">
          <JokerBack width={44} /> Dos commun, quand le joker est en main
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="display text-[26px] font-light">Placement</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <Phone title="1 · En main : les jokers dépassent derrière la carte, comme tenus en éventail">
            <div className="relative">
              <div className="absolute -bottom-3 -left-5 -rotate-[18deg]">
                <JokerBack width={44} />
              </div>
              <div className="absolute -bottom-4 -left-1 -rotate-[6deg]">
                <JokerBack width={44} />
              </div>
              <div className="relative">
                <MiniQuestion />
              </div>
            </div>
            <div className="mt-auto w-full">
              <div className={`${btn} text-center`}>À moi de piocher</div>
            </div>
          </Phone>

          <Phone title="2 · Rangée : les jokers au-dessus d'un bouton pleine largeur">
            <MiniQuestion />
            <div className="mt-auto flex w-full flex-col items-center gap-3">
              <div className="flex items-end gap-1.5">
                <div className="-rotate-[8deg]">
                  <JokerBack width={34} />
                </div>
                <div className="rotate-[8deg]">
                  <JokerBack width={34} />
                </div>
              </div>
              <div className={`${btn} w-full text-center`}>À moi de piocher</div>
            </div>
          </Phone>

          <Phone title="3 · Coin : une petite pile avec un compteur, à côté de la carte">
            <div className="relative">
              <MiniQuestion />
              <div className="absolute -bottom-5 -right-6 rotate-[10deg]">
                <div className="relative">
                  <div className="absolute left-1 top-1 rotate-[8deg]">
                    <JokerBack width={40} />
                  </div>
                  <JokerBack width={40} />
                  <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-[#b3243a] text-[10px] text-white ring-1 ring-[#e3c27a]">
                    2
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-auto w-full">
              <div className={`${btn} text-center`}>À moi de piocher</div>
            </div>
          </Phone>
        </div>
      </section>

      {playing && <EffectStage Card={playing.Card} short={playing.short} onDone={() => setPlaying(null)} />}
    </main>
  );
}
