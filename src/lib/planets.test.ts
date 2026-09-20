import { describe, expect, it } from 'vitest';
import { nextPlanet, PLANETS } from './planets';
import { OPERATOR_SITES } from './operator-sites';

describe('planets', () => {
  it('slides left from earth to nemesis and right to ares', () => {
    expect(nextPlanet('earth', 1)).toBe('ares');
    expect(nextPlanet('earth', -1)).toBe('nemesis');
  });
  it('has five worlds', () => {
    expect(PLANETS.map(p => p.id)).toEqual(['earth', 'ares', 'styx', 'iris', 'nemesis']);
  });
});

describe('operator sites', () => {
  it('puts corp in Iraq and the farm in New York', () => {
    const corp = OPERATOR_SITES.find(s => s.id === 'corp-iraq');
    const farm = OPERATOR_SITES.find(s => s.id === 'farm-nyc');
    expect(corp?.country).toBe('Iraq');
    expect(farm?.city).toBe('New York');
  });
});
