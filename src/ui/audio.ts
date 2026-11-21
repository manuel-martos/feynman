/**
 * Tiny synthesized sound kit (WebAudio) — no assets to download, works offline.
 */
export type Sfx = 'tap' | 'snap' | 'connect' | 'remove' | 'deny' | 'error' | 'success' | 'star' | 'unlock' | 'select';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08, slideTo?: number) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function sfx(name: Sfx) {
  if (!enabled) return;
  try {
    switch (name) {
      case 'tap':
        tone(660, 0, 0.06, 'triangle', 0.05);
        break;
      case 'select':
        tone(520, 0, 0.08, 'triangle', 0.06, 780);
        break;
      case 'snap':
        tone(1200, 0, 0.04, 'sine', 0.035);
        break;
      case 'connect':
        tone(440, 0, 0.09, 'triangle', 0.07, 880);
        tone(1320, 0.05, 0.08, 'sine', 0.03);
        break;
      case 'remove':
        tone(500, 0, 0.1, 'triangle', 0.05, 250);
        break;
      case 'deny':
        tone(220, 0, 0.12, 'square', 0.025, 180);
        break;
      case 'error':
        tone(300, 0, 0.16, 'sawtooth', 0.03, 200);
        tone(240, 0.12, 0.2, 'sawtooth', 0.025, 150);
        break;
      case 'success':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.08, 0.35, 'triangle', 0.07));
        break;
      case 'star':
        tone(1046.5, 0, 0.18, 'sine', 0.06, 1568);
        break;
      case 'unlock':
        [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.07, 0.4, 'sine', 0.06));
        break;
    }
  } catch {
    /* audio is best-effort */
  }
}
