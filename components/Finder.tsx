"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { call, msUntil, type Match } from "@/lib/client";
import { requestTilt } from "@/lib/feel";
import { edge } from "./EdgeLight";
import { COLORS, SYMBOLS } from "@/lib/palette";
import { setAccent } from "./Ambient";
import { CardBack } from "./Card";
import { Glyph } from "./Glyph";
import { Screen, Wordmark } from "./Screen";
import { Tap } from "./Tap";

type FindResponse =
  | { result: "none" }
  | { result: "need-symbol" }
  | { result: "matched"; sessionId: string; color: number; symbol: number; flipAt: number; now: number };

export function Finder({ onMatch, onBack }: { onMatch: (m: Match) => void; onBack: () => void }) {
  const [color, setColor] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const noteTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setAccent(color === null ? "#d9b779" : COLORS[color].from);
  }, [color]);

  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  // while looking for the colour, a slow light runs round the screen
  useEffect(() => {
    edge.orbit("slow");
    return () => edge.stop();
  }, []);

  const shake = () => {
    gsap.fromTo(
      gridRef.current,
      { x: 0 },
      { keyframes: { x: [-11, 9, -6, 3, 0] }, duration: 0.5, ease: "power2.out" },
    );
    setNote("Aucune carte comme celle-là. Regarde bien l'écran d'en face.");
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), 3500);
  };

  const find = async (c: number, s?: number, tile?: HTMLElement) => {
    if (busy) return;
    void requestTilt();
    setBusy(true);
    if (tile) gsap.fromTo(tile, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: "elastic.out(1.2,.4)" });
    try {
      const { data, rtt } = await call<FindResponse>("/api/find", "POST", { color: c, symbol: s });
      if (!data) return shake();
      if (data.result === "none") return shake();
      if (data.result === "need-symbol") {
        setNote(null);
        setColor(c);
        return;
      }
      onMatch({
        sessionId: data.sessionId,
        color: data.color,
        symbol: data.symbol,
        flipInMs: msUntil(data.flipAt, data.now, rtt),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Wordmark onBack={color === null ? onBack : () => setColor(null)} />

      <div className="flex flex-1 flex-col justify-center gap-7 py-4">
        <div data-rise className="text-center">
          <h2 className="display text-[26px] font-light leading-snug">
            {color === null ? (
              <>
                Regarde l&apos;écran d&apos;en face.
                <br />
                <em className="text-paper/60">Quelle est la couleur de sa carte&nbsp;?</em>
              </>
            ) : (
              <>
                Plusieurs cartes sont <span style={{ color: COLORS[color].from }}>{COLORS[color].name.toLowerCase()}</span>.
                <br />
                <em className="text-paper/60">Quel est son symbole&nbsp;?</em>
              </>
            )}
          </h2>
        </div>

        {color === null ? (
          <div ref={gridRef} key="colors" className="grid grid-cols-4 gap-x-3 gap-y-5">
            {COLORS.map((c, i) => (
              <Tap
                key={c.name}
                data-tile
                style={{ "--i": i } as React.CSSProperties}
                disabled={busy}
                onClick={(e) => find(i, undefined, e.currentTarget)}
                className="group flex flex-col items-center gap-2 transition active:scale-95"
                aria-label={c.name}
              >
                <div
                  className="relative aspect-[5/7] w-full"
                  style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,.45))" }}
                >
                  <CardBack color={i} />
                </div>
                <span className="text-[11px] tracking-wide text-paper/60">{c.name}</span>
              </Tap>
            ))}
          </div>
        ) : (
          <div ref={gridRef} key="symbols" className="grid grid-cols-4 gap-3">
            {SYMBOLS.map((s, i) => (
              <Tap
                key={s.name}
                data-tile
                disabled={busy}
                onClick={(e) => find(color, i, e.currentTarget)}
                aria-label={s.name}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border transition active:scale-95"
                style={{
                  "--i": i,
                  color: COLORS[color].from,
                  borderColor: `color-mix(in srgb, ${COLORS[color].from} 45%, transparent)`,
                  background: `color-mix(in srgb, ${COLORS[color].from} 10%, transparent)`,
                } as React.CSSProperties}
              >
                <Glyph id={i} className="w-[46%]" strokeWidth={1.3} />
                <span className="text-[10px] tracking-wide text-paper/60">{s.name}</span>
              </Tap>
            ))}
          </div>
        )}

        <p
          className="display h-10 text-center text-[15px] italic text-paper/55 transition-opacity duration-500"
          style={{ opacity: note ? 1 : 0 }}
          aria-live="polite"
        >
          {note}
        </p>
      </div>
    </Screen>
  );
}
