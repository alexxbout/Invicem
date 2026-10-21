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
  deck: number[];
  idx: number;
  turn: "a" | "b";
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

const freshDeck = () => shuffle(QUESTIONS.map((_, i) => i));

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
  const session: Session = { deck: freshDeck(), idx: 0, turn: Math.random() < 0.5 ? "a" : "b" };
  await store.set(`sess:${id}`, session, SESSION_SEC);
  await store.set(`card:${id}`, { ...card, state: "matched", flipAt } satisfies Card, 600);
  await store.del(backKey(card.color, card.symbol));
  return { result: "matched", sessionId: id, color: card.color, symbol: card.symbol, flipAt, now };
}

export type SessionView = {
  idx: number;
  turn: "a" | "b";
  question: Question;
  now: number;
};

function view(s: Session): SessionView {
  return { idx: s.idx, turn: s.turn, question: QUESTIONS[s.deck[s.idx]], now: Date.now() };
}

export async function sessionView(id: string): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  return s ? view(s) : null;
}

/** Idempotent: both phones may tap at once, only the first tap for `idx` counts. */
export async function nextQuestion(id: string, idx: number): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!s) return null;
  if (s.idx === idx) {
    s.idx += 1;
    s.turn = s.turn === "a" ? "b" : "a";
    if (s.idx >= s.deck.length) {
      s.deck = freshDeck();
      s.idx = 0;
    }
    await store.set(`sess:${id}`, s, SESSION_SEC);
  }
  return view(s);
}
