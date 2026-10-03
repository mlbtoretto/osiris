'use client';

import { useState } from 'react';
import { NASA_FACT_SHEET, NASA_PLANETS } from '@/lib/nasa-planets';

export default function PlanetStroll({ onVisit }: { onVisit: (index: number) => void }) {
  const [index, setIndex] = useState(2);
  const [close, setClose] = useState(0.45);
  const planet = NASA_PLANETS[index];

  return (
    <div className="pointer-events-auto w-[min(92vw,420px)] rounded-xl border border-white/10 bg-black/55 p-2 backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-between font-mono text-[8px] tracking-[0.18em] text-white/45">
        <span>NASA PLANETS</span>
        <a href={NASA_FACT_SHEET} target="_blank" rel="noopener noreferrer" className="text-[#8ec5ff]">FACT SHEET</a>
      </div>
      <div className="mb-2 flex gap-1 overflow-x-auto">
        {NASA_PLANETS.map((body, i) => (
          <button
            key={body.id}
            type="button"
            onClick={() => { setIndex(i); onVisit(i); }}
            className={`shrink-0 rounded-full px-2 py-1 font-mono text-[9px] tracking-wider ${i === index ? 'bg-white/15 text-white' : 'text-white/55'}`}
          >
            {body.name.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 rounded-full shadow-[0_0_24px_rgba(142,197,255,0.35)]"
          style={{ width: 36 + close * 72, height: 36 + close * 72, background: `radial-gradient(circle at 35% 35%, #fff6, ${planet.color} 42%, #000 78%)` }}
        />
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-white">{planet.name} · {planet.adapt === 'yes' ? 'ADAPTABLE' : 'NOT ADAPTABLE'}</div>
          <div className="font-mono text-[9px] leading-snug text-white/70">{planet.why}</div>
          <div className="mt-1 font-mono text-[8px] text-white/45">{planet.gravityG} g · {planet.tempC}°C · {planet.pressure} · {planet.air}</div>
        </div>
      </div>
      <input
        aria-label="Zoom this planet"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={close}
        onChange={event => setClose(Number(event.target.value))}
        className="mt-2 w-full"
      />
    </div>
  );
}
