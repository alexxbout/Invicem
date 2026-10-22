"use client";

import type { JokerKind } from "@/lib/client";
import { buzz } from "@/lib/feel";
import { JokerClassic } from "./JokerClassic";

/**
 * The jokers the answering player still holds, as one small pile tucked behind the
 * bottom-right corner of the question card: the top card shows, a second edge peeks
 * out when there are two, and a gold counter says how many are left. Tap to play one.
 */
export function JokerFan({ kinds, onPlay }: { kinds: JokerKind[]; onPlay: (kind: JokerKind, el: HTMLElement) => void }) {
  const top = kinds[kinds.length - 1];
  if (!top) return null;
  return (
    <div className="joker-fan pointer-events-none absolute -right-[10%] -bottom-[13%] w-[31%]">
      <button
        onClick={(e) => {
          buzz(14);
          onPlay(top, e.currentTarget);
        }}
        aria-label={`Jouer un joker pour passer cette carte, ${kinds.length} restant${kinds.length > 1 ? "s" : ""}`}
        className="joker-fan-card pointer-events-auto relative block w-full"
        style={{ transform: "rotate(12deg)", transformOrigin: "0% 100%" }}
      >
        {kinds.length > 1 && (
          // the second joker: just its edge, like the thickness of a small deck
          <div className="pointer-events-none absolute inset-0 translate-x-[5%] translate-y-[-3%] rotate-[4deg] brightness-75" aria-hidden>
            <JokerClassic width="100%" variant="paper" />
          </div>
        )}
        <div className="pointer-events-none relative" aria-hidden>
          <JokerClassic width="100%" variant="paper" />
        </div>
        <span
          className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full text-[12px] font-semibold text-[#2a1606]"
          style={{ background: "radial-gradient(circle at 35% 30%, #fff1c2, #e0b54a 55%, #a77a22)", boxShadow: "0 0 0 1.5px #3a2a1a, 0 3px 8px rgba(0,0,0,.5)" }}
          aria-hidden
        >
          {kinds.length}
        </span>
      </button>
    </div>
  );
}
