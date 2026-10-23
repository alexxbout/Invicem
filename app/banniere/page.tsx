"use client";

import type { CSSProperties, ReactNode } from "react";
import { BlankBack, CardBack, RareBack } from "@/components/Card";
import { JokerClassic } from "@/components/joker/JokerClassic";
import { Seal } from "@/components/Scribe";

/** README banner: a theatre stage with the whole deck laid out under a spotlight (1280×640) */

function Slot({ x, y, w, r, z = 1, children }: { x: number; y: number; w: number; r: number; z?: number; children: ReactNode }) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        aspectRatio: "5 / 7",
        rotate: `${r}deg`,
        zIndex: z,
        filter: "drop-shadow(0 18px 24px rgba(0,0,0,.55))",
      }}
    >
      {children}
    </div>
  );
}

function Question({ text, theme, hand = false }: { text: string; theme: string; hand?: boolean }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[7%/5%] text-[#2a2132]"
      style={{ background: "linear-gradient(165deg, #f8f0e3 0%, #eadcc6 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.7)" }}
    >
      <div className="absolute inset-[3.2%] rounded-[5%/3.6%] border border-[#b8914d]/60" />
      <div className="absolute inset-x-0 top-[11%] text-center text-[9px] uppercase tracking-[0.3em] text-[#8a6a33]">{theme}</div>
      <div className={`absolute inset-x-[12%] top-1/2 -translate-y-1/2 text-center leading-snug ${hand ? "hand text-[21px]" : "display text-[16px]"}`}>
        {text}
      </div>
      <div className="absolute inset-x-0 bottom-[9%] text-center text-[10px] text-[#b8914d]">◆◆◇</div>
    </div>
  );
}

/** heavy velvet curtain, pleats drawn with repeating gradients */
function Curtain({ side }: { side: "left" | "right" }) {
  const style: CSSProperties = {
    [side]: 0,
    width: 190,
    background:
      "repeating-linear-gradient(90deg, #3a0b14 0px, #6e1624 22px, #8e2232 34px, #5a101c 52px, #2a060d 64px)",
    maskImage: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, #000 55%, transparent)`,
    borderRadius: side === "left" ? "0 0 100% 0 / 0 0 22% 0" : "0 0 0 100% / 0 0 0 22%",
  };
  return <div className="absolute inset-y-0" style={style} />;
}

export default function Banner() {
  return (
    <main className="grid min-h-dvh place-items-center bg-black">
      <div
        className="relative overflow-hidden"
        style={{
          width: 1280,
          height: 640,
          background: "radial-gradient(ellipse 60% 75% at 50% 38%, #3d2135 0%, #1d1727 45%, #0d0a12 100%)",
        }}
      >
        {/* spotlight cone from above */}
        <div
          className="absolute left-1/2 top-[-120px] h-[820px] w-[760px] -translate-x-1/2"
          style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 152deg, rgba(255,226,170,.13) 168deg, rgba(255,226,170,.2) 180deg, rgba(255,226,170,.13) 192deg, transparent 208deg)" }}
        />
        {/* the table cloth: a green-black felt ellipse catching the light */}
        <div
          className="absolute left-1/2 top-[350px] h-[420px] w-[1300px] -translate-x-1/2 rounded-[50%]"
          style={{ background: "radial-gradient(ellipse at 50% 30%, #2a1a2a 0%, #170f1c 55%, transparent 72%)" }}
        />

        <Curtain side="left" />
        <Curtain side="right" />
        {/* valance across the top */}
        <div
          className="absolute inset-x-0 top-0 h-[46px]"
          style={{
            background: "linear-gradient(#4a0c18, #6e1624)",
            boxShadow: "0 6px 18px rgba(0,0,0,.6)",
          }}
        />
        <div className="absolute inset-x-0 top-[46px] h-[3px]" style={{ background: "linear-gradient(90deg, transparent, #d9b779, transparent)" }} />

        {/* title */}
        <div className="absolute inset-x-0 top-[70px] text-center">
          <h1 className="gold-engrave display text-[118px] font-light leading-none tracking-[0.04em]">
            <span>Invicem</span>
          </h1>
          <p className="display mt-3 text-[22px] italic text-[#f4eadb]/75">l&apos;un l&apos;autre, à tour de rôle</p>
          <p className="mt-2 text-[13px] uppercase tracking-[0.42em] text-[#d9b779]/80">Un jeu de cartes pour deux</p>
        </div>

        {/* the deck, fanned across the table */}
        <Slot x={170} y={360} w={150} r={-24}>
          <CardBack color={1} symbol={0} />
        </Slot>
        <Slot x={275} y={335} w={160} r={-13} z={2}>
          <CardBack color={0} symbol={10} />
        </Slot>
        <Slot x={400} y={345} w={168} r={-6} z={3}>
          <Question theme="Souvenirs" text="Quel est le premier souvenir qui te vient de l'enfance ?" />
        </Slot>
        <Slot x={553} y={300} w={176} r={0} z={5}>
          <div className="absolute inset-0 grid place-items-center">
            <JokerClassic width={176} />
          </div>
        </Slot>
        <Slot x={712} y={345} w={168} r={6} z={4}>
          <Question theme="Carte blanche" text="Quel moment voudrais-tu revivre ?" hand />
        </Slot>
        <Slot x={838} y={335} w={160} r={14} z={3}>
          <RareBack />
        </Slot>
        <Slot x={960} y={360} w={150} r={24} z={2}>
          <BlankBack />
        </Slot>

        {/* wax seals dropped on the cloth */}
        <div className="absolute left-[470px] top-[575px] z-10 w-[58px] rotate-[-12deg]">
          <Seal className="w-full text-[30px]" />
        </div>
        <div className="absolute left-[790px] top-[575px] z-10 w-[46px] rotate-[18deg]">
          <Seal className="w-full text-[24px]" />
        </div>

        {/* footlights glow */}
        <div className="absolute inset-x-0 bottom-0 h-[70px]" style={{ background: "linear-gradient(transparent, rgba(255,190,110,.12))" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 160px rgba(0,0,0,.85)" }} />
      </div>
    </main>
  );
}
