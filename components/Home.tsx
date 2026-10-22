"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { COLORS } from "@/lib/palette";
import type { Saved } from "@/lib/client";
import { requestTilt } from "@/lib/feel";
import { setAccent } from "./Ambient";
import { CardBack } from "./Card";
import { Screen } from "./Screen";
import { SoundToggle } from "./SoundToggle";

const FAN = [
  { color: 4, symbol: 1, rot: -14, x: -64 },
  { color: 1, symbol: 0, rot: 0, x: 0 },
  { color: 6, symbol: 8, rot: 14, x: 64 },
];

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
  const fanRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setAccent("#d9b779");
    const ctx = gsap.context(() => {
      gsap.from("[data-fan]", {
        y: 120,
        opacity: 0,
        rotation: 0,
        x: 0,
        duration: 1.2,
        ease: "back.out(1.4)",
        stagger: 0.12,
        delay: 0.15,
      });
      gsap.from("[data-letter]", {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.05,
        delay: 0.5,
      });
      gsap.utils.toArray<HTMLElement>("[data-fan]").forEach((el, i) => {
        gsap.to(el, {
          y: -9 - i * 2,
          duration: 2.8 + i * 0.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: 1.4 + i * 0.2,
        });
      });
    }, fanRef);
    return () => ctx.revert();
  }, []);

  return (
    <Screen className="justify-between">
      <SoundToggle className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10" />
      <div ref={fanRef} className="flex w-full flex-1 flex-col items-center justify-center gap-[clamp(10px,3dvh,40px)]">
        <div className="relative h-[clamp(96px,21dvh,220px)] w-full">
          {FAN.map((f, i) => (
            <div
              key={i}
              data-fan
              className="absolute left-1/2 top-1/2 aspect-[5/7] w-[clamp(66px,12dvh,128px)]"
              style={{
                transform: `translate(${-50 + (f.x / 64) * 50}%, -50%) rotate(${f.rot}deg)`,
                zIndex: i === 1 ? 2 : 1,
                filter: "drop-shadow(0 18px 24px rgba(0,0,0,.45))",
              }}
            >
              <CardBack color={f.color} symbol={f.symbol} />
            </div>
          ))}
        </div>

        <div className="text-center">
          <h1
            ref={titleRef}
            className="display flex justify-center overflow-hidden pb-2 text-[clamp(46px,8dvh,64px)] font-light leading-none tracking-tight"
            aria-label="Invicem"
          >
            {"Invicem".split("").map((l, i) => (
              <span key={i} data-letter className="inline-block">
                {l}
              </span>
            ))}
          </h1>
          <p className="display mt-3 text-lg italic text-paper/60" data-rise>
            à tour de rôle
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 pb-2 pt-4">
        {saved && (
          <button
            data-rise
            onClick={() => {
              void requestTilt();
              onResume();
            }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-2.5 text-left transition active:scale-[.98]"
          >
            <span
              className="size-3 rounded-full"
              style={{ background: COLORS[saved.color].from, boxShadow: `0 0 14px ${COLORS[saved.color].from}` }}
            />
            <span className="flex-1 text-[15px] text-paper/90">Reprendre la conversation</span>
          </button>
        )}
        <button
          data-rise
          onClick={() => {
            void requestTilt();
            onDraw();
          }}
          className="group rounded-[22px] bg-gradient-to-b from-[#ecd09a] to-[#c79a50] px-6 py-3 text-left text-[#2a1d0a] shadow-[0_10px_40px_-8px_rgba(217,183,121,.55)] transition active:scale-[.97]"
        >
          <span className="display block text-[22px] leading-tight">Tirer une carte</span>
          <span className="text-[13px] opacity-70">Je la montre</span>
        </button>
        <button
          data-rise
          onClick={() => {
            void requestTilt();
            onFind();
          }}
          className="rounded-[22px] border border-gold/40 bg-white/[.03] px-6 py-3 text-left transition active:scale-[.97]"
        >
          <span className="display block text-[22px] leading-tight text-paper">Retourner sa carte</span>
          <span className="text-[13px] text-paper/55">Je retrouve celle d&apos;en face</span>
        </button>
      </div>
    </Screen>
  );
}
