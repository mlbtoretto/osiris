import { describe, expect, it } from 'vitest';
import { ARMY_MAX_TOKENS, agentArmyStatus } from './agent-army';

describe('agent army', () => {
  it('exposes a high completion budget without claiming quota bypass', () => {
    expect(ARMY_MAX_TOKENS).toBeGreaterThanOrEqual(32_000);
    const status = agentArmyStatus(8);
    expect(status.size).toBe(1000);
    expect(status.freeLanes).toBeGreaterThanOrEqual(8);
    expect(status.note).toMatch(/no provider quota bypass/i);
    expect(status.sample).toHaveLength(8);
  });
});
