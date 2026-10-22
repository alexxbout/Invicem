"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import {
  call,
  msUntil,
  usePoll,
  writeSaved,
  type Criteria as CriteriaValue,
  type Match,
  type Question,
  type Role,
  type SessionView,
} from "@/lib/client";
import { reduced } from "@/lib/feel";
import { THEME_GLYPH } from "@/lib/labels";
import { COLORS, SYMBOLS } from "@/lib/palette";
import { ambient, setAccent } from "./Ambient";
import { Card } from "./Card";
import { Criteria } from "./Criteria";
import { Depth, Hand, type HandHandle } from "./Hand";
import { Glyph } from "./Glyph";
import { JokerFlash, JokerToken } from "./Joker";
import { History } from "./History";
import { Sheet } from "./Sheet";
import { SoundToggle } from "./SoundToggle";
import { Screen, Wordmark } from "./Screen";

type Mode = "drawing" | "waiting" | "charging" | "open" | "full";

type CardInfo = { id?: string; color: number; symbol: number };

type DrawResponse = { id: string; color: number; symbol: number };
type StatusResponse =
  | { state: "waiting" }
  | { state: "expired" }
  | { state: "matched"; sessionId: string; flipAt: number; now: number };

/** the evening laid out once the closing card is answered */
function Recap({ items }: { items: Question[] }) {
  return (
    <div data-rise className="flex max-h-[62dvh] w-full flex-col gap-5">
      <h2 className="display text-center text-[28px] font-light leading-snug">
        Votre soirée
        <br />
        <em className="text-[20px] text-paper/55">
          {items.length} {items.length > 1 ? "questions partagées" : "question partagée"}
        </em>
      </h2>
      <ol className="-mx-1 space-y-2.5 overflow-y-auto px-1">
        {items.map((q, i) => (
          <li
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3"
            style={{ animation: `rise .6s cubic-bezier(.2,.7,.2,1) ${0.15 + i * 0.07}s both` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-paper/50">{q.theme}</span>
              <Depth depth={q.depth} />
            </div>
            <p className="display text-[16px] leading-snug text-paper/90">{q.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Whether this phone shows the question face. The one answering only hears it read aloud: their
 * card stays face down. The opening card is the shared reveal, so both see it.
 */
const faceUpFor = (v: SessionView, role: Role) =>
  onTable(v.phase) && !(v.phase === "card" && v.turn !== role && !(v.round === 1 && v.history.length === 0));

/** what the hidden question is about, laid over the back for the one listening */
function Listening({ question }: { question: Question }) {
  return (
    <div className="pointer-events-none absolute inset-x-[9%] bottom-[9%] flex flex-col items-center gap-1.5 rounded-xl bg-black/35 px-3 py-2.5 text-center backdrop-blur-[2px]">
      <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/90">{question.theme}</span>
      <Depth depth={question.depth} />
    </div>
  );
}

/** phases where a card lies face up on the table */
const onTable = (p: SessionView["phase"]) => p === "card" || p === "closing";

/**
 * The evening as a row of seven small cards: the ones already played lie face up with their
 * theme's symbol, the one on the table glows, the rest are empty slots. Tap to reread them.
 */
function Frise({ view, onOpen }: { view: SessionView; onOpen: () => void }) {
  const asked = [...view.history].reverse();
  if (view.phase === "card" && view.question) asked.push(view.question);
  const start = view.goal - 7;
  return (
    <button
      onClick={onOpen}
      disabled={asked.length === 0}
      aria-label={`Question ${view.round} sur ${view.goal}, revoir les cartes`}
      className="flex items-end justify-center gap-1.5 rounded-xl px-2 py-1 transition active:scale-95 disabled:cursor-default"
    >
      {Array.from({ length: 7 }, (_, k) => {
        const q = asked[start + k];
        const current = view.phase === "card" && start + k === view.round - 1;
        return (
          <span
            key={k}
            className={`grid aspect-[5/7] w-[22px] place-items-center rounded-[4px] border transition-all duration-700 ${current ? "-translate-y-1" : ""}`}
            style={
              q
                ? {
                    background: "linear-gradient(165deg, #f8f0e3, #e3d3ba)",
                    borderColor: current ? "var(--accent)" : "rgba(184,145,77,.5)",
                    boxShadow: current ? "0 0 12px var(--accent)" : `0 0 ${(q.depth - 1) * 4}px color-mix(in srgb, var(--accent) 60%, transparent)`,
                    opacity: current ? 1 : 0.55 + q.depth * 0.12,
                  }
                : { borderColor: "rgba(244,234,219,.18)", borderStyle: "dashed" }
            }
          >
            {q && <Glyph id={THEME_GLYPH[q.theme] ?? 3} className="w-[70%] text-[#8a6a33]" strokeWidth={1.8} />}
          </span>
        );
      })}
    </button>
  );
}

function QuestionFace({ question, play }: { question: Question; play: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);

  // words surface one after another once the card is turned
  useEffect(() => {
    const words = ref.current?.querySelectorAll("[data-w]");
    if (!words) return;
    if (!play || reduced()) {
      gsap.set(words, { opacity: play ? 1 : 0, y: 0, filter: "none" });
      return;
    }
    gsap.fromTo(
      words,
      { opacity: 0, y: 10, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power2.out", stagger: 0.05, delay: 0.5 },
    );
  }, [play]);

  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="pt-[2cqw] text-[3.4cqw] font-medium uppercase tracking-[0.3em] text-[#8a6a33]">
        {question.theme}
      </div>
      <div className="flex flex-1 items-center px-[2cqw]">
        <p ref={ref} className="display text-[7cqw] leading-[1.2]">
          {question.text.split(" ").map((w, i) => (
            <span key={i}>
              <span data-w className="inline-block">
                {w}
              </span>{" "}
            </span>
          ))}
        </p>
      </div>
      <div className="flex gap-[2cqw] pb-[2cqw] text-[#b8914d]">
        {[1, 2, 3].map((d) => (
          <span key={d} className={`size-[2.2cqw] rotate-45 border border-current ${d <= question.depth ? "bg-current" : ""}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * One table for both players: the card is drawn (role a) or found (role b),
 * both phones charge, flip at the same server instant, then trade questions.
 */
export function Stage({
  role,
  seed,
  onExit,
}: {
  role: Role;
  /** set when the partner found the card, or when resuming a saved table */
  seed?: Match & { resume?: boolean };
  onExit: () => void;
}) {
  const [card, setCard] = useState<CardInfo | null>(seed ? { color: seed.color, symbol: seed.symbol } : null);
  const [sessionId, setSessionId] = useState<string | null>(seed?.sessionId ?? null);
  const [mode, setMode] = useState<Mode>(seed ? (seed.resume ? "open" : "charging") : "drawing");
  const [shown, setShown] = useState<SessionView | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [firstReveal, setFirstReveal] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  /** bumped to replay the joker flash on both phones */
  const [jokerFx, setJokerFx] = useState(0);
  const editedAt = useRef(0);
  const editSeq = useRef(0);
  const handRef = useRef<HandHandle>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const cardRef = useRef<CardInfo | null>(card);
  const modeRef = useRef<Mode>(mode);
  const shownRef = useRef<SessionView | null>(null);
  const flipDue = useRef(false);
  const busy = useRef(false);
  const latest = useRef<SessionView | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const setModeBoth = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
  };

  const commitView = (v: SessionView) => {
    shownRef.current = v;
    setShown(v);
  };

  /** first reveal needs the timer AND the question; whichever lands last triggers it */
  const tryReveal = (sid: string) => {
    if (!flipDue.current || !shownRef.current || !alive.current) return;
    flipDue.current = false;
    setModeBoth("open");
    setFlipped(true);
    const c = cardRef.current;
    if (c) writeSaved({ sessionId: sid, color: c.color, symbol: c.symbol, role });
  };

  const startCharging = async (sid: string, flipInMs: number) => {
    setSessionId(sid);
    setModeBoth("charging");
    flipDue.current = false;
    later(() => {
      flipDue.current = true;
      tryReveal(sid);
    }, flipInMs);
    const { data, ok } = await call<SessionView>(`/api/session/${sid}`);
    if (ok && data && alive.current) {
      commitView(data);
      tryReveal(sid);
    }
  };

  /** every step: flip face down, apply the new state, then flip up again if a question is on the table */
  const showNext = (v: SessionView, played = false) => {
    latest.current = v;
    if (busy.current) return;
    if (shownRef.current && v.step === shownRef.current.step) {
      commitView(v);
      return;
    }
    busy.current = true;
    setFirstReveal(false);
    // coming from the hand there is no card to turn face down first, so go straight to the new one
    const fromHand = shownRef.current !== null && !onTable(shownRef.current.phase);
    // a joker was just played: both phones see it land on the card before the card goes back
    const joker = !fromHand && v.phase === "choose" && v.passed;
    if (joker) {
      setJokerFx((k) => k + 1);
      gsap.fromTo(wrapRef.current, { x: 0 }, { keyframes: { x: [-8, 7, -5, 3, 0] }, duration: 0.45, delay: 0.35 });
    } else {
      setFlipped(false);
    }

    const swap = () => {
      const target = latest.current!;
      commitView(target);
      // the card remounts face down when coming back from the hand, give it a beat before flipping
      later(() => {
        if (faceUpFor(target, role)) setFlipped(true);
        busy.current = false;
        if (latest.current && latest.current.step !== shownRef.current?.step) showNext(latest.current);
      }, fromHand ? 250 : 450);
    };

    if (fromHand && !played && v.phase === "card" && v.pickedSlot !== null && handRef.current) {
      // the other player chose: replay their card rising to the table before it turns
      void handRef.current.playPick(v.pickedSlot).then(() => alive.current && swap());
    } else if (joker) {
      later(() => {
        setFlipped(false);
        later(swap, 1300);
      }, 1150);
    } else {
      later(swap, fromHand ? 0 : 1300);
    }
  };

  const draw = async () => {
    const { data, status } = await call<DrawResponse>("/api/card", "POST");
    if (!alive.current) return;
    if (status === 503 || !data) return setModeBoth("full");
    const info = { id: data.id, color: data.color, symbol: data.symbol };
    cardRef.current = info;
    setCard(info);
    setAccent(COLORS[data.color].from);
    setModeBoth("waiting");
    gsap.fromTo(
      wrapRef.current,
      { opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" },
      { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power3.out" },
    );
  };

  // mount: draw as role a, or take the seed as role b / resume
  useEffect(() => {
    alive.current = true;
    cardRef.current = card;
    const ts = timers.current;
    if (!seed) {
      later(() => void draw(), 0);
    } else if (seed.resume) {
      setAccent(COLORS[seed.color].from);
      void call<SessionView>(`/api/session/${seed.sessionId}`).then(({ data, ok }) => {
        if (!alive.current) return;
        if (ok && data) {
          commitView(data);
          setFlipped(faceUpFor(data, role));
          setFirstReveal(false);
        } else {
          writeSaved(null);
          onExit();
        }
      });
    } else {
      setAccent(COLORS[seed.color].from);
      const { sessionId: sid, flipInMs } = seed;
      later(() => void startCharging(sid, flipInMs), 0);
    }
    return () => {
      alive.current = false;
      ts.forEach((t) => window.clearTimeout(t));
      const c = cardRef.current;
      if (modeRef.current === "waiting" && c?.id) {
        void fetch(`/api/card/${c.id}`, { method: "DELETE", keepalive: true });
      }
    };
    // runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // waiting: has the partner found our card?
  usePoll(
    async () => {
      const c = cardRef.current;
      if (!c?.id || modeRef.current !== "waiting") return;
      const { data, rtt } = await call<StatusResponse>(`/api/card/${c.id}`);
      if (!data || !alive.current || modeRef.current !== "waiting") return;
      if (data.state === "matched") {
        void startCharging(data.sessionId, msUntil(data.flipAt, data.now, rtt));
      } else if (data.state === "expired") {
        // fade away softly and deal a fresh card
        setModeBoth("drawing");
        setNote("Cette carte s'est effacée doucement. En voilà une nouvelle.");
        later(() => setNote(null), 5000);
        gsap.to(wrapRef.current, {
          opacity: 0,
          scale: 0.92,
          y: -20,
          filter: "blur(14px)",
          duration: 1.1,
          ease: "power2.in",
          onComplete: () => void draw(),
        });
      }
    },
    1000,
    mode === "waiting",
  );

  // open: follow the shared question
  usePoll(
    async () => {
      if (!sessionId || busy.current) return;
      const { data, status } = await call<SessionView>(`/api/session/${sessionId}`);
      if (!alive.current) return;
      // a poll that was in flight during a local edit would roll the chips back
      if (Date.now() - editedAt.current < 2500) return;
      if (status === 404) {
        writeSaved(null);
        return onExit();
      }
      if (data) showNext(data);
    },
    1500,
    mode === "open" && shown !== null,
  );

  const next = async () => {
    if (!sessionId || !shownRef.current || busy.current) return;
    const { data } = await call<SessionView>(`/api/session/${sessionId}/next`, "POST", { step: shownRef.current.step });
    if (data && alive.current) showNext(data);
  };

  /** the hand plays its lift-to-centre motion while the request runs; the swap waits for both */
  const pick = async (slot: number, settled: Promise<unknown>) => {
    if (!sessionId || !shownRef.current || busy.current) return;
    busy.current = true;
    const [{ data }] = await Promise.all([
      call<SessionView>(`/api/session/${sessionId}/pick`, "POST", { step: shownRef.current.step, slot }),
      settled,
    ]);
    busy.current = false;
    if (data && alive.current) showNext(data, true);
  };

  /** spend a joker: the card goes back unanswered and the asker picks again */
  const pass = async () => {
    if (!sessionId || !shownRef.current || busy.current) return;
    const { data } = await call<SessionView>(`/api/session/${sessionId}/pass`, "POST", { step: shownRef.current.step, role });
    if (data && alive.current) showNext(data);
  };

  /** a move that only needs the current step: start, finish, continue */
  const act = async (path: "start" | "finish" | "continue") => {
    if (!sessionId || !shownRef.current || busy.current) return;
    const { data } = await call<SessionView>(`/api/session/${sessionId}/${path}`, "POST", { step: shownRef.current.step });
    if (data && alive.current) showNext(data);
  };

  /** optimistic: chips move at once, the server answer (and the partner's screen) follow */
  const changeCriteria = async (update: (prev: CriteriaValue) => CriteriaValue) => {
    const cur = shownRef.current;
    if (!sessionId || !cur) return;
    const criteria = update(cur.criteria);
    if (criteria === cur.criteria) return;
    editedAt.current = Date.now();
    const seq = ++editSeq.current;
    commitView({ ...cur, criteria });
    const { data } = await call<SessionView>(`/api/session/${sessionId}/criteria`, "POST", criteria);
    // only the answer to the latest tap may touch the chips
    if (data && alive.current && seq === editSeq.current && shownRef.current?.step === data.step) {
      editedAt.current = Date.now();
      commitView({ ...shownRef.current, criteria: data.criteria, matching: data.matching });
    }
  };

  const leave = (forget: boolean) => {
    if (forget) writeSaved(null);
    onExit();
  };

  // the room follows the depth of what is on the table, so the climb is felt rather than shown
  const roomDepth = !shown
    ? 2
    : onTable(shown.phase) && shown.question
      ? shown.question.depth
      : shown.phase === "choose" && shown.hand.length
        ? shown.hand.reduce((a, h) => a + h.depth, 0) / shown.hand.length
        : shown.criteria.depths.reduce((a, b) => a + b, 0) / shown.criteria.depths.length;
  useEffect(() => {
    ambient.depth(roomDepth);
  }, [roomDepth]);
  useEffect(() => () => ambient.depth(2), []);

  const color = card ? COLORS[card.color] : null;
  const phase = mode === "open" ? shown?.phase : undefined;
  /** "mine" = I picked this card (or pick the next one in a hand); the other answers */
  const mine = shown ? shown.turn === role : false;
  const choosing = phase === "choose";
  const setup = phase === "setup";
  const ended = phase === "end";
  const offTable = choosing || setup || ended;
  const opening = !!shown && shown.round === 1 && shown.history.length === 0;
  /** I answer this card: it stays face down, I only hear it */
  const listening = phase === "card" && !!shown && !faceUpFor(shown, role);
  const lastOne = !!shown && shown.round >= shown.goal;

  const primary =
    "rounded-full bg-gradient-to-b from-[#ecd09a] to-[#c79a50] px-9 py-3.5 text-[15px] font-medium text-[#2a1d0a] shadow-[0_10px_36px_-8px_rgba(217,183,121,.55)] transition active:scale-95";
  const secondary =
    "rounded-full border border-white/15 bg-white/[.06] px-8 py-3.5 text-[15px] text-paper backdrop-blur transition active:scale-95";

  const status = !shown
    ? ""
    : setup
      ? "Choisissez ensemble"
      : choosing
        ? mine
          ? "À toi de piocher une carte"
          : "L'autre pioche une carte…"
        : phase === "closing"
          ? "Chacun votre tour"
          : ended
            ? ""
            : mine
              ? "Lis-lui la question à voix haute"
              : opening
                ? "C'est à toi de répondre"
                : "Écoute, puis réponds";

  return (
    <Screen>
      <Wordmark
        onBack={() => leave(false)}
        right={
          mode === "open" && !setup ? (
            <div className="flex items-center">
              <SoundToggle />
              <button
                onClick={() => setMoodOpen(true)}
                aria-label="Ambiance"
                className="grid size-10 place-items-center rounded-full text-paper/60 transition hover:bg-white/5 hover:text-paper"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
                  <circle cx="15" cy="7" r="2" />
                  <circle cx="9" cy="17" r="2" />
                </svg>
              </button>
            </div>
          ) : null
        }
      />
      <div className="mt-1 h-10">
        {shown && (phase === "card" || choosing || phase === "closing") && <Frise view={shown} onOpen={() => setHistoryOpen(true)} />}
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center py-3">
        {jokerFx > 0 && <JokerFlash key={jokerFx} />}
        {choosing && card && shown && (
          <Hand
            key={shown.step}
            color={card.color}
            hand={shown.hand}
            handle={handRef}
            canPick={mine}
            onPick={(slot, settled) => void pick(slot, settled)}
          />
        )}
        {setup && shown && (
          <div key={shown.step} data-rise className="flex w-full flex-col gap-6">
            <Criteria
              value={shown.criteria}
              themes={shown.themes}
              matching={shown.matching}
              onChange={(u) => void changeCriteria(u)}
            />
          </div>
        )}
        {ended && shown && <Recap key={shown.step} items={[...shown.history].reverse()} />}
        <div ref={wrapRef} style={{ opacity: seed ? 1 : 0, display: offTable ? "none" : undefined }}>
          {card && !offTable && (
            <Card
              key={card.id ?? "seed"}
              color={card.color}
              symbol={card.symbol}
              flipped={flipped}
              charging={mode === "charging"}
              duration={firstReveal ? 2.6 : 1.35}
              burst={firstReveal}
              front={shown ? shown.question && <QuestionFace question={shown.question} play={flipped} /> : null}
              backNote={listening && shown?.question ? <Listening question={shown.question} /> : null}
            />
          )}
        </div>
      </div>

      <div className="flex min-h-[132px] w-full flex-col items-center justify-start gap-4 pb-1 text-center">
        {(mode === "waiting" || mode === "drawing") && (
          <div data-rise className="space-y-2">
            <p className="display text-[22px] font-light leading-snug">
              Montre cet écran à l&apos;autre.
              <br />
              <em className="text-paper/60">Il doit retrouver ta carte.</em>
            </p>
            {color && card && mode === "waiting" && (
              <p className="text-[13px] tracking-wide text-paper/45">
                {color.name} · {SYMBOLS[card.symbol].name}
              </p>
            )}
            <p
              className="display text-[14px] italic text-paper/50 transition-opacity duration-700"
              style={{ opacity: note ? 1 : 0 }}
            >
              {note ?? "\u00a0"}
            </p>
          </div>
        )}

        {mode === "charging" && (
          <p className="display animate-pulse text-[22px] italic text-paper/80">Vous y êtes presque…</p>
        )}

        {mode === "open" && shown && (
          <>
            {status && (
              <p className="flex items-center gap-2.5 text-[14px] text-paper/70" aria-live="polite">
                <span
                  className="size-2 rounded-full bg-accent"
                  style={{ boxShadow: "0 0 12px var(--accent)", opacity: mine || setup || phase === "closing" ? 1 : 0.35 }}
                />
                {status}
              </p>
            )}

            {setup && (
              <button onClick={() => void act("start")} className={primary}>
                Commencer
              </button>
            )}

            {choosing && (
              <p className="display h-[50px] text-[15px] italic text-paper/45">
                {shown.passed ? (mine ? "L'autre a passé cette carte. Repioche." : "Carte passée. L'autre repioche.") : "\u00a0"}
              </p>
            )}

            {/* only the one who answered moves on: the deck passes to them */}
            {phase === "card" &&
              (mine ? (
                <p className="display flex h-[50px] items-center text-[15px] italic text-paper/45">
                  {lastOne ? "Ensuite, la dernière carte." : opening ? "Ensuite, vous choisirez l'ambiance." : "Ensuite, l'autre pioche."}
                </p>
              ) : (
                // a joker on each side of the main move, spent from the left: tap one to pass this card
                <div className="flex items-center gap-4">
                  <JokerToken available={shown.jokers[role] >= 2} onUse={() => void pass()} />
                  <button onClick={next} className={lastOne ? primary : secondary}>
                    {lastOne ? "Dernière carte" : opening ? "Choisir l'ambiance" : "À moi de piocher"}
                  </button>
                  <JokerToken available={shown.jokers[role] >= 1} onUse={() => void pass()} />
                </div>
              ))}

            {phase === "closing" && (
              <button onClick={next} className={primary}>
                Voir notre soirée
              </button>
            )}

            {ended && (
              <div className="flex w-full flex-col items-center gap-3">
                <button onClick={() => void act("continue")} className={secondary}>
                  Continuer à jouer
                </button>
                <button onClick={() => leave(true)} className="text-[13px] text-paper/50 underline-offset-4 hover:underline">
                  Terminer et quitter
                </button>
              </div>
            )}

            {(phase === "card" || choosing) && !lastOne && (
              <button onClick={() => void act("finish")} className="text-[12px] text-paper/35 underline-offset-4 hover:underline">
                Terminer la soirée
              </button>
            )}
          </>
        )}

        {mode === "full" && (
          <div data-rise className="space-y-4">
            <p className="display text-[20px] italic text-paper/70">Beaucoup de monde ce soir. Réessayez dans un instant.</p>
            <button onClick={() => leave(false)} className="rounded-full border border-white/15 px-6 py-3 text-[14px]">
              Retour
            </button>
          </div>
        )}
      </div>
      {moodOpen && shown && (
        <Sheet title="Ambiance" label="Choisir l'ambiance" onClose={() => setMoodOpen(false)}>
          <div className="pb-2">
            <Criteria
              value={shown.criteria}
              themes={shown.themes}
              matching={shown.matching}
              onChange={(u) => void changeCriteria(u)}
            />
            <p className="display mt-5 text-center text-[14px] italic text-paper/40">Appliqué aux prochaines cartes.</p>
          </div>
        </Sheet>
      )}
      {historyOpen && shown && <History items={shown.history} onClose={() => setHistoryOpen(false)} />}
    </Screen>
  );
}
