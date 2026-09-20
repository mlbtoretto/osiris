import { describe, expect, it } from 'vitest';
import { COMPANIES, SWARM_SIZE, swarmRoster } from './swarm';
import { INSCRIPTION } from './inscription';

describe('swarm', () => {
  it('is one thousand models, eight companies', () => {
    const roster = swarmRoster();
    expect(roster).toHaveLength(1000);
    expect(SWARM_SIZE).toBe(1000);
    expect(COMPANIES).toHaveLength(8);
    expect(new Set(roster.map(c => c.name)).size).toBe(1000);
  });
  it('inscribes one voice and one vision', () => {
    expect(INSCRIPTION.voice).toBe(1);
    expect(INSCRIPTION.vision).toBe(1);
    expect(INSCRIPTION.hull).toMatch(/Valkyrie/);
  });
});
