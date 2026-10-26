"use client";

import { useRef, useState } from "react";
import { blowAway, burnAway } from "@/components/joker/Disintegrate";
import { JokerClassic } from "@/components/joker/JokerClassic";

/** Joker exit mockups: the card blown away like sand, or burned away. Tap to replay. */

function Demo({ name, note, play }: { name: string; note: string; play: typeof blowAway }) {
  const host = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const run = () => {
    const c = card.current!;
    c.style.maskImage = "";
    c.style.webkitMaskImage = "";
    play(c, host.current!, { onDone: () => window.setTimeout(() => setN((x) => x + 1), 600) });
  };
  return (
    <figure className="flex flex-col items-center gap-3">
      <div ref={host} className="relative grid h-[420px] w-[320px] place-items-center overflow-hidden rounded-2xl bg-[#1a1420]" style={{ boxShadow: "inset 0 0 0 1px rgba(217,183,121,.2)" }}>
        <div key={n} ref={card}>
          <JokerClassic width={210} />
        </div>
      </div>
      <button onClick={run} className="rounded-full bg-gradient-to-b from-[#ecd09a] to-[#c79a50] px-7 py-2.5 text-[14px] font-medium text-[#2a1d0a]">
        Jouer
      </button>
      <figcaption className="text-center">
        <div className="text-[15px]" style={{ fontFamily: "Georgia, serif" }}>
          {name}
        </div>
        <div className="mt-0.5 text-[12px] text-[#f4eadb]/55">{note}</div>
      </figcaption>
    </figure>
  );
}

export default function JokerExitMockups() {
  return (
    <main className="min-h-dvh bg-[#130f1a] px-6 py-10 text-[#f4eadb]">
      <h1 className="text-center text-[24px]" style={{ fontFamily: "Georgia, serif" }}>
        Désintégration du joker
      </h1>
      <p className="mt-1 text-center text-[13px] text-[#f4eadb]/55">Touche « Jouer » sous chaque carte</p>
      <div className="mx-auto mt-8 flex flex-wrap justify-center gap-10">
        <Demo name="A. Le sable" note="La carte s'effrite en grains emportés par le vent" play={blowAway} />
        <Demo name="B. La braise" note="Un liseré de feu dévore la carte, les braises montent" play={burnAway} />
      </div>
    </main>
  );
}
