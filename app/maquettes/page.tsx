"use client";

import gsap from "gsap";
import { useRef, useState, type ComponentType } from "react";
import type { JesterMood } from "@/components/joker/JesterHead";
import { JokerBack, JokerDeco, JokerHarlequin, JokerRoyal } from "@/components/joker/JokerCards";

type Design = ComponentType<{ width?: number; mood?: JesterMood }>;

const DESIGNS: { key: string; name: string; note: string; Card: Design }[] = [
  { key: "A", name: "Tarot royal", note: "Velours violet, double cadre or, médaillon rouge, ruban", Card: JokerRoyal },
  { key: "B", name: "Arlequin", note: "Losanges rouges et violets, cartouche or, lettres en colonne", Card: JokerHarlequin },
  { key: "C", name: "Art déco", note: "Soleil d'or, arche rouge, cadre à pans coupés", Card: JokerDeco },
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
function EffectStage({ Card, onDone }: { Card: Design; onDone: () => void }) {
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

    const burst = () => {
      const colors = ["#e3c27a", "#b3243a", "#7a3bb0", "#f4e6d2"];
      for (let i = 0; i < 70; i++) {
        const p = document.createElement("span");
        Object.assign(p.style, {
          position: "absolute",
          left: "50%",
          top: "45%",
          width: `${4 + Math.random() * 6}px`,
          height: `${6 + Math.random() * 10}px`,
          background: colors[i % colors.length],
          borderRadius: "1px",
        });
        confetti.appendChild(p);
        const a = Math.random() * Math.PI * 2;
        const d = 120 + Math.random() * 220;
        gsap
          .timeline({ onComplete: () => p.remove() })
          .to(p, { x: Math.cos(a) * d, y: Math.sin(a) * d - 60, rotation: Math.random() * 720, duration: 0.7, ease: "power3.out" })
          .to(p, { y: "+=220", opacity: 0, rotation: "+=180", duration: 1.4, ease: "power1.in" });
      }
    };

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
      .to(q, { x: -320, rotation: -35, opacity: 0, duration: 0.6, ease: "power2.in" }, "<0.1")
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
          style={{ background: "radial-gradient(circle, rgba(227,194,122,.85), transparent 55%)" }}
        />
        <div data-confetti className="pointer-events-none absolute inset-0" />
      </div>
    </div>
  );
}

export default function Maquettes() {
  const [playing, setPlaying] = useState<Design | null>(null);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-14 px-5 py-10">
      <section className="flex flex-col gap-6">
        <h1 className="display text-[30px] font-light">Cartes joker</h1>
        <div className="flex flex-wrap justify-center gap-8">
          {DESIGNS.map(({ key, name, note, Card }) => (
            <figure key={key} className="flex w-[220px] flex-col items-center gap-3">
              <Card width={200} />
              <figcaption className="text-center">
                <div className="display text-[18px]">
                  {key} · {name}
                </div>
                <div className="text-[12px] text-paper/55">{note}</div>
              </figcaption>
              <button className={btn} onClick={() => setPlaying(() => Card)}>
                Voir l&apos;effet
              </button>
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

      {playing && <EffectStage Card={playing} onDone={() => setPlaying(null)} />}
    </main>
  );
}
