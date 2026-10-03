import { describe, expect, it } from 'vitest';
import { GENRES, produce, sanitizeAiPattern, tapTempo } from './studio-producer';

describe('studio-producer', () => {
  it('is deterministic per seed', () => {
    const a = produce({ genre: 'trap', key: 'F', seed: 7 }); const b = produce({ genre: 'trap', key: 'F', seed: 7 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(produce({ genre: 'trap', key: 'F', seed: 8 }).pattern)).not.toBe(JSON.stringify(a.pattern));
  });
  it('produces something playable for every genre', () => {
    for (const g of GENRES) {
      const p = produce({ genre: g, seed: 42 });
      expect(p.bpm).toBeGreaterThan(60); expect(p.bpm).toBeLessThan(160);
      const kick = p.pattern.lanes.find(l => l.id === 'kick')!;
      expect(kick.cells.slice(0, 16).some(c => c !== null)).toBe(true);
      expect(p.pattern.lanes.find(l => l.id === 'snare')!.cells.some(c => c !== null)).toBe(true);
    }
  });
  it('keeps bass and lead notes inside the key', () => {
    const p = produce({ genre: 'house', key: 'A', seed: 3, mode: 'minor' });
    const scale = new Set([0, 2, 3, 5, 7, 8, 10].map(d => (9 + d) % 12));
    for (const id of ['bass', 'lead']) for (const n of p.pattern.lanes.find(l => l.id === id)!.cells) if (n !== null) expect(scale.has(n % 12)).toBe(true);
  });
  it('accepts a sane AI pattern and clamps bad values', () => {
    const ok = sanitizeAiPattern({ bpm: 900, swing: 5, steps: 16, lanes: { kick: [0, 4, 8, 12, 99, -1, 1.5], bass: [{ step: 0, note: 5 }, { step: 4, note: 40 }], nope: [1] } })!;
    expect(ok.bpm).toBe(200); expect(ok.swing).toBe(1);
    expect(ok.pattern.lanes.find(l => l.id === 'kick')!.cells.filter(c => c !== null)).toHaveLength(4);
    expect(ok.pattern.lanes.find(l => l.id === 'bass')!.cells[0]).toBe(24);
  });
  it('rejects junk', () => {
    for (const bad of [null, 5, 'x', {}, { lanes: {} }, { lanes: { kick: 'no' } }]) expect(sanitizeAiPattern(bad)).toBeNull();
  });
  it('tap tempo needs a few taps and averages them', () => {
    expect(tapTempo([0, 500])).toBeNull();
    expect(tapTempo([0, 500, 1000, 1500])).toBe(120);
    expect(tapTempo([0, 5000, 5500, 6000, 6500])).toBe(120);
  });
});
