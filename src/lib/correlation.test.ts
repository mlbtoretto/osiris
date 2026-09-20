import { describe, expect, it } from 'vitest';
import { buildCorrelationGraph, UNIFIED_TOOLS } from './correlation';
import { INTERNET_LAYERS, ROBIN_ENGINES } from './internet-surface';

describe('correlation graph', () => {
  it('links LangSmith, Earth sites, and OSINT racks', () => {
    const g = buildCorrelationGraph([{
      id: 'n1', ts: '2026-01-01', title: 'Baghdad cell', body: 'HQ watch', agent: 'corp-iraq', planet: 'earth', tags: ['corp'],
    }]);
    expect(g.nodes.some(n => n.id === 'langsmith')).toBe(true);
    expect(g.nodes.some(n => n.id === 'site:corp-iraq')).toBe(true);
    expect(g.nodes.some(n => n.id === 'tool:shodan')).toBe(true);
    expect(g.nodes.some(n => n.id === 'tool:robin')).toBe(true);
    expect(g.links.some(l => l.source === 'langsmith' && l.target === 'note:n1')).toBe(true);
  });
  it('covers every internet layer and Robin engines', () => {
    const layers = new Set(UNIFIED_TOOLS.map(t => t.layer));
    for (const layer of INTERNET_LAYERS) expect(layers.has(layer.id)).toBe(true);
    expect(ROBIN_ENGINES.length).toBe(16);
    expect(UNIFIED_TOOLS.some(t => t.id === 'maltego' && t.use === 'commercial')).toBe(true);
    expect(UNIFIED_TOOLS.some(t => t.id === 'robin' && t.use === 'oss')).toBe(true);
  });
});
