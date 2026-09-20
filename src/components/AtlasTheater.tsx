'use client';

/** Full-viewport theatrical veil + weather particles for Atlas live mode. */

import type { AtlasLivePose } from '@/lib/atlas-roam';

export default function AtlasTheater({ pose }: { pose: AtlasLivePose }) {
  const showRain = pose.mood === 'rain' || pose.mood === 'storm';
  const showSnow = pose.mood === 'snow';
  return (
    <div className="atlas-theater" data-mood={pose.mood} aria-hidden>
      <div className="atlas-theater-title">
        ATLAS · LIVE
        <span className="atlas-theater-sub">
          {pose.condition}
          {pose.temperatureC != null ? ` · ${Math.round(pose.temperatureC)}°C` : ''}
          {pose.label ? ` · ${pose.label}` : ''}
        </span>
      </div>
      {showRain && (
        <div className="atlas-wx-rain">
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 17) % 100}%`, animationDelay: `${(i % 9) * 0.18}s` }} />
          ))}
        </div>
      )}
      {showSnow && (
        <div className="atlas-wx-snow">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 23) % 100}%`, animationDelay: `${(i % 7) * 0.25}s` }} />
          ))}
        </div>
      )}
      {pose.mood === 'storm' && <div className="atlas-wx-flash" />}
      {pose.mood === 'fog' && <div className="atlas-wx-fog" />}
    </div>
  );
}
