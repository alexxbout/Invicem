"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { COLORS } from "@/lib/palette";
import { reduced } from "@/lib/feel";
import { CardBack } from "./Card";
import { Tap } from "./Tap";

const KEY = "invicem:howto";
/** the colour the demo plays with */
const DEMO = 6;

export const howToSeen = (): boolean => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
};

export function subscribeHowTo(cb: () => void) {
  window.addEventListener("invicem-howto", cb);
  return () => window.removeEventListener("invicem-howto", cb);
}

function markSeen() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {}
  window.dispatchEvent(new Event("invicem-howto"));
}

const STEPS = ["Un téléphone tire une carte et la montre", "L'autre touche la même couleur", "Vos deux cartes se retournent ensemble"];

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[210px] w-[112px] overflow-hidden rounded-[22px] border-2 border-white/20 bg-[#130f1a] shadow-[0_20px_40px_-12px_rgba(0,0,0,.8)]">
      <div className="absolute left-1/2 top-1.5 h-1 w-8 -translate-x-1/2 rounded-full bg-white/15" />
      {children}
    </div>
  );
}

/** a small flip card used in the demo: back with the colour, front with a question */
function DemoCard({ color, symbol }: { color: number; symbol?: number }) {
  const face = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as const;
  return (
    <div className="relative aspect-[5/7] w-[64px]" style={{ perspective: 400 }}>
      <div data-demo-flip className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0" style={face}>
          <CardBack color={color} symbol={symbol} />
        </div>
        <div
          className="absolute inset-0 grid place-items-center rounded-[7%/5%]"
          style={{ ...face, transform: "rotateY(180deg)", background: "linear-gradient(165deg,#f8f0e3,#eadcc6)" }}
        >
          <div className="flex w-[70%] flex-col gap-[5px]">
            {[90, 70, 80].map((w, i) => (
              <span key={i} className="h-[3px] rounded-full bg-[#2a2132]/40" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * First visit: a five-second loop of the ritual on two little phones, so the colour
 * matching makes sense before anyone has to read about it.
 */
export function HowTo({ onClose }: { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
      const show = (i: number) => () => steps.forEach((s, k) => s.classList.toggle("opacity-100", k === i));
      gsap
        .timeline({ repeat: -1, repeatDelay: 0.6 })
        .set("[data-demo-flip]", { rotationY: 0 })
        .set("[data-finger]", { x: 0, y: 0, opacity: 0, scale: 1 })
        .set("[data-target]", { scale: 1, boxShadow: "0 0 0 0 rgba(255,255,255,0)" })
        .set("[data-b-card]", { opacity: 0 })
        .call(show(0))
        .fromTo("[data-a-card]", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.6)" })
        .to("[data-a-card]", { scale: 1.08, duration: 0.3, yoyo: true, repeat: 1 }, "+=0.2")
        .call(show(1), [], "+=0.2")
        .to("[data-finger]", { opacity: 1, duration: 0.2 })
        .to("[data-finger]", { x: -30, y: -38, duration: 0.7, ease: "power2.inOut" })
        .to("[data-finger]", { scale: 0.75, duration: 0.12, yoyo: true, repeat: 1 })
        .to("[data-target]", { scale: 1.25, boxShadow: "0 0 0 3px rgba(255,255,255,.8)", duration: 0.2 }, "<")
        .to("[data-finger]", { opacity: 0, duration: 0.2 }, "+=0.15")
        .to("[data-b-card]", { opacity: 1, duration: 0.3 })
        .call(show(2))
        .to("[data-demo-flip]", { rotationY: 180, duration: 0.9, ease: "power3.inOut" }, "+=0.35")
        .to({}, { duration: 1.4 })
        .to("[data-a-card], [data-b-card]", { opacity: 0, duration: 0.3 });
    }, root);
    return () => ctx.revert();
  }, []);

  const close = () => {
    markSeen();
    onClose();
  };

  return (
    <div ref={root} className="sheet-fade fixed inset-0 z-50 grid place-items-center bg-black/75 px-6 backdrop-blur-sm" role="dialog" aria-modal aria-label="Comment on joue">
      <div className="sheet-up flex w-full max-w-sm flex-col items-center gap-6 rounded-[28px] border border-gold/25 bg-[#1d1727]/95 px-6 pb-6 pt-7">
        <h2 className="display text-[24px] font-light">Comment on joue</h2>
        <p className="-mt-3 text-center text-[13px] text-paper/55">Asseyez-vous côte à côte, un téléphone chacun.</p>

        <div className="flex items-center gap-5">
          <Phone>
            <div data-a-card className="absolute inset-0 grid place-items-center opacity-0">
              <DemoCard color={DEMO} symbol={8} />
            </div>
          </Phone>
          <Phone>
            {/* the palette, then the found card */}
            <div className="absolute inset-x-3 top-8 grid grid-cols-4 gap-2">
              {COLORS.map((c, i) => (
                <span
                  key={c.name}
                  data-target={i === DEMO ? "" : undefined}
                  className="aspect-[5/7] rounded-[3px]"
                  style={{ background: `linear-gradient(150deg, ${c.from}, ${c.to})` }}
                />
              ))}
            </div>
            <div data-b-card className="absolute inset-0 grid place-items-center bg-[#130f1a] opacity-0">
              <DemoCard color={DEMO} symbol={8} />
            </div>
            <span
              data-finger
              className="absolute bottom-10 right-6 size-5 rounded-full border-2 border-white bg-white/40 opacity-0 shadow-[0_0_12px_rgba(255,255,255,.7)]"
            />
          </Phone>
        </div>

        <ol className="flex w-full flex-col gap-2">
          {STEPS.map((s, i) => (
            <li key={s} data-step className={`flex items-center gap-3 text-[14px] text-paper transition-opacity duration-300 ${reduced() ? "opacity-100" : "opacity-35"}`}>
              <span className="display grid size-6 shrink-0 place-items-center rounded-full border border-gold/50 text-[12px] text-gold">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <Tap
          onClick={close}
          className="w-full rounded-full bg-gradient-to-b from-[#ecd09a] to-[#c79a50] py-3.5 text-[15px] font-medium text-[#2a1d0a] transition active:scale-95"
        >
          C&apos;est parti
        </Tap>
      </div>
    </div>
  );
}
