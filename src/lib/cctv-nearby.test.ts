import { describe, expect, it } from 'vitest';
import { filterCamerasNear, sortCamerasByDistance } from './cctv-nearby';

const cams = [
  { id: 'far', lat: 40.7, lng: -74.0 },
  { id: 'near', lat: 33.32, lng: 44.37 },
  { id: 'mid', lat: 33.5, lng: 44.5 },
  { id: 'bad', lat: NaN, lng: 0 },
];

describe('cctv nearby', () => {
  it('filters and ranks by haversine within radius', () => {
    const ranked = filterCamerasNear(cams, 33.3152, 44.3661, 50, 10);
    expect(ranked.map(c => c.id)).toEqual(['near', 'mid']);
    expect(ranked[0].distanceKm).toBeLessThan(ranked[1].distanceKm);
  });

  it('sorts without dropping distant cams', () => {
    const sorted = sortCamerasByDistance(cams, 33.3152, 44.3661);
    expect(sorted[0].id).toBe('near');
    expect(sorted.some(c => c.id === 'far')).toBe(true);
  });
});
