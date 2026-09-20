import { describe, expect, it } from 'vitest';
import { DESIGN_PAIR, MODEL_BENCH, TEAM_FREE } from './free-models';

describe('MASA IA model bench', () => {
  it('keeps a free team and a design pair', () => {
    expect(TEAM_FREE.some(m => m.id === 'glm-flash')).toBe(true);
    expect(TEAM_FREE.length).toBeGreaterThanOrEqual(8);
    expect(DESIGN_PAIR).toEqual(['deepseek-flash', 'kimi-k3']);
    expect(MODEL_BENCH.find(m => m.id === 'gpt-6-astra')?.cost).toBe('paid');
    expect(MODEL_BENCH.find(m => m.id === 'kimi-k3')?.cost).toBe('paid');
    expect(MODEL_BENCH.find(m => m.id === 'ollama-horus')?.maxTokens).toBeGreaterThanOrEqual(128000);
  });
});
