/** Haptics, optional sound and motion permission. Everything here is a no-op where unsupported. */

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Android vibrates; iOS Safari has no vibration API, so visuals carry the moment there. */
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

/** a bell-like note: a sine with a soft inharmonic overtone that dies sooner */
function bell(freq: number, start: number, dur: number, peak: number) {
  if (!ctx) return;
  const dest = out();
  [
    [1, peak, dur],
    [2.76, peak * 0.22, dur * 0.45],
    [5.4, peak * 0.06, dur * 0.2],
  ].forEach(([k, p, d]) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * k;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(p, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + d);
    osc.connect(gain).connect(dest);
    osc.start(start);
    osc.stop(start + d + 0.05);
  });
}

/** a short breath of filtered noise: the sound of a card sliding or turning */
function swish(start: number, dur: number, peak: number, from: number, to: number) {
  if (!ctx) return;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(from, start);
  band.frequency.exponentialRampToValueAtTime(to, start + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(band).connect(gain).connect(out());
  src.start(start);
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {}
  if (on) {
    unlock();
    chime();
  }
  window.dispatchEvent(new Event("invicem-sound"));
}

/** the shared moment: a card swish, then four soft bells rising (E major), the last one held */
export function chime() {
  if (!soundOn() || !ctx) return;
  const t = ctx.currentTime;
  swish(t, 0.35, 0.05, 900, 3200);
  [329.63, 415.3, 493.88, 659.25].forEach((f, i) => bell(f, t + 0.08 + i * 0.11, i === 3 ? 2.8 : 1.6, 0.05));
  bell(164.81, t + 0.08, 2.4, 0.02);
}

/** a card turning: a quick paper swish with a faint wooden knock */
export function tick() {
  if (!soundOn() || !ctx) return;
  const t = ctx.currentTime;
  swish(t, 0.16, 0.035, 2400, 900);
  bell(220, t + 0.05, 0.18, 0.012);
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
