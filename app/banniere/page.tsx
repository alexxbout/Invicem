"use client";

import { BlankBack, CardBack, RareBack } from "@/components/Card";
import { JokerClassic } from "@/components/joker/JokerClassic";
import { Seal } from "@/components/Scribe";
import { Dust, GOLD, GoldDefs, H, Question, Rosette, Slot, Stage, Volute, W } from "./parts";

/** mockup A: a grand night at the opera */

type Item = { kind: "back"; color: number; symbol: number } | { kind: "rare" | "blank" | "joker" } | { kind: "q"; text: string; theme: string; hand?: boolean };

const FAN: Item[] = [
  { kind: "back", color: 0, symbol: 0 },
  { kind: "back", color: 1, symbol: 3 },
  { kind: "back", color: 2, symbol: 5 },
  { kind: "back", color: 3, symbol: 1 },
  { kind: "q", theme: "Souvenirs", text: "Quel est ton plus beau souvenir d'été ?" },
  { kind: "rare" },
  { kind: "joker" },
  { kind: "blank" },
  { kind: "q", theme: "Carte blanche", text: "Quel moment voudrais-tu revivre ?", hand: true },
  { kind: "back", color: 4, symbol: 8 },
  { kind: "back", color: 5, symbol: 6 },
  { kind: "back", color: 6, symbol: 4 },
  { kind: "back", color: 7, symbol: 11 },
];

function Face({ item }: { item: Item }) {
  if (item.kind === "back") return <CardBack color={item.color} symbol={item.symbol} />;
  if (item.kind === "rare") return <RareBack />;
  if (item.kind === "blank") return <BlankBack />;
  if (item.kind === "q") return <Question theme={item.theme} text={item.text} hand={item.hand} size={12} />;
  return (
    <div className="absolute inset-0 grid place-items-center">
      <JokerClassic width={128} />
    </div>
  );
}

/** a draped curtain tied back with a gold rope and tassel */
function Curtain({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 260 640" width="260" height="640" className="absolute top-0" style={{ [flip ? "right" : "left"]: 0, transform: flip ? "scaleX(-1)" : undefined, zIndex: 20 }}>
      <defs>
        <linearGradient id="pleat" x1="0" x2="34" gradientUnits="userSpaceOnUse" spreadMethod="repeat">
          <stop offset="0" stopColor="#2a060d" />
          <stop offset=".35" stopColor="#7a1828" />
          <stop offset=".55" stopColor="#a52a3c" />
          <stop offset=".8" stopColor="#5a101c" />
          <stop offset="1" stopColor="#2a060d" />
        </linearGradient>
        <radialGradient id="curtainShade" cx="0" cy=".6" r="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".55" />
        </radialGradient>
      </defs>
      <path d="M0 0 H250 C 230 160, 150 330, 100 400 C 150 470, 190 560, 200 640 H0 Z" fill="url(#pleat)" />
      <path d="M0 0 H250 C 230 160, 150 330, 100 400 C 150 470, 190 560, 200 640 H0 Z" fill="url(#curtainShade)" />
      {/* tie-back rope */}
      <path d="M0 392 C 40 380, 90 384, 112 398 C 90 414, 40 418, 0 408" fill="none" stroke={GOLD} strokeWidth="5" />
      <path d="M0 392 C 40 380, 90 384, 112 398" fill="none" stroke="#fff1c2" strokeWidth="1" strokeDasharray="3 5" opacity=".7" />
      {/* tassel */}
      <circle cx="110" cy="404" r="7" fill={GOLD} />
      <path d="M104 410 L98 456 H122 L116 410 Z" fill={GOLD} />
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={99 + i * 3.5} y1="430" x2={98 + i * 4} y2="458" stroke="#7a5414" strokeWidth=".8" />
      ))}
    </svg>
  );
}

/** scalloped valance with gold fringe and a crest */
function Valance() {
  const n = 14;
  const step = W / n;
  let d = "M0 0 H1280 V40";
  for (let i = n; i > 0; i--) d += ` Q ${i * step - step / 2} 86, ${(i - 1) * step} 40`;
  d += " Z";
  return (
    <svg viewBox={`0 0 ${W} 110`} width={W} height="110" className="absolute left-0 top-0" style={{ zIndex: 30 }}>
      <defs>
        <linearGradient id="valance" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a0b14" />
          <stop offset="1" stopColor="#8e2232" />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#valance)" />
      <path d={d.replace("M0 0 H1280 V40", "M1280 40").replace(" Z", "")} fill="none" stroke={GOLD} strokeWidth="3" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          {Array.from({ length: 9 }, (_, k) => {
            const t = (k + 1) / 10;
            const x = i * step + t * step;
            const y = 40 + 4 * t * (1 - t) * 46 * 0.5 * 2;
            return <line key={k} x1={x} y1={y} x2={x} y2={y + 9} stroke={GOLD} strokeWidth="1.2" />;
          })}
          <circle cx={i * step} cy="40" r="4" fill={GOLD} />
        </g>
      ))}
      <path d="M0 14 H1280" stroke={GOLD} strokeWidth="1.5" opacity=".7" />
    </svg>
  );
}

/** the gilded crest that crowns the arch */
function Crest() {
  return (
    <svg viewBox="-60 -50 120 100" width="120" className="absolute left-1/2 top-[30px] -translate-x-1/2" style={{ zIndex: 31 }}>
      <path d="M-58 10 C -40 -30, -18 -10, 0 -44 C 18 -10, 40 -30, 58 10 C 40 4, 20 14, 0 40 C -20 14, -40 4, -58 10 Z" fill="#5e0f1e" stroke={GOLD} strokeWidth="2.5" />
      <ellipse rx="22" ry="26" fill="#2a060d" stroke={GOLD} strokeWidth="2.5" />
      <text y="10" textAnchor="middle" fontFamily="Georgia, serif" fontSize="30" fill={GOLD}>
        I
      </text>
    </svg>
  );
}

export default function OperaBanner() {
  const pivot = "50% 380%";
  const step = 6.6;
  return (
    <Stage background="radial-gradient(ellipse 55% 70% at 50% 40%, #4a2440 0%, #22162c 45%, #0c0810 100%)">
      <GoldDefs />

      {/* three crossing spotlights with dust in the beams */}
      {[
        { x: 300, a: 150 },
        { x: 640, a: 180 },
        { x: 980, a: 210 },
      ].map(({ x, a }) => (
        <div
          key={x}
          className="absolute top-[-40px] h-[760px] w-[700px] -translate-x-1/2"
          style={{
            left: x,
            rotate: `${a - 180}deg`,
            transformOrigin: "50% 0",
            background: "conic-gradient(from 180deg at 50% 0%, transparent 166deg, rgba(255,226,170,.12) 174deg, rgba(255,232,190,.18) 180deg, rgba(255,226,170,.12) 186deg, transparent 194deg)",
            mixBlendMode: "screen",
          }}
        />
      ))}
      <Dust count={70} box={[420, 80, 440, 420]} seed={3} />
      <Dust count={30} box={[200, 120, 260, 300]} seed={7} />
      <Dust count={30} box={[820, 120, 260, 300]} seed={11} />

      {/* halo behind the title */}
      <div className="absolute left-1/2 top-[70px] h-[200px] w-[620px] -translate-x-1/2 rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(255,214,140,.22), transparent)" }} />

      <div className="absolute inset-x-0 top-[100px] z-10 text-center">
        <h1 className="gold-engrave display text-[104px] font-light leading-none tracking-[0.04em]">
          <span>Invicem</span>
        </h1>
        <p className="display mt-2 text-[20px] italic text-[#f4eadb]/80">l&apos;un l&apos;autre, à tour de rôle</p>
      </div>

      {/* the great fan of cards */}
      {FAN.map((item, i) => {
        const mid = (FAN.length - 1) / 2;
        const joker = item.kind === "joker";
        return (
          <Slot key={i} x={640 - 59} y={joker ? 262 : 285} w={118} r={(i - mid) * step} origin={pivot} z={joker ? 20 : 10 - Math.abs(i - mid)}>
            <Face item={item} />
          </Slot>
        );
      })}

      {/* wax seals on the boards */}
      <div className="absolute left-[400px] top-[560px] z-30 w-[52px] rotate-[-12deg]">
        <Seal className="w-full text-[26px]" />
      </div>
      <div className="absolute left-[830px] top-[566px] z-30 w-[42px] rotate-[16deg]">
        <Seal className="w-full text-[20px]" />
      </div>

      {/* stage edge with footlights */}
      <div className="absolute inset-x-0 bottom-0 z-30 h-[26px]" style={{ background: "linear-gradient(#5a3a10, #2a1a08)", borderTop: "2px solid #e0b54a" }} />
      {Array.from({ length: 17 }, (_, i) => (
        <span
          key={i}
          className="absolute z-30 h-[9px] w-[16px] rounded-t-full"
          style={{ left: 160 + i * 60, bottom: 22, background: "#fff4d6", boxShadow: "0 0 14px 6px rgba(255,200,110,.55), 0 -30px 60px 10px rgba(255,190,110,.12)" }}
        />
      ))}

      <Curtain />
      <Curtain flip />
      <Valance />
      <Crest />

      {/* gilded volutes framing the proscenium */}
      <Volute size={130} style={{ left: 160, top: 70, zIndex: 32, rotate: "-8deg" }} />
      <Volute size={130} style={{ right: 160, top: 70, zIndex: 32, transform: "scaleX(-1) rotate(-8deg)" }} />
      <Volute size={90} style={{ left: 40, top: 560, zIndex: 32, transform: "scaleY(-1)" }} />
      <Volute size={90} style={{ right: 40, top: 560, zIndex: 32, transform: "scale(-1,-1)" }} />
      <Rosette x={540} y={66} size={26} />
      <Rosette x={740} y={66} size={26} />

      <div className="pointer-events-none absolute inset-0 z-40" style={{ boxShadow: `inset 0 0 140px rgba(0,0,0,.8)`, height: H }} />
    </Stage>
  );
}
