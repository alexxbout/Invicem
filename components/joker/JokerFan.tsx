"use client";

import type { JokerKind } from "@/lib/client";
import { buzz, pick } from "@/lib/feel";
import { JokerClassic } from "./JokerClassic";
import { Tap } from "../Tap";

/**
 * The answering player's joker, tucked behind the bottom-right corner of the question card
 * like a card held in hand. Tap it to play it.
 */
export function JokerFan({ kinds, onPlay }: { kinds: JokerKind[]; onPlay: (kind: JokerKind, el: HTMLElement) => void }) {
  const joker = kinds[0];
  if (!joker) return null;
  return (
    <div className="joker-fan pointer-events-none absolute -right-[10%] -bottom-[13%] z-20 w-[31%]">
      {/* it slides in from behind the corner, as if drawn from the hand, once the card has turned */}
      <div className="joker-in">
      <Tap
        onClick={(e) => {
          buzz(14);
          pick();
          onPlay(joker, e.currentTarget);
        }}
        aria-label="Jouer ton joker pour passer cette carte"
        className="joker-fan-card pointer-events-auto relative block w-full"
        style={{ transform: "rotate(12deg)", transformOrigin: "0% 100%" }}
      >
        <div className="pointer-events-none" aria-hidden>
          <JokerClassic width="100%" variant="paper" />
        </div>
      </Tap>
      </div>
    </div>
  );
}
