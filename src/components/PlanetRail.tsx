'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PLANETS, type PlanetId } from '@/lib/planets';

export default function PlanetRail({
  planet,
  onPlanet,
}: {
  planet: PlanetId;
  onPlanet: (id: PlanetId) => void;
}) {
  const i = PLANETS.findIndex(p => p.id === planet);
  const prev = PLANETS[(i - 1 + PLANETS.length) % PLANETS.length];
  const next = PLANETS[(i + 1) % PLANETS.length];
  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-panel)]/80 backdrop-blur-xl px-0.5 py-0.5">
      <button type="button" aria-label={`Slide to ${prev.name}`} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => onPlanet(prev.id)}>
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      {PLANETS.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPlanet(p.id)}
          className="px-2 py-1 text-[8px] font-mono tracking-[0.18em] border-b-2 border-transparent hover:text-[var(--text-primary)]"
          style={planet === p.id ? { color: p.accent, borderBottomColor: p.accent } : { color: 'var(--text-muted)' }}
          title={p.holds}
        >
          {p.name}
        </button>
      ))}
      <button type="button" aria-label={`Slide to ${next.name}`} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => onPlanet(next.id)}>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
