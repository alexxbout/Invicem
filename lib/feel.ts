/** Haptics, optional sound and motion permission. Everything here is a no-op where unsupported. */

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Android vibrates for real. iOS Safari has no vibration API: there the tick comes
 * from the tap itself, through the hidden switch inside every <Tap> (components/Tap.tsx).
 */
export const buzz = (pattern: number | number[]) => {
  if (!reduced()) navigator.vibrate?.(pattern);
};

/* ---- sound: synthesised with WebAudio, no files, off by default ---- */

const SOUND_KEY = "invicem:sound";
let ctx: AudioContext | null = null;
let armed = false;

export const soundOn = (): boolean => {
  try {
    return localStorage.getItem(SOUND_KEY) === "1";
  } catch {
    return false;
  }
};

export const soundSnapshot = () => (soundOn() ? "1" : "0");

export function subscribeSound(cb: () => void) {
  window.addEventListener("invicem-sound", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("invicem-sound", cb);
    window.removeEventListener("storage", cb);
  };
}

function unlock() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  void ctx.resume();
}

/** iOS only lets audio start from a tap: resume on the first one after a reload. */
export function armSound() {
  if (armed || !soundOn()) return;
  armed = true;
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
}

/**
 * Everything plays through one small "room": a gentle compressor and a soft, darkened echo,
 * so notes bloom a little instead of stopping dry.
 */
let room: AudioNode | null = null;
function out(): AudioNode {
  if (room || !ctx) return room ?? ctx!.destination;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  comp.connect(ctx.destination);
  const dry = ctx.createGain();
  dry.connect(comp);
  // two short delays fed back through a low-pass: a warm, cheap reverb tail
  [0.11, 0.17].forEach((t) => {
    const delay = ctx!.createDelay(1);
    delay.delayTime.value = t;
    const tone = ctx!.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2200;
    const back = ctx!.createGain();
    back.gain.value = 0.32;
    dry.connect(delay).connect(tone).connect(back).connect(delay);
    tone.connect(comp);
  });
  room = dry;
  return room;
}

/* ---- sound sources ---- */

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** two seconds of white noise, made once; every paper sound reads a random slice of it */
let noiseBuf: AudioBuffer | null = null;
function noise(): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const len = ctx!.sampleRate * 2;
  noiseBuf = ctx!.createBuffer(1, len, ctx!.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

type Burst = {
  start: number;
  dur: number;
  peak: number;
  type: BiquadFilterType;
  freq: number;
  /** where the filter glides to by the end */
  to?: number;
  q?: number;
  /** share of the duration spent rising */
  attack?: number;
};

/** filtered noise with a shaped envelope: the raw material of paper, felt and wax */
function burst({ start, dur, peak, type, freq, to, q = 0.8, attack = 0.15 }: Burst) {
  const src = ctx!.createBufferSource();
  src.buffer = noise();
  src.playbackRate.value = rnd(0.85, 1.15);
  const f = ctx!.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, start);
  if (to) f.frequency.exponentialRampToValueAtTime(to, start + dur);
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + Math.max(0.002, dur * attack));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(out());
  src.start(start, rnd(0, 1.5), dur + 0.05);
}

/** a pitched note with its own partials; higher partials die sooner */
function note(freq: number, start: number, dur: number, peak: number, partials: [number, number][] = [[1, 1]], type: OscillatorType = "sine") {
  const dest = out();
  partials.forEach(([k, share]) => {
    const osc = ctx!.createOscillator();
    const g = ctx!.createGain();
    osc.type = type;
    osc.frequency.value = freq * k;
    const d = dur / Math.sqrt(k);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak * share, start + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, start + d);
    osc.connect(g).connect(dest);
    osc.start(start);
    osc.stop(start + d + 0.05);
  });
}

/** a low, dull knock: a card landing on felt, a seal pressed on paper */
function thump(start: number, freq: number, peak: number, dur = 0.12) {
  const osc = ctx!.createOscillator();
  const g = ctx!.createGain();
  osc.frequency.setValueAtTime(freq * 1.6, start);
  osc.frequency.exponentialRampToValueAtTime(freq, start + dur * 0.4);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(out());
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

const live = () => soundOn() && !!ctx;

export function setSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {}
  if (on) {
    unlock();
    reveal();
  }
  window.dispatchEvent(new Event("invicem-sound"));
}

/* ---- the game's sounds: quiet, papery, and never twice exactly the same ---- */

/** a card dealt onto the cloth: a short slide of card on felt, then a soft landing */
export function slide() {
  if (!live()) return;
  const t = ctx!.currentTime;
  burst({ start: t, dur: rnd(0.14, 0.2), peak: rnd(0.025, 0.035), type: "bandpass", freq: rnd(1800, 2600), to: rnd(700, 1000), q: 0.7, attack: 0.5 });
  thump(t + rnd(0.13, 0.17), rnd(110, 140), 0.035, 0.08);
}

/** a card lifted between the fingers: a dry little tap with a whisper of paper */
export function pick() {
  if (!live()) return;
  const t = ctx!.currentTime;
  burst({ start: t, dur: 0.035, peak: 0.05, type: "highpass", freq: rnd(2500, 3500), attack: 0.05 });
  burst({ start: t + 0.02, dur: 0.12, peak: 0.012, type: "bandpass", freq: rnd(3500, 5000), q: 1.4, attack: 0.3 });
}

/** a card turning over: air under the card, then the crisp snap of it landing face up */
export function flip() {
  if (!live()) return;
  const t = ctx!.currentTime;
  burst({ start: t, dur: 0.22, peak: 0.018, type: "bandpass", freq: 600, to: rnd(2400, 3200), q: 0.6, attack: 0.6 });
  burst({ start: t + 0.2, dur: 0.03, peak: rnd(0.05, 0.07), type: "highpass", freq: rnd(1800, 2600), attack: 0.04 });
  thump(t + 0.2, rnd(160, 200), 0.025, 0.06);
}

/** the voicings the shared moment picks from: all soft, all open */
const CHORDS = [
  [293.66, 440, 554.37, 659.25],
  [261.63, 392, 493.88, 587.33],
  [329.63, 493.88, 622.25, 739.99],
  [246.94, 369.99, 466.16, 554.37],
];

/** both cards turning together: the flip, then a few soft music-box notes */
export function reveal() {
  if (!live()) return;
  flip();
  const t = ctx!.currentTime + 0.24;
  const chord = CHORDS[Math.floor(Math.random() * CHORDS.length)];
  const box: [number, number][] = [[1, 1], [3, 0.08], [4.2, 0.04]];
  chord.forEach((f, i) => note(f * 2, t + i * rnd(0.09, 0.13), 1.6, 0.022, box));
  note(chord[0] / 2, t, 2.2, 0.018, [[1, 1], [2, 0.2]]);
}

/** the jester: little bells on his hat shaking, then three playful plucked notes */
export function jester() {
  if (!live()) return;
  const t = ctx!.currentTime;
  const bells: [number, number][] = [[1, 1], [2.32, 0.5], [4.25, 0.3], [6.8, 0.15]];
  for (let i = 0; i < 9; i++) note(rnd(2600, 3400), t + i * rnd(0.035, 0.06), 0.25, 0.012 * (1 - i / 12), bells);
  const run = Math.random() < 0.5 ? [523.25, 659.25, 783.99] : [587.33, 739.99, 880];
  run.forEach((f, i) => note(f, t + 0.35 + i * 0.12, 0.3, 0.03, [[1, 1], [2, 0.3]], "triangle"));
  burst({ start: t + 0.7, dur: 0.5, peak: 0.01, type: "bandpass", freq: 1200, to: 4000, q: 0.5, attack: 0.3 });
}

/** a quill on paper: short scratches in an uneven rhythm, for the given seconds */
export function scratch(seconds: number, delay = 0) {
  if (!live()) return;
  let t = ctx!.currentTime + delay;
  const end = t + seconds;
  while (t < end) {
    const d = rnd(0.04, 0.11);
    burst({ start: t, dur: d, peak: rnd(0.006, 0.014), type: "bandpass", freq: rnd(3500, 6500), q: rnd(2, 4), attack: 0.4 });
    t += d + rnd(0.01, 0.07);
  }
}

/** a sheet of paper taken up: a soft rustle */
export function rustle() {
  if (!live()) return;
  const t = ctx!.currentTime;
  for (let i = 0; i < 3; i++) {
    burst({ start: t + i * rnd(0.05, 0.09), dur: rnd(0.1, 0.18), peak: rnd(0.008, 0.016), type: "bandpass", freq: rnd(2000, 4000), q: 0.9, attack: 0.3 });
  }
}

/** warm wax pressed by a seal: a dull thud with a short squish */
export function wax() {
  if (!live()) return;
  const t = ctx!.currentTime;
  thump(t, rnd(70, 85), 0.08, 0.22);
  burst({ start: t + 0.01, dur: 0.18, peak: 0.02, type: "lowpass", freq: 900, to: 300, attack: 0.1 });
}

/** a fingertip brushing a card: a tiny, soft breath of paper */
export function twinkle() {
  if (!live()) return;
  const t = ctx!.currentTime;
  burst({ start: t, dur: rnd(0.07, 0.11), peak: rnd(0.006, 0.009), type: "bandpass", freq: rnd(2600, 3600), to: rnd(1500, 2000), q: 0.7, attack: 0.35 });
}

/* ---- device tilt ---- */

type OrientationCtor = { requestPermission?: () => Promise<"granted" | "denied"> };

/**
 * Call from a tap. iOS asks once; it also only works on https, so over a plain
 * http LAN address the cards simply fall back to finger tilt.
 */
export async function requestTilt() {
  try {
    const DO = (window as unknown as { DeviceOrientationEvent?: OrientationCtor }).DeviceOrientationEvent;
    await DO?.requestPermission?.();
  } catch {}
}
