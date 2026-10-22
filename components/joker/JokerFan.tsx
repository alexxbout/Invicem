"use client";

import type { JokerKind } from "@/lib/client";
import { buzz } from "@/lib/feel";
import { JokerClassic } from "./JokerClassic";

/**
 * The answering player's joker, tucked behind the bottom-right corner of the question card
 * like a card held in hand. Tap it to play it.
 */
export function JokerFan({ kinds, onPlay }: { kinds: JokerKind[]; onPlay: (kind: JokerKind, el: HTMLElement) => void }) {
  const joker = kinds[0];
  if (!joker) return null;
  return (
    <div className="joker-fan pointer-events-none absolute -right-[10%] -bottom-[13%] w-[31%]">
      <button
        onClick={(e) => {
          buzz(14);
          onPlay(joker, e.currentTarget);
        }}
        aria-label="Jouer ton joker pour passer cette carte"
        className="joker-fan-card pointer-events-auto relative block w-full"
        style={{ transform: "rotate(12deg)", transformOrigin: "0% 100%" }}
      >
        <div className="pointer-events-none" aria-hidden>
          <JokerClassic width="100%" variant="paper" />
        </div>
      </button>
    </div>
  );
}
