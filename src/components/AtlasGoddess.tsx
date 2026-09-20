'use client';

/**
 * Theatrical Atlas goddess — stylized stage figure for the ground marker.
 * Mood / wind come from realtime local weather at her lat/lng.
 */

import type { AtlasMood } from '@/lib/atlas-roam';

type Props = {
  cityLabel?: string;
  heading?: number;
  mood?: AtlasMood;
  windKph?: number | null;
  temperatureC?: number | null;
  condition?: string;
};

export default function AtlasGoddess({
  cityLabel = 'ATLAS',
  heading = 0,
  mood = 'clear',
  windKph = null,
  temperatureC = null,
  condition,
}: Props) {
  const sway = windKph != null ? Math.min(1, windKph / 40) : 0.25;
  return (
    <div
      className="atlas-stage"
      data-mood={mood}
      style={{
        ['--atlas-heading' as string]: `${heading}deg`,
        ['--atlas-sway' as string]: String(sway),
      }}
    >
      <div className="atlas-stage-floor" />
      <div className="atlas-figure" aria-hidden>
        <div className="atlas-orb" />
        <div className="atlas-crown" />
        <div className="atlas-head" />
        <div className="atlas-torso" />
        <div className="atlas-arm atlas-arm-l" />
        <div className="atlas-arm atlas-arm-r" />
        <div className="atlas-robe" />
        <div className="atlas-base" />
      </div>
      <div className="atlas-caption">
        <span className="atlas-caption-mark">ATLAS</span>
        <span className="atlas-caption-city">{cityLabel}</span>
        <span className="atlas-caption-wx">
          {condition || mood}
          {temperatureC != null && Number.isFinite(temperatureC)
            ? ` · ${Math.round(temperatureC)}°`
            : ''}
          {windKph != null && Number.isFinite(windKph)
            ? ` · ${Math.round(windKph)}k`
            : ''}
        </span>
      </div>
    </div>
  );
}
