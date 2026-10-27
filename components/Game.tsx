"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { armSound, reduced, requestTilt, twinkle } from "@/lib/feel";
import { call, readSaved, subscribeSaved, writeSaved, type Match, type Saved } from "@/lib/client";
import { Ambient, ambient } from "./Ambient";
import { Finder } from "./Finder";
import { Home } from "./Home";
import { Stage } from "./Stage";

type Screen =
  | { k: "home" }
  | { k: "draw"; n: number }
  | { k: "find" }
  | { k: "found"; match: Match }
  | { k: "resume"; saved: Saved };

export function Game() {
  const [screen, setScreenNow] = useState<Screen>({ k: "home" });
  // screens cross-fade through a view transition (Safari 18+, Chrome) instead of cutting:
  // the browser snapshots both and blends them on the compositor, so it costs no frames
  const setScreen = (next: Screen) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    // now and then, between two screens, a constellation shows itself
    if (Math.random() < 0.45) ambient.constellation();
    if (!doc.startViewTransition || reduced()) return setScreenNow(next);
    doc.startViewTransition(() => flushSync(() => setScreenNow(next)));
  };
  const raw = useSyncExternalStore(subscribeSaved, readSaved, () => null);
  const saved: Saved | null = raw ? (JSON.parse(raw) as Saved) : null;
  const home = () => setScreen({ k: "home" });

  // a saved game that was abandoned in the meantime: forget it, so "Reprendre" goes away
  const savedId = saved?.sessionId;
  useEffect(() => {
    if (!savedId || screen.k !== "home") return;
    void call(`/api/session/${savedId}`).then(({ status }) => {
      if (status === 404) writeSaved(null);
    });
  }, [savedId, screen.k]);

  useEffect(() => {
    armSound();
    // iOS only shows its motion prompt from a tap: ask on the very first one, wherever it lands,
    // so the cards follow the phone's tilt from the start
    let asked = false;
    const askTilt = () => {
      if (asked) return;
      asked = true;
      void requestTilt();
      document.removeEventListener("touchend", askTilt);
      document.removeEventListener("click", askTilt);
    };
    // every touch leaves a few sparks of gold where the finger lands; held down, the finger
    // keeps shedding them, following it as it moves
    const burst = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const dot = document.createElement("span");
        const size = 2 + Math.random() * 3.5;
        Object.assign(dot.style, {
          position: "fixed",
          left: `${x - size / 2}px`,
          top: `${y - size / 2}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: i % 3 === 0 ? "#fff6d6" : "#f3d27a",
          boxShadow: "0 0 6px 1px rgba(243,210,122,.8)",
          pointerEvents: "none",
          zIndex: "70",
        });
        document.body.appendChild(dot);
        const angle = Math.random() * Math.PI * 2;
        const dist = 18 + Math.random() * 34;
        gsap.to(dot, {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 10,
          scale: 0,
          opacity: 0,
          duration: 0.55 + Math.random() * 0.4,
          ease: "power2.out",
          onComplete: () => dot.remove(),
        });
      }
    };
    const held = { x: 0, y: 0, timer: 0, loop: 0, beat: 0 };
    const release = () => {
      window.clearTimeout(held.timer);
      window.clearInterval(held.loop);
      held.loop = 0;
    };
    const sparkle = (e: PointerEvent) => {
      if (reduced()) return;
      burst(e.clientX, e.clientY, 9);
      // the sound must never keep the sparks from showing
      try {
        twinkle();
      } catch {}
      held.x = e.clientX;
      held.y = e.clientY;
      release();
      // a long press: a steady trickle of sparks, with a faint glint now and then
      held.timer = window.setTimeout(() => {
        held.beat = 0;
        held.loop = window.setInterval(() => {
          burst(held.x, held.y, 3);
          if (++held.beat % 5 === 0) {
            try {
              twinkle();
            } catch {}
          }
        }, 70);
      }, 320);
    };
    const follow = (e: PointerEvent) => {
      held.x = e.clientX;
      held.y = e.clientY;
    };
    document.addEventListener("pointerdown", sparkle, { passive: true, capture: true });
    document.addEventListener("pointermove", follow, { passive: true });
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    document.addEventListener("touchend", askTilt, { passive: true });
    document.addEventListener("click", askTilt);
    // iOS Safari ignores the viewport's no-zoom: stop pinches (and two-finger moves) by hand;
    // double-tap zoom is already off through touch-action: manipulation
    const stop = (e: Event) => e.preventDefault();
    const twoFingers = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("gesturestart", stop, { passive: false });
    document.addEventListener("gesturechange", stop, { passive: false });
    document.addEventListener("touchmove", twoFingers, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("touchmove", twoFingers);
      document.removeEventListener("touchend", askTilt);
      document.removeEventListener("click", askTilt);
      document.removeEventListener("pointerdown", sparkle, { capture: true });
      document.removeEventListener("pointermove", follow);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      release();
    };
  }, []);

  return (
    <>
      <Ambient />
      {screen.k === "home" && (
        <Home
          saved={saved}
          onDraw={() => setScreen({ k: "draw", n: Date.now() })}
          onFind={() => setScreen({ k: "find" })}
          onResume={() => saved && setScreen({ k: "resume", saved })}
        />
      )}
      {screen.k === "draw" && <Stage key={screen.n} role="a" onExit={home} />}
      {screen.k === "find" && <Finder onBack={home} onMatch={(match) => setScreen({ k: "found", match })} />}
      {screen.k === "found" && <Stage role="b" seed={screen.match} onExit={home} />}
      {screen.k === "resume" && (
        <Stage
          role={screen.saved.role}
          seed={{ ...screen.saved, flipInMs: 0, resume: true }}
          onExit={home}
        />
      )}
    </>
  );
}
