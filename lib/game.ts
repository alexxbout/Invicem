import { COLOR_COUNT, SYMBOL_COUNT } from "./palette";
import { QUESTIONS, type Question } from "./questions";
import { store } from "./store";

/** how long a drawn card keeps its back reserved */
const HOLD_SEC = 120;
/** both screens flip together this long after the match, in server time */
const FLIP_DELAY_MS = 2600;
const SESSION_SEC = 60 * 60 * 6;

type Card = {
  id: string;
  color: number;
  symbol: number;
  state: "waiting" | "matched";
  expiresAt: number;
  flipAt?: number;
};

type Session = {
  /** monotonic counter, bumped by every change; lets both phones detect and dedupe moves */
  step: number;
  turn: "a" | "b";
  phase: "card" | "choose";
  /** question on the table (meaningful in phase "card") */
  current: number;
  /** three face-down candidates (phase "choose") */
  hand: number[];
  /** upcoming question ids */
  queue: number[];
  /** questions already put down, oldest first (the one on the table is not in it) */
  history: number[];
};

const rand = (n: number) => Math.floor(Math.random() * n);
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const backKey = (color: number, symbol: number) => `back:${color}:${symbol}`;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


export class GameFullError extends Error {}

/** Reserve a unique back. Prefers a colour nobody holds, so the partner needs one tap. */
export async function drawCard() {
  const all: [number, number][] = [];
  for (let c = 0; c < COLOR_COUNT; c++) for (let s = 0; s < SYMBOL_COUNT; s++) all.push([c, s]);

  for (let attempt = 0; attempt < 6; attempt++) {
    const held = await store.mget<string>(all.map(([c, s]) => backKey(c, s)));
    const busyColors = new Set<number>();
    const free: [number, number][] = [];
    held.forEach((id, i) => {
      if (id) busyColors.add(all[i][0]);
      else free.push(all[i]);
    });
    const freeColors = free.filter(([c]) => !busyColors.has(c));
    const pool = freeColors.length ? freeColors : free;
    if (!pool.length) throw new GameFullError();

    const [color, symbol] = pool[rand(pool.length)];
    const id = newId();
    if (!(await store.setNX(backKey(color, symbol), id, HOLD_SEC))) continue;

    const card: Card = { id, color, symbol, state: "waiting", expiresAt: Date.now() + HOLD_SEC * 1000 };
    await store.set(`card:${id}`, card, HOLD_SEC + 30);
    return { id, color, symbol, expiresAt: card.expiresAt, now: Date.now() };
  }
  throw new GameFullError();
}

export async function cardStatus(id: string) {
  const now = Date.now();
  const card = await store.get<Card>(`card:${id}`);
  if (!card) return { state: "expired" as const, now };
  if (card.state === "matched") {
    return { state: "matched" as const, sessionId: card.id, flipAt: card.flipAt!, now };
  }
  if (now > card.expiresAt) return { state: "expired" as const, now };
  return { state: "waiting" as const, expiresAt: card.expiresAt, now };
}

export async function cancelCard(id: string) {
  const card = await store.get<Card>(`card:${id}`);
  if (!card || card.state !== "waiting") return;
  await store.del(backKey(card.color, card.symbol), `card:${id}`);
}

export type FindResult =
  | { result: "none" }
  | { result: "need-symbol" }
  | { result: "matched"; sessionId: string; color: number; symbol: number; flipAt: number; now: number };

/** The partner points at a colour (and a symbol when the colour is shared). */
export async function findCard(color: number, symbol?: number): Promise<FindResult> {
  const symbols = symbol === undefined ? Array.from({ length: SYMBOL_COUNT }, (_, s) => s) : [symbol];
  const held = await store.mget<string>(symbols.map((s) => backKey(color, s)));
  const hits = held.filter((id): id is string => !!id);

  if (hits.length === 0) return { result: "none" };
  if (hits.length > 1) return { result: "need-symbol" };

  const id = hits[0];
  // only one finder can win a card
  if (!(await store.setNX(`claim:${id}`, 1, 60))) return { result: "none" };
  const card = await store.get<Card>(`card:${id}`);
  if (!card || card.state !== "waiting") return { result: "none" };

  const now = Date.now();
  const flipAt = now + FLIP_DELAY_MS;
  const queue = shuffle(QUESTIONS.map((_, i) => i));
  const session: Session = {
    step: 0,
    turn: Math.random() < 0.5 ? "a" : "b",
    phase: "card",
    current: queue.shift()!,
    hand: [],
    queue,
    history: [],
  };
  await store.set(`sess:${id}`, session, SESSION_SEC);
  await store.set(`card:${id}`, { ...card, state: "matched", flipAt } satisfies Card, 600);
  await store.del(backKey(card.color, card.symbol));
  return { result: "matched", sessionId: id, color: card.color, symbol: card.symbol, flipAt, now };
}

export type SessionView = {
  step: number;
  turn: "a" | "b";
  phase: "card" | "choose";
  /** set in phase "card" */
  question: Question | null;
  /** set in phase "choose": theme and depth only, the text stays hidden until picked */
  hand: Pick<Question, "theme" | "depth">[];
  /** questions already shown, newest first, current one excluded */
  history: Question[];
  now: number;
};

function view(s: Session): SessionView {
  return {
    step: s.step,
    turn: s.turn,
    phase: s.phase,
    question: s.phase === "card" ? QUESTIONS[s.current] : null,
    hand: s.phase === "choose" ? s.hand.map((id) => ({ theme: QUESTIONS[id].theme, depth: QUESTIONS[id].depth })) : [],
    history: s.history.map((id) => QUESTIONS[id]).reverse(),
    now: Date.now(),
  };
}

const isSession = (s: Session | null): s is Session => !!s && Array.isArray(s.queue);

export async function sessionView(id: string): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  return isSession(s) ? view(s) : null;
}

/** keep at least `n` ids in the queue, never reusing ones in play unless the bank is tiny */
function refill(s: Session, n: number) {
  if (s.queue.length >= n) return;
  const busy = new Set([s.current, ...s.hand, ...s.queue]);
  const fresh = shuffle(QUESTIONS.map((_, i) => i).filter((i) => !busy.has(i)));
  s.queue.push(...(fresh.length ? fresh : shuffle(QUESTIONS.map((_, i) => i).filter((i) => !s.hand.includes(i)))));
}

/** Put the card down and deal three face-down candidates. Idempotent per `step`. */
export async function nextQuestion(id: string, step: number): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  if (s.step === step && s.phase === "card") {
    s.history.push(s.current);
    refill(s, 3);
    s.hand = s.queue.splice(0, 3);
    s.phase = "choose";
    s.turn = s.turn === "a" ? "b" : "a";
    s.step += 1;
    await store.set(`sess:${id}`, s, SESSION_SEC);
  }
  return view(s);
}

/** Turn a candidate face up; the other two go back to the end of the queue. */
export async function pickQuestion(id: string, step: number, slot: number): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  if (s.step === step && s.phase === "choose" && slot >= 0 && slot < s.hand.length) {
    const [chosen] = s.hand.splice(slot, 1);
    s.queue.push(...s.hand);
    s.hand = [];
    s.current = chosen;
    s.phase = "card";
    s.step += 1;
    await store.set(`sess:${id}`, s, SESSION_SEC);
  }
  return view(s);
}
