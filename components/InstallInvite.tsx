"use client";

import { useState, useSyncExternalStore } from "react";

const KEY = "invicem:install-later";

/** true when opened in Safari on an iPhone/iPad, not from the home screen */
function inSafariOnIOS(): boolean {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  let later = false;
  try {
    later = sessionStorage.getItem(KEY) === "1";
  } catch {}
  return ios && !standalone && !later;
}

const noop = () => () => {};

/**
 * In Safari on iOS, a card invites to add Invicem to the home screen, where it opens full
 * screen with no browser bars. It can be put aside for the visit; it never blocks the game,
 * so the second player can still join straight from Safari.
 */
export function InstallInvite() {
  const eligible = useSyncExternalStore(noop, inSafariOnIOS, () => false);
  const [closed, setClosed] = useState(false);
  if (!eligible || closed) return null;

  const later = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    setClosed(true);
  };

  return (
    <div data-rise className="relative z-20 mx-auto mt-4 w-full max-w-[320px] rounded-2xl border border-gold/30 bg-[#1d1727]/90 px-4 py-3.5 backdrop-blur">
      <div className="display text-[17px] text-paper">Jouez en plein écran</div>
      <ol className="mt-2 flex flex-col gap-1.5 text-[13px] text-paper/70">
        <li className="flex items-center gap-2">
          <span className="text-gold">1.</span> Touchez
          {/* the iOS share glyph */}
          <svg viewBox="0 0 24 24" className="size-4 text-paper" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-label="Partager">
            <path d="M12 3v12M8 7l4-4 4 4M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
          </svg>
          en bas de Safari
        </li>
        <li className="flex items-center gap-2">
          <span className="text-gold">2.</span> puis « Sur l&apos;écran d&apos;accueil »
        </li>
      </ol>
      <button onClick={later} className="absolute right-3 top-3 text-[12px] text-paper/45 underline-offset-4 hover:underline">
        Plus tard
      </button>
    </div>
  );
}
