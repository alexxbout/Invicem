"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { armSound } from "@/lib/feel";
import { readSaved, subscribeSaved, type Match, type Saved } from "@/lib/client";
import { Ambient } from "./Ambient";
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
  const [screen, setScreen] = useState<Screen>({ k: "home" });
  const raw = useSyncExternalStore(subscribeSaved, readSaved, () => null);
  const saved: Saved | null = raw ? (JSON.parse(raw) as Saved) : null;
  const home = () => setScreen({ k: "home" });

  useEffect(() => {
    armSound();
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
