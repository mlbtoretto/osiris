'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Building2, Cpu, Ghost } from 'lucide-react';
import { KIND_COLOR, OPERATOR_SITES, type OperatorKind, type OperatorSite } from '@/lib/operator-sites';

const KIND_ICON: Record<OperatorKind, typeof Building2> = {
  corp: Building2,
  farm: Cpu,
  agent: Ghost,
  archive: Ghost,
  storm: Ghost,
};

export default function PortalDropdown({
  onPortal,
}: {
  onPortal: (site: OperatorSite) => void;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const groups = useMemo(() => {
    const order: OperatorKind[] = ['corp', 'storm', 'farm', 'agent', 'archive'];
    return order
      .map(kind => ({ kind, sites: OPERATOR_SITES.filter(s => s.kind === kind) }))
      .filter(g => g.sites.length > 0);
  }, []);
  const active = OPERATOR_SITES.find(s => s.id === picked);

  return (
    <div className="relative pointer-events-auto">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-panel)]/80 backdrop-blur-xl px-2.5 py-1.5 text-[9px] font-mono tracking-[0.18em] text-[var(--gold-light)]"
      >
        PORTALS
        <span className="text-[var(--text-muted)]">{active ? active.name : 'DROP'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute bottom-full mb-2 left-0 w-[min(92vw,320px)] max-h-[min(70vh,420px)] overflow-y-auto styled-scrollbar rounded-xl border border-[var(--border-primary)] bg-[var(--bg-panel)]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.55)] p-2 z-[500]"
        >
          {groups.map(group => (
            <div key={group.kind} className="mb-2 last:mb-0">
              <div className="px-2 py-1 text-[8px] tracking-[0.22em] text-[var(--text-muted)]">
                {group.kind.toUpperCase()}
              </div>
              {group.sites.map(site => {
                const Icon = KIND_ICON[site.kind];
                const color = KIND_COLOR[site.kind];
                return (
                  <button
                    key={site.id}
                    type="button"
                    role="option"
                    aria-selected={picked === site.id}
                    onClick={() => {
                      setPicked(site.id);
                      setOpen(false);
                      onPortal(site);
                    }}
                    className="w-full text-left rounded-lg px-2 py-2 hover:bg-white/5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--gold-primary)]"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                      <span className="text-[11px] font-mono tracking-[0.12em]" style={{ color }}>{site.name}</span>
                      <span className="ml-auto text-[9px] text-[var(--text-muted)]">{site.state} · {site.city}</span>
                    </div>
                    <div className="pl-6 text-[9px] text-[var(--text-secondary)] leading-snug">{site.cover}</div>
                    {site.files.length > 0 && (
                      <div className="pl-6 mt-1 text-[8px] tracking-[0.08em] text-[var(--text-muted)] uppercase">
                        {site.files.length} files · {site.files.slice(0, 6).map(f => f.name).join(' · ')}
                        {site.files.length > 6 ? '…' : ''}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
