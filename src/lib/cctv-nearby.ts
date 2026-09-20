/**
 * Rank CCTV cameras by real distance to a fix.
 * Used by the nearby API path and by preview bias on the client.
 */

import { haversine, type LngLat } from './geo';

export type NearbyCamera = {
  id: string | number;
  lat: number;
  lng: number;
  [key: string]: unknown;
};

export type RankedCamera<T extends NearbyCamera> = T & { distanceKm: number };

function coordsOf(cam: NearbyCamera): LngLat | null {
  const lat = Number(cam.lat);
  const lng = Number(cam.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}

/**
 * Keep cameras within radiusKm of the fix, nearest first.
 * `limit` caps the result (default 200).
 */
export function filterCamerasNear<T extends NearbyCamera>(
  cameras: T[],
  lat: number,
  lng: number,
  radiusKm: number,
  limit = 200,
): RankedCamera<T>[] {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return [];
  const origin: LngLat = [lng, lat];
  const out: RankedCamera<T>[] = [];
  for (const cam of cameras) {
    const at = coordsOf(cam);
    if (!at) continue;
    const distanceKm = haversine(origin, at);
    if (distanceKm > radiusKm) continue;
    out.push({ ...cam, distanceKm });
  }
  out.sort((a, b) => a.distanceKm - b.distanceKm);
  return out.slice(0, Math.max(1, Math.floor(limit)));
}

/** Sort in place by distance to fix (no radius cut). Missing coords go last. */
export function sortCamerasByDistance<T extends NearbyCamera>(
  cameras: T[],
  lat: number,
  lng: number,
): T[] {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return cameras;
  const origin: LngLat = [lng, lat];
  return [...cameras].sort((a, b) => {
    const aa = coordsOf(a);
    const bb = coordsOf(b);
    if (!aa && !bb) return 0;
    if (!aa) return 1;
    if (!bb) return -1;
    return haversine(origin, aa) - haversine(origin, bb);
  });
}
