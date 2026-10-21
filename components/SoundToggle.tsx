"use client";

import { useSyncExternalStore } from "react";
import { setSound, soundSnapshot, subscribeSound } from "@/lib/feel";

/** Sound is off until someone turns it on; a tap is also what lets iOS start audio. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const on = useSyncExternalStore(subscribeSound, soundSnapshot, () => "0") === "1";
  return (
    <button
      onClick={() => setSound(!on)}
      aria-label={on ? "Couper le son" : "Activer le son"}
      aria-pressed={on}
      className={`grid size-10 place-items-center rounded-full text-paper/60 transition hover:bg-white/5 hover:text-paper ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
        {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
      </svg>
    </button>
  );
}
