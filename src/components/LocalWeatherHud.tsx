'use client';

import type { LocalWeather } from '@/lib/local-weather';

function fmt(n: number | null, digits = 0, suffix = '') {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}${suffix}`;
}

export default function LocalWeatherHud({ weather, city }: { weather: LocalWeather; city?: string }) {
  const clock = weather.localTime.includes('T')
    ? weather.localTime.slice(11, 16)
    : weather.localTime;
  return (
    <div
      className="pointer-events-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-panel)]/80 backdrop-blur-xl px-2.5 py-1.5"
      title={`${weather.condition} · ${weather.source} · ${weather.timezone}`}
    >
      <div className="flex items-baseline gap-2 font-mono leading-none">
        <span className="text-[14px] font-bold tabular-nums text-[var(--text-heading)]">
          {fmt(weather.temperatureC, 0, '°')}
        </span>
        <span className="text-[9px] tracking-[0.16em] text-[var(--cyan-primary)] uppercase">
          {weather.condition}
        </span>
      </div>
      <div className="mt-1 flex gap-x-2 text-[8px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
        <span>{clock}</span>
        {city ? <span>{city}</span> : null}
        <span>{fmt(weather.windKph, 0, 'k')}</span>
      </div>
    </div>
  );
}
