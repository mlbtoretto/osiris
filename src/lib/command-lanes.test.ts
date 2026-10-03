import { describe, expect, it } from 'vitest';
import { buildLanes, RUNTIME_META, type LaneConfig } from './command-lanes';

const CONFIG: LaneConfig = {
  runtimes: {
    hermes: { models: [{ provider: 'auto', model: '', label: 'Auto (Hermes default chain)' }] },
    openclaw: { agents: ['magic'] },
    pi: { providers: ['nvidia'], models: { nvidia: ['z-ai/glm-5.3'] } },
    free: { models: [{ id: 'zai-glm-47-flash', label: 'Z.AI · GLM 4.7 Flash (free)' }] },
    ollama: { models: ['llama3.2:1b'] },
    'agent-zero': { note: 'active preset' },
    notrack: { note: 'notrack-uncensored', configured: false },
    junie: { note: 'one-shot code agent' },
    crush: { note: 'default model' },
    t3: { note: 'desktop workspace', launchOnly: true },
  },
};

describe('buildLanes', () => {
  it('panels every chat runtime separately', () => {
    const ids = buildLanes(CONFIG).map(l => l.id);
    expect(ids).toContain('hermes-0');
    expect(ids).toContain('openclaw-magic');
    expect(ids).toContain('pi-nvidia-z-ai/glm-5.3');
    expect(ids).toContain('free-zai-glm-47-flash');
    expect(ids).toContain('ollama-llama3.2:1b');
    expect(ids).toContain('agent-zero');
    expect(ids).toContain('junie');
    expect(ids).toContain('crush');
  });

  it('carries the backend model id on free and ollama lanes', () => {
    const lanes = buildLanes(CONFIG);
    expect(lanes.find(l => l.id === 'free-zai-glm-47-flash')?.model).toBe('zai-glm-47-flash');
    expect(lanes.find(l => l.id === 'ollama-llama3.2:1b')?.model).toBe('llama3.2:1b');
  });

  it('mounts t3 as a launch-only lane', () => {
    const t3 = buildLanes(CONFIG).find(l => l.id === 't3');
    expect(t3?.launchOnly).toBe(true);
    expect(t3?.runtime).toBe('t3');
  });

  it('gates notrack on configuration', () => {
    expect(buildLanes(CONFIG).some(l => l.runtime === 'notrack')).toBe(false);
    const on: LaneConfig = { runtimes: { ...CONFIG.runtimes, notrack: { note: 'x', configured: true } } };
    expect(buildLanes(on).some(l => l.runtime === 'notrack')).toBe(true);
  });

  it('survives null config and missing pi providers', () => {
    expect(buildLanes(null)).toEqual([]);
    const bad: LaneConfig = { runtimes: { ...CONFIG.runtimes, pi: { providers: ['ghost'], models: {} } } };
    expect(() => buildLanes(bad)).not.toThrow();
    expect(buildLanes(bad).some(l => l.runtime === 'pi')).toBe(false);
  });

  it('gives every runtime a vice neon', () => {
    for (const lane of buildLanes(CONFIG)) {
      expect(RUNTIME_META[lane.runtime].neon).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
