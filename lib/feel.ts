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

function tone(freq: number, start: number, dur: number, peak: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
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

/** the shared moment: a soft rising triad */
export function chime() {
  if (!soundOn() || !ctx) return;
  const t = ctx.currentTime;
  [659.25, 987.77, 1318.51].forEach((f, i) => tone(f, t + i * 0.09, 1.8, 0.06));
}

/** small card sound for flips */
export function tick() {
  if (!soundOn() || !ctx) return;
  const t = ctx.currentTime;
  tone(880, t, 0.14, 0.025);
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
