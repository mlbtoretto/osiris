/** Auto-producer: genre + key + seed in, a complete pattern and tempo out. Pure and deterministic. */
import { defaultPattern, MAX_STEPS, type PatternState } from './studio-engine';
import { clamp } from './studio-dsp';

export const GENRES = ['trap', 'boombap', 'house', 'drill', 'afrobeats', 'reggaeton', 'lofi'] as const;
export type Genre = (typeof GENRES)[number];
export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type Mode = 'minor' | 'major' | 'phrygian';
const SCALES: Record<Mode, number[]> = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], phrygian: [0, 1, 3, 5, 7, 8, 10] };

type Recipe = {
  bpm: [number, number]; swing: number; mode: Mode;
  /** 16-step templates: x = hit, o = maybe (coin flip), . = rest. */
  kick: string; snare: string; clap?: string; hat: string; openhat: string; tom?: string;
  bass: string; lead: string; hatRoll?: boolean;
};

const RECIPES: Record<Genre, Recipe> = {
  trap:      { bpm: [132, 150], swing: 0,    mode: 'minor',    kick: 'x..o..x...o.x...', snare: '....x.......x...', clap: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx', openhat: '......o.......o.', bass: 'x..o..x...o.x...', lead: 'o...o.o...o.....', hatRoll: true },
  boombap:   { bpm: [84, 96],   swing: 0.55, mode: 'minor',    kick: 'x.....o.x.o.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', openhat: '..............o.', tom: '..............o.', bass: 'x.....o.x.o.....', lead: 'o.....o...o.....' },
  house:     { bpm: [120, 128], swing: 0.1,  mode: 'minor',    kick: 'x...x...x...x...', snare: '....x.......x...', clap: '....x.......x...', hat: '..x...x...x...x.', openhat: '..x...x...x...x.', bass: '.x..o.x..x..o.x.', lead: 'o..o..o.o..o....' },
  drill:     { bpm: [140, 146], swing: 0,    mode: 'phrygian', kick: 'x.....x..o..x...', snare: '..x.....x.......', clap: '........x.......', hat: 'x.xxx.xxx.xxx.xx', openhat: '..............o.', bass: 'x.....x..o..x...', lead: 'o.....o.........', hatRoll: true },
  afrobeats: { bpm: [98, 108],  swing: 0.2,  mode: 'minor',    kick: 'x..x..x...x..x..', snare: '....x.......x...', clap: '....o.......o...', hat: 'x.xxx.xxx.xxx.xx', openhat: '.......o.......o', tom: '.o..............', bass: 'x..x..x...x..x..', lead: 'o.o...o.o...o...' },
  reggaeton: { bpm: [88, 98],   swing: 0,    mode: 'minor',    kick: 'x..x..x.x..x..x.', snare: '...x..x....x..x.', hat: 'x.x.x.x.x.x.x.x.', openhat: '..............o.', bass: 'x..x..x.x..x..x.', lead: 'o..o..o.....o...' },
  lofi:      { bpm: [70, 84],   swing: 0.6,  mode: 'minor',    kick: 'x.....o.x.o...o.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', openhat: '...........o....', bass: 'x.....o.x.....o.', lead: 'o.o...o...o.o...' },
};

/** mulberry32: small seeded PRNG so a seed always reproduces the same beat. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export type Produced = { bpm: number; swing: number; key: string; mode: Mode; genre: Genre; seed: number; pattern: PatternState };

export function produce(opts: { genre: Genre; key?: string; seed?: number; mode?: Mode }): Produced {
  const r = RECIPES[opts.genre] ?? RECIPES.trap;
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const rand = rng(seed);
  const keyIdx = Math.max(0, KEYS.indexOf((opts.key ?? KEYS[Math.floor(rand() * 12)]) as (typeof KEYS)[number]));
  const mode = opts.mode ?? r.mode;
  const scale = SCALES[mode];
  const bpm = Math.round(r.bpm[0] + rand() * (r.bpm[1] - r.bpm[0]));
  const pat = defaultPattern();
  const on = (c: string) => c === 'x' || (c === 'o' && rand() < 0.5);
  const fill = (id: string, tpl: string | undefined, note?: (i: number) => number) => {
    const lane = pat.lanes.find(l => l.id === id); if (!lane || !tpl) return;
    for (let i = 0; i < 16; i++) if (on(tpl[i])) { lane.cells[i] = note ? note(i) : 60; lane.cells[i + 16] = lane.cells[i]; }
  };
  fill('kick', r.kick); fill('snare', r.snare); fill('clap', r.clap); fill('hat', r.hat); fill('openhat', r.openhat); fill('tom', r.tom);
  // Bar 2 variation: a ghost hit or a rolled hat so the loop doesn't feel copy-pasted.
  const hat = pat.lanes.find(l => l.id === 'hat')!;
  if (r.hatRoll) [13, 14, 15].forEach(i => { if (rand() < 0.6) hat.cells[16 + i] = 60; });
  const kick = pat.lanes.find(l => l.id === 'kick')!;
  if (rand() < 0.7) kick.cells[16 + 14] = kick.cells[16 + 14] === null ? 60 : null;
  const root = 24 + keyIdx; // bass register, C1 upward
  const pick = (degrees: number[], oct: number) => { const d = degrees[Math.floor(rand() * degrees.length)]; return root + 12 * oct + scale[d % 7]; };
  const bassDeg = [0, 0, 0, 4, 2, 6];
  fill('bass', r.bass, i => (i % 8 === 0 ? root + 12 : pick(bassDeg, 1)));
  const leadDeg = [0, 2, 4, 6, 1, 3];
  const contour = [0, 2, 4, 2, 5, 4, 2, 0];
  fill('lead', r.lead, i => root + 36 + scale[contour[Math.floor(i / 2) % 8] % 7] + (rand() < 0.15 ? 12 : 0) + (leadDeg.length ? 0 : 0));
  pat.steps = 32;
  pat.swing = r.swing;
  pat.lanes.forEach(l => { if (l.id === 'hat') l.gainDb = -6; if (l.id === 'lead') l.gainDb = -8; if (l.id === 'bass') l.gainDb = -2; });
  return { bpm, swing: r.swing, key: KEYS[keyIdx], mode, genre: opts.genre, seed, pattern: pat };
}

/** Turn an untrusted JSON object (e.g. from an LLM) into a valid pattern, or null. Never throws. */
export function sanitizeAiPattern(raw: unknown): { bpm: number; swing: number; pattern: PatternState } | null {
  try {
    const o = raw as { bpm?: unknown; swing?: unknown; steps?: unknown; lanes?: unknown };
    if (!o || typeof o !== 'object' || !o.lanes || typeof o.lanes !== 'object') return null;
    const pat = defaultPattern();
    pat.steps = o.steps === 32 ? 32 : 16;
    let any = false;
    for (const lane of pat.lanes) {
      const src: unknown = (o.lanes as Record<string, unknown>)[lane.id];
      if (!Array.isArray(src)) continue;
      for (const item of (src as unknown[]).slice(0, MAX_STEPS)) {
        const step: unknown = typeof item === 'number' ? item : (item as { step?: number } | null)?.step;
        const note = typeof item === 'object' && item ? (item as { note?: number }).note : undefined;
        if (typeof step !== 'number' || !Number.isInteger(step) || step < 0 || step >= pat.steps) continue;
        const pitched = lane.kind === 'bass' || lane.kind === 'lead';
        lane.cells[step] = pitched ? clamp(Math.round(typeof note === 'number' ? note : lane.kind === 'bass' ? 36 : 72), 24, 96) : 60;
        any = true;
      }
    }
    if (!any) return null;
    pat.lanes.forEach(l => { if (l.id === 'hat') l.gainDb = -6; if (l.id === 'lead') l.gainDb = -8; });
    return { bpm: clamp(Math.round(Number(o.bpm) || 100), 50, 200), swing: clamp(Number(o.swing) || 0, 0, 1), pattern: pat };
  } catch { return null; }
}

/** Average the gaps between taps (ms timestamps) into a BPM. Ignores a long pause that starts a new count. */
export function tapTempo(taps: number[]): number | null {
  const t = taps.slice(-8);
  const gaps: number[] = [];
  for (let i = 1; i < t.length; i++) { const g = t[i] - t[i - 1]; if (g > 200 && g < 2000) gaps.push(g); }
  if (gaps.length < 2) return null;
  return Math.round(clamp(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length), 40, 240));
}
