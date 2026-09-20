'use client';

import { useState } from 'react';
import { PLANET_VAULTS, planetById, type PlanetId, type Vault } from '@/lib/planets';

export default function HiddenPlanetStage({ planetId }: { planetId: Exclude<PlanetId, 'earth'> }) {
  const planet = planetById(planetId);
  const vaults = PLANET_VAULTS[planetId];
  const [open, setOpen] = useState<Vault | null>(null);

  return (
    <div className="absolute inset-0 z-[1] overflow-hidden" style={{ background: planet.background }}>
      <div className="planet-starfield" />
      <div
        className="planet-disc"
        style={{
          boxShadow: `0 0 80px ${planet.atmosphere}, inset -40px -20px 80px rgba(0,0,0,0.65)`,
          background: `radial-gradient(circle at 32% 28%, ${planet.atmosphere}, #111 42%, #000 70%)`,
        }}
      />
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center pt-[12vh]">
        <div className="text-[11px] tracking-[0.45em] font-mono" style={{ color: planet.accent }}>
          {planet.subtitle.toUpperCase()}
        </div>
        <div className="mt-2 text-4xl md:text-6xl font-mono tracking-[0.28em]" style={{ color: planet.accent }}>
          {planet.name}
        </div>
        <div className="mt-3 max-w-md text-center text-[11px] tracking-[0.14em] text-[var(--text-secondary)]">
          {planet.holds}
        </div>
      </div>
      {vaults.map(vault => (
        <button
          key={vault.id}
          type="button"
          className="vault-marker"
          style={{ left: `${vault.x}%`, top: `${vault.y}%`, color: planet.accent, borderColor: planet.accent }}
          onClick={() => setOpen(vault)}
        >
          <span className="vault-pulse" style={{ background: planet.accent }} />
          {vault.name}
        </button>
      ))}
      {open && (
        <div className="portal-popup" data-theme={planetId} onClick={() => setOpen(null)}>
          <div className="portal-popup-card" onClick={e => e.stopPropagation()} style={{ borderColor: planet.accent }}>
            <div className="text-[10px] tracking-[0.28em]" style={{ color: planet.accent }}>{open.desk.toUpperCase()}</div>
            <div className="mt-1 text-xl font-mono tracking-[0.16em]" style={{ color: planet.accent }}>{open.name}</div>
            <ul className="mt-4 space-y-2">
              {open.files.map(file => (
                <li key={file.path} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-[11px] tracking-[0.12em] text-[var(--text-heading)]">{file.name}</div>
                  <div className="text-[9px] break-all text-[var(--text-muted)]">{file.path}</div>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-4 text-[10px] tracking-[0.2em] text-[var(--text-muted)]" onClick={() => setOpen(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
