'use client';

import { BarChart3, Layers3, Network, Radar, Route, Search, Brain, type LucideIcon } from 'lucide-react';

export type HomeApplet = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
};

export default function HomeApplets({ applets }: { applets: HomeApplet[] }) {
  return (
    <nav
      aria-label="MASA home applets"
      className="pointer-events-auto grid grid-cols-3 gap-2 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-panel)]/85 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:grid-cols-6"
    >
      {applets.map(({ id, label, hint, icon: Icon, color, onClick }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          title={hint}
          className="group flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-mono tracking-[0.12em] text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/20 transition-transform group-hover:scale-105"
            style={{ color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
