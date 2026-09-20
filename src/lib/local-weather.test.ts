import { describe, expect, it } from 'vitest';
import { parseCoord, wmoLabel } from './local-weather';

describe('parseCoord', () => {
  it('accepts a latitude', () => {
    expect(parseCoord('29.76', -90, 90)).toBeCloseTo(29.76);
  });
  it('rejects out of range', () => {
    expect(parseCoord('91', -90, 90)).toBeNull();
    expect(parseCoord('181', -180, 180)).toBeNull();
  });
  it('rejects junk', () => {
    expect(parseCoord('n/a', -90, 90)).toBeNull();
    expect(parseCoord(null, -90, 90)).toBeNull();
  });
});

describe('wmoLabel', () => {
  it('maps clear and rain', () => {
    expect(wmoLabel(0)).toBe('Clear');
    expect(wmoLabel(63)).toBe('Rain');
  });
  it('falls back', () => {
    expect(wmoLabel(999)).toBe('Unknown');
    expect(wmoLabel(undefined)).toBe('Unknown');
  });
});
