/**
 * ATLAS — realtime ground presence from location + weather.
 *
 * Pose comes from the operator's live fix (or home). Weather moods drive the
 * theatrical figure: wind turns her, rain/storm/snow change the stage.
 */

import type { LocalWeather } from '@/lib/local-weather';
import { wmoLabel } from '@/lib/local-weather';

export type AtlasMood = 'clear' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog' | 'night';

export type AtlasLivePose = {
  lat: number;
  lng: number;
  /** Degrees clockwise from north — GPS heading, else wind from, else 0. */
  heading: number;
  label: string;
  mood: AtlasMood;
  condition: string;
  temperatureC: number | null;
  windKph: number | null;
  isDay: boolean;
  precipitationMm: number | null;
};

export function moodFromWeather(w: LocalWeather | null | undefined): AtlasMood {
  if (!w) return 'clear';
  if (!w.isDay) {
    const code = w.weatherCode ?? 0;
    if (code >= 95) return 'storm';
    if (code >= 71 && code <= 86) return 'snow';
    if (code >= 51 && code <= 67) return 'rain';
    if (code === 45 || code === 48) return 'fog';
    return 'night';
  }
  const code = w.weatherCode ?? 0;
  if (code >= 95) return 'storm';
  if (code >= 71 && code <= 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 2 && code <= 3) return 'cloud';
  return 'clear';
}

/**
 * Build a live Atlas pose.
 * Heading priority: GPS heading → wind direction (from) → 0.
 */
export function atlasLivePose(opts: {
  lat: number;
  lng: number;
  gpsHeading?: number | null;
  city?: string;
  weather?: LocalWeather | null;
}): AtlasLivePose {
  const w = opts.weather ?? null;
  const gps =
    typeof opts.gpsHeading === 'number' && Number.isFinite(opts.gpsHeading) && opts.gpsHeading >= 0
      ? opts.gpsHeading
      : null;
  const wind =
    w && typeof w.windDir === 'number' && Number.isFinite(w.windDir)
      ? w.windDir
      : null;

  return {
    lat: opts.lat,
    lng: opts.lng,
    heading: gps ?? wind ?? 0,
    label: opts.city || (w ? w.condition : 'ATLAS'),
    mood: moodFromWeather(w),
    condition: w ? w.condition : wmoLabel(null),
    temperatureC: w?.temperatureC ?? null,
    windKph: w?.windKph ?? null,
    isDay: w?.isDay ?? true,
    precipitationMm: w?.precipitationMm ?? null,
  };
}

/** Google-Earth-like ground camera for Atlas follow. */
export const ATLAS_GROUND_CAMERA = {
  zoom: 16.2,
  pitch: 58,
  durationMs: 900,
} as const;
