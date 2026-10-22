"use client";

import type { JokerKind } from "@/lib/client";
import { buzz } from "@/lib/feel";
import { JokerClassic } from "./JokerClassic";

/** night sits behind, paper in front, both leaning out from under the question card */
const POSE: Record<JokerKind, { rotate: number; shift: string; z: number }> = {
  night: { rotate: 4, shift: "translate(6%, -52%)", z: 0 },
  paper: { rotate: 12, shift: "translate(0, 0)", z: 1 },
};

/**
 * The jokers the answering player still holds, tucked behind the bottom-right corner of the
 * question card like a hand of cards. Tap one to play it.
 */
export function JokerFan({
  kinds,
  onPlay,
}: {
  kinds: JokerKind[];
  onPlay: (kind: JokerKind, el: HTMLElement) => void;
}) {
  return (
    <div
      className="joker-fan pointer-events-none absolute -right-[11%] bottom-[3%] w-[33%]"
      aria-label="Tes jokers"
    >
      {kinds.map((k) => {
        // the last joker left takes the front place
        const pose = kinds.length === 1 ? POSE.paper : POSE[k];
        return (
          <button
            key={k}
            onClick={(e) => {
              buzz(14);
              onPlay(k, e.currentTarget);
            }}
            aria-label={`Jouer le joker ${k === "paper" ? "papier" : "nuit"} : passer cette carte`}
            className="joker-fan-card pointer-events-auto absolute bottom-0 left-0 w-full"
            style={{
              transform: `${pose.shift} rotate(${pose.rotate}deg)`,
              transformOrigin: "0% 100%",
              zIndex: pose.z,
            }}
          >
            <div className="pointer-events-none" aria-hidden>
              <JokerClassic width="100%" variant={k} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
