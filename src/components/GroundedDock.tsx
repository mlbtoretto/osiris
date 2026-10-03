'use client';

import { useEffect, useRef, useState } from 'react';

type Fix = { lat: number; lng: number };
type Hit = { icon?: string; lat: number; lng: number; area?: string; title?: string };

const inBox = (hit: Hit, south: number, north: number, west: number, east: number) =>
  hit.lat >= south && hit.lat <= north && hit.lng >= west && hit.lng <= east;

export default function GroundedDock({
  fix,
  events,
  streetOpen,
  onStreet,
  onFly,
}: {
  fix: Fix | null;
  events: Hit[];
  streetOpen: boolean;
  onStreet: () => void;
  onFly: (lat: number, lng: number) => void;
}) {
  const rain = events.find(hit => hit.icon === 'rain' && inBox(hit, 24.4, 31.1, -87.7, -79.8));
  const snow = events.find(hit => hit.icon === 'snow' && inBox(hit, 36.9, 40.1, -102.1, -94.5));
  const [samples, setSamples] = useState<{ rain: number; snow: number }[]>([]);
  const last = useRef('');

  useEffect(() => {
    const rainCount = events.filter(hit => hit.icon === 'rain').length;
    const snowCount = events.filter(hit => hit.icon === 'snow').length;
    const key = `${rainCount}:${snowCount}:${events.length}`;
    if (key === last.current) return;
    last.current = key;
    setSamples(prev => [...prev, { rain: rainCount, snow: snowCount }].slice(-24));
  }, [events]);

  const max = Math.max(1, ...samples.flatMap(sample => [sample.rain, sample.snow]));
  const line = (key: 'rain' | 'snow') => samples.map((sample, index) => {
    const x = samples.length === 1 ? 0 : (index / (samples.length - 1)) * 120;
    const y = 28 - (sample[key] / max) * 26;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const street = fix
    ? `https://www.google.com/maps?layer=c&cbll=${fix.lat},${fix.lng}&cbp=11,0,0,0,0&output=svembed`
    : '';

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        <button type="button" disabled={!fix} onClick={onStreet} className="rounded-md border border-white/15 px-2 py-1 font-mono text-[9px] tracking-wider text-white/80 disabled:opacity-30">
          {streetOpen ? 'CLOSE STREET' : 'STREET'}
        </button>
        <button type="button" disabled={!fix} onClick={() => fix && onFly(fix.lat, fix.lng)} className="rounded-md border border-white/15 px-2 py-1 font-mono text-[9px] tracking-wider text-white/80 disabled:opacity-30">
          HERE
        </button>
        {rain && (
          <button type="button" onClick={() => onFly(rain.lat, rain.lng)} className="rounded-md border border-[#4FC3F7]/50 px-2 py-1 font-mono text-[9px] tracking-wider text-[#4FC3F7]">
            FL RAIN
          </button>
        )}
        {snow && (
          <button type="button" onClick={() => onFly(snow.lat, snow.lng)} className="rounded-md border border-white/50 px-2 py-1 font-mono text-[9px] tracking-wider text-white">
            KS SNOW
          </button>
        )}
      </div>
      {samples.length > 1 && (
        <svg viewBox="0 0 120 32" className="h-8 w-32">
          <polyline fill="none" stroke="#4FC3F7" strokeWidth="1.4" points={line('rain')} />
          <polyline fill="none" stroke="#F5F7FA" strokeWidth="1.4" points={line('snow')} />
        </svg>
      )}
      {streetOpen && fix && (
        <iframe
          title="Street View at the GPS fix"
          src={street}
          className="h-44 w-72 rounded-lg border border-white/15 bg-black"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
