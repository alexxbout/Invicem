"use client";

import gsap from "gsap";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { COLORS } from "@/lib/palette";
import type { Saved } from "@/lib/client";
import { buzz, pick, reduced, requestTilt, slide } from "@/lib/feel";
import { setAccent } from "./Ambient";
import { CardBack } from "./Card";
import { bottomGrip, reach, type Grip } from "./glove/glove";
import { HowTo, howToSeen, subscribeHowTo } from "./HowTo";
import { InstallInvite } from "./InstallInvite";
import { Corner, Vine } from "./joker/JokerClassic";
import { SoundToggle } from "./SoundToggle";
import { Tap } from "./Tap";

const GOLD = "#e0b54a";
const GOLD_DEEP = "#a77a22";
/** small, sharp lights far behind the table (percent of the screen, px size, opacity) */
const FAR_LIGHTS = [
  { x: 12, y: 18, s: 10, o: 0.5 },
  { x: 78, y: 12, s: 8, o: 0.45 },
  { x: 88, y: 34, s: 12, o: 0.35 },
  { x: 22, y: 40, s: 7, o: 0.4 },
  { x: 60, y: 28, s: 6, o: 0.35 },
  { x: 40, y: 8, s: 9, o: 0.3 },
];
/** big, blurred lights in front of everything, like candle flames out of focus */
const NEAR_LIGHTS = [
  { x: -14, y: 70, s: 170, c: "rgba(255,190,120,.35)", o: 0.5 },
  { x: 84, y: 8, s: 130, c: "rgba(255,214,150,.3)", o: 0.45 },
];

/** the card the deck shows on top, before any colour is drawn */
const DECK = { color: 1, symbol: 0 };

/**
 * The opening table: a gilded frame around the whole screen, the engraved title, and the
 * two moves of the game laid out as cards: a deck to draw from, and a card to find the
 * other's colour. A started evening waits as a card of its own. The frame draws itself,
 * the cards are dealt, and everything shifts in depth with the finger or the phone.
 */
export function Home({
  saved,
  onDraw,
  onFind,
  onResume,
}: {
  saved: Saved | null;
  onDraw: () => void;
  onFind: () => void;
  onResume: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const seen = useSyncExternalStore(subscribeHowTo, howToSeen, () => true);
  const [howTo, setHowTo] = useState(false);

  useEffect(() => {
    setAccent("#d9b779");
    const calm = reduced();
    const ctx = gsap.context(() => {
      if (calm) return;
      const draws = gsap.utils.toArray<SVGPathElement>("[data-draw]");
      // the frame draws itself, the title is engraved, then the cards are dealt
      gsap
        .timeline()
        .set(draws, { strokeDasharray: 1, strokeDashoffset: 1 })
        .from("[data-frame-line]", { opacity: 0, scale: 1.04, duration: 0.9, ease: "power2.out", stagger: 0.12 }, 0)
        .to(draws, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.005 }, 0.1)
        .from("[data-letter]", { yPercent: 110, opacity: 0, duration: 0.9, ease: "power4.out", stagger: 0.06 }, 0.35)
        .from("[data-latin]", { opacity: 0, y: 8, duration: 0.8 }, 1)
        .from(
          "[data-deal]",
          {
            y: -260,
            rotation: () => gsap.utils.random(-30, 30),
            opacity: 0,
            duration: 0.9,
            ease: "back.out(1.3)",
            stagger: 0.16,
            onStart: () => slide(),
          },
          0.9,
        )
        .from("[data-label]", { opacity: 0, y: 8, duration: 0.6, stagger: 0.1 }, 1.6);

      // a living deck: now and then its top card lifts a little, as if about to be dealt
      gsap
        .timeline({ repeat: -1, repeatDelay: 5.5, delay: 4.5 })
        .to("[data-top]", { y: -10, x: 3, rotation: 3, duration: 0.5, ease: "power2.out" })
        .to("[data-top]", { y: 0, x: 0, rotation: 0, duration: 0.7, ease: "power2.inOut" }, "+=0.35");

      // the cards on the table breathe a little
      gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el, i) =>
        gsap.to(el, { y: -6, duration: 2.6 + i * 0.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 2 + i * 0.3 }),
      );
    }, root);

    // depth: the frame, the title and the table drift apart with the finger or the phone
    const layers = calm
      ? []
      : gsap.utils.toArray<HTMLElement>("[data-depth]", root.current).map((el) => ({
          k: Number(el.dataset.depth),
          x: gsap.quickTo(el, "x", { duration: 1, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 1, ease: "power3" }),
        }));
    const move = (nx: number, ny: number) =>
      layers.forEach((l) => {
        l.x(nx * l.k);
        l.y(ny * l.k);
      });
    const onPointer = (e: PointerEvent) => move(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      move(Math.max(-0.5, Math.min(0.5, e.gamma / 40)), Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 40)));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      ctx.revert();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  /** the touched card rises to the middle of the table while the rest steps back, then the game takes over */
  const take = (which: "draw" | "find" | "resume", go: () => void, e: React.MouseEvent<HTMLElement>) => {
    if (leaving.current) return;
    leaving.current = true;
    void requestTilt();
    buzz(14);
    pick();
    if (reduced()) return go();
    const card = e.currentTarget.querySelector<HTMLElement>("[data-card]") ?? e.currentTarget;
    const box = card.getBoundingClientRect();
    const dx = window.innerWidth / 2 - (box.left + box.width / 2);
    const dy = window.innerHeight * 0.45 - (box.top + box.height / 2);
    const others = gsap.utils.toArray<HTMLElement>("[data-pick]", root.current).filter((el) => el.dataset.pick !== which);
    gsap.killTweensOf(card.querySelector("[data-top]"));
    const leave = (grip?: Grip) =>
      gsap
        .timeline({ onComplete: go })
        .to(others, { opacity: 0, y: 30, scale: 0.9, duration: 0.4, ease: "power2.in" }, 0)
        // the shadows on the felt go at once, so none is left behind the lifted card
        .to("[data-shadow]", { opacity: 0, duration: 0.2, ease: "power1.out" }, 0)
        .to("[data-title-block], [data-label], [data-invite]", { opacity: 0, y: -12, duration: 0.35, ease: "power2.in" }, 0)
        // the glove carries the card to the middle of the table, then lets go
        .to(card, { x: dx, y: dy, scale: 1.5, rotation: 0, duration: 0.6, ease: "power3.inOut", onUpdate: () => grip?.follow(bottomGrip(card)) }, 0)
        .call(() => void grip?.release(), [], 0.5)
        .to(card, { opacity: 0, scale: "+=0.08", duration: 0.25 }, 0.5);
    // drawing: a white glove comes up and takes the top card off the deck
    if (which === "draw") void reach(bottomGrip(card), { width: box.width * 0.75, side: 0.25 }).then(leave);
    else leave();
  };

  const label = "display whitespace-nowrap text-[17px] leading-tight text-paper";
  const hint = "whitespace-nowrap text-[11.5px] text-paper/50";

  return (
    <div ref={root} className="app-h relative mx-auto flex w-full max-w-md flex-col items-center overflow-hidden px-5">
      {/* depth: far lights, a lamp's pool of light, a soft felt table, and soft
          out-of-focus lights in front. Each layer has its own data-depth for the parallax. */}
      <div data-depth="3" aria-hidden className="pointer-events-none absolute -inset-[30px]">
        {FAR_LIGHTS.map((l, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.s, height: l.s, background: "radial-gradient(circle, rgba(255,214,140,.9), rgba(255,214,140,0) 70%)", opacity: l.o }}
          />
        ))}
      </div>
      {/* the lamp above the table: one source, straight above the cards. Its cone, then its
          pool on the felt; everything else falls off into the dark. */}
      <div
        data-depth="6"
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-6%] h-[90%] w-[140%] -translate-x-1/2"
        style={{
          background: "conic-gradient(from 180deg at 50% 0%, transparent 162deg, rgba(255,220,160,.07) 172deg, rgba(255,226,175,.12) 180deg, rgba(255,220,160,.07) 188deg, transparent 198deg)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)",
        }}
      />
      {/* the felt: a flat, soft ellipse wider than the screen, its far edge a thin gold rim.
          No 3D and no texture, so it costs one painted layer. */}
      <div
        data-depth="12"
        aria-hidden
        className="pointer-events-none absolute inset-x-[-45%] bottom-[-12%] h-[58%] rounded-[50%/22%]"
        style={{
          background:
            "radial-gradient(ellipse 30% 40% at 50% 38%, rgba(255,214,150,.16), rgba(255,214,150,0) 75%), radial-gradient(ellipse 60% 70% at 50% 40%, #3a1c30 0%, #24111e 55%, #13080f 100%)",
          boxShadow: "inset 0 2px 0 rgba(224,181,74,.35), inset 0 30px 40px -10px rgba(0,0,0,.5)",
        }}
      />

      {/* gilded frame around the whole screen */}
      <div
        data-depth="5"
        className="pointer-events-none absolute inset-x-[10px] bottom-[max(10px,env(safe-area-inset-bottom))] top-[max(10px,env(safe-area-inset-top))]"
        aria-hidden
      >
        {/* the frame stands in front of the table: it casts a shadow inwards, like a window */}
        <div className="absolute inset-0 rounded-[22px]" style={{ boxShadow: "inset 0 0 40px 12px rgba(0,0,0,.55), inset 0 0 6px 2px rgba(0,0,0,.4)" }} />
        <div data-frame-line className="absolute inset-0 rounded-[22px] border-2" style={{ borderColor: `${GOLD}66` }} />
        <div data-frame-line className="absolute inset-[7px] rounded-[17px] border" style={{ borderColor: `${GOLD}33` }} />
        <div data-frame-line className="absolute inset-[11px] rounded-[14px] border border-dashed" style={{ borderColor: "#b3243a55" }} />
        {["left-0 top-0", "right-0 top-0 -scale-x-100", "bottom-0 left-0 -scale-y-100", "bottom-0 right-0 -scale-100"].map((pos) => (
          <svg key={pos} viewBox="-4 -4 84 84" className={`absolute size-[78px] ${pos}`}>
            <g transform="translate(6 6)">
              <Corner c={GOLD_DEEP} gold={GOLD} />
            </g>
          </svg>
        ))}
        <svg viewBox="-20 -4 40 96" className="absolute -left-[6px] top-1/2 h-[96px] -translate-y-1/2 overflow-visible">
          <g transform="translate(8 0)">
            <Vine c={GOLD_DEEP} gold={GOLD} />
          </g>
        </svg>
        <svg viewBox="-20 -4 40 96" className="absolute -right-[6px] top-1/2 h-[96px] -translate-y-1/2 -scale-x-100 overflow-visible">
          <g transform="translate(8 0)">
            <Vine c={GOLD_DEEP} gold={GOLD} />
          </g>
        </svg>
      </div>

      <div className="relative z-10 flex w-full items-center justify-between px-[84px] pt-[max(1.4rem,env(safe-area-inset-top))]">
        <Tap
          onClick={() => setHowTo(true)}
          aria-label="Comment on joue"
          className={`grid size-9 place-items-center rounded-full border text-[15px] transition ${
            seen ? "border-white/15 text-paper/55" : "animate-pulse border-gold/60 text-gold"
          }`}
        >
          ?
        </Tap>
        <SoundToggle />
      </div>

      {/* engraved title */}
      <div data-depth="9" data-title-block className="mt-[9dvh] flex flex-col items-center text-center">
        {/* wide light capitals in gold, with a soft shadow copy set a little deeper for relief */}
        <h1
          className="relative pb-1 pl-[0.26em] text-[clamp(40px,12.5vw,58px)] font-semibold uppercase leading-none tracking-[0.26em]"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          aria-label="Invicem"
        >
          <span aria-hidden data-depth="-4" className="absolute inset-x-0 top-[5px] flex pl-[0.26em] text-black/55 blur-[3px]">
            Invicem
          </span>
          <span className="gold-engrave relative flex overflow-hidden">
            {"Invicem".split("").map((l, i) => (
              <span key={i} data-letter className="inline-block">
                {l}
              </span>
            ))}
          </span>
        </h1>
        <p data-latin className="display mt-3 text-[15px] italic text-paper/55">
          l&apos;un l&apos;autre, à tour de rôle
        </p>
      </div>

      <InstallInvite />

      {/* the table */}
      <div data-depth="16" className="relative z-30 mt-auto flex w-full flex-col items-center gap-6 pb-[max(5.2rem,calc(env(safe-area-inset-bottom)+4rem))]">
        {saved && (
          <Tap
            data-pick="resume"
            onClick={(e) => take("resume", onResume, e)}
            className="flex items-center gap-3 active:scale-95"
            aria-label="Reprendre la partie en cours"
          >
            <div data-deal>
              <div data-float>
                <div data-card className="relative aspect-[5/7] w-[46px] -rotate-6" style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,.5))" }}>
                  <CardBack color={saved.color} symbol={saved.symbol} />
                </div>
              </div>
            </div>
            <div data-label className="text-left">
              <div className="display text-[16px] text-paper">Reprendre</div>
              <div className="text-[12px]" style={{ color: COLORS[saved.color].from }}>
                votre partie en cours
              </div>
            </div>
          </Tap>
        )}

        <div className="flex w-full items-end justify-center gap-[6vw]">
          {/* a deck: draw the top card */}
          <Tap
            data-pick="draw"
            onClick={(e) => take("draw", onDraw, e)}
            className="flex w-[min(33vw,138px)] flex-col items-center gap-4"
            aria-label="Tirer une carte"
          >
            <div data-deal className="w-full">
              <div data-float className="relative w-full">
                {/* its shadow on the felt slides the other way when the phone tilts */}
                <div data-depth="-7" data-shadow aria-hidden className="pointer-events-none absolute inset-x-[8%] -bottom-[6%] h-[14%] rounded-[50%]" style={{ background: "radial-gradient(ellipse, rgba(0,0,0,.85), rgba(0,0,0,0) 70%)" }} />
                <div data-card className="relative aspect-[5/7] w-full -rotate-[5deg]">
                  {[3, 2, 1].map((k) => (
                    <div key={k} className="absolute inset-0" style={{ transform: `translate(${k * 2.5}px, ${k * 2.5}px)` }}>
                      <CardBack color={DECK.color} />
                      {/* darkened by a veil rather than a filter: filters repaint on every frame of the deal */}
                      <div className="absolute inset-0 rounded-[7%/5%] bg-black/40" />
                    </div>
                  ))}
                  <div data-top className="absolute inset-0 rounded-[7%/5%]" style={{ boxShadow: "0 14px 18px -4px rgba(0,0,0,.5)" }}>
                    <CardBack color={DECK.color} symbol={DECK.symbol} />
                  </div>
                </div>
              </div>
            </div>
            <div data-label className="text-center">
              <div className={label}>Tirer une carte</div>
              <div className={hint}>je la montre en face</div>
            </div>
          </Tap>

          {/* a face-up card: find the other's colour */}
          <Tap
            data-pick="find"
            onClick={(e) => take("find", onFind, e)}
            className="flex w-[min(33vw,138px)] flex-col items-center gap-4"
            aria-label="Retrouver sa carte"
          >
            <div data-deal className="w-full">
              <div data-float className="relative w-full">
                <div data-depth="-7" data-shadow aria-hidden className="pointer-events-none absolute inset-x-[8%] -bottom-[6%] h-[14%] rounded-[50%]" style={{ background: "radial-gradient(ellipse, rgba(0,0,0,.85), rgba(0,0,0,0) 70%)" }} />
                <div
                  data-card
                  className="relative aspect-[5/7] w-full rotate-[5deg] overflow-hidden rounded-[7%/5%]"
                  style={{
                    background: "linear-gradient(165deg, #f8f0e3, #eadcc6)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.7), 0 14px 18px -4px rgba(0,0,0,.5)",
                    containerType: "inline-size",
                  }}
                >
                  <div className="absolute inset-[4%] rounded-[5%/3.6%] border border-[#b8914d]/60" />
                  <div className="absolute inset-[7%] rounded-[4%/2.8%] border border-[#b8914d]/25" />
                  {/* the eight colours, in a ring */}
                  <div className="absolute left-1/2 top-[44%] aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2">
                    {COLORS.map((c, i) => {
                      const a = (i / COLORS.length) * Math.PI * 2 - Math.PI / 2;
                      return (
                        <span
                          key={c.name}
                          className="absolute size-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                          style={{
                            left: `${50 + Math.cos(a) * 40}%`,
                            top: `${50 + Math.sin(a) * 40}%`,
                            background: `linear-gradient(150deg, ${c.from}, ${c.to})`,
                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.45), 0 2px 4px rgba(0,0,0,.25)",
                          }}
                        />
                      );
                    })}
                    <span className="display absolute inset-0 grid place-items-center text-[12cqw] text-[#8a6a33]">?</span>
                  </div>
                  <div className="display absolute bottom-[10%] left-0 right-0 text-center text-[8cqw] italic text-[#8a6a33]">
                    quelle couleur&nbsp;?
                  </div>
                </div>
              </div>
            </div>
            <div data-label className="text-center">
              <div className={label}>Retrouver sa carte</div>
              <div className={hint}>je cherche celle d&apos;en face</div>
            </div>
          </Tap>
        </div>
      </div>

      {/* in front: big soft out-of-focus lights, moving fastest with the tilt */}
      <div data-depth="34" aria-hidden className="pointer-events-none absolute -inset-[40px] z-40">
        {NEAR_LIGHTS.map((l, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.s, height: l.s, background: `radial-gradient(circle, ${l.c}, transparent 68%)`, opacity: l.o }}
          />
        ))}
      </div>

      {(howTo || !seen) && <HowTo onClose={() => setHowTo(false)} />}
    </div>
  );
}
