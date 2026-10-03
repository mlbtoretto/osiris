'use client';

import { useMemo, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { ALL_FILES, type InventoryKind } from '@/lib/file-inventory';
import { siteForFile } from '@/lib/operator-sites';

const ORDER: InventoryKind[] = ['project', 'lab', 'vendor', 'data', 'home', 'download', 'url'];

export default function FileRail({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const groups = useMemo(() => ORDER.map(kind => ({
    kind,
    files: ALL_FILES.filter(file => file.kind === kind),
  })).filter(group => group.files.length > 0), []);

  return (
    <aside className="glass-panel flex max-h-[70vh] w-80 flex-col overflow-hidden pointer-events-auto">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <FolderOpen className="h-3.5 w-3.5 text-[var(--gold-primary)]" />
        <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--gold-primary)]">FILES</span>
        <span className="ml-auto font-mono text-[9px] text-white/40">{ALL_FILES.length}</span>
      </div>
      <div className="styled-scrollbar max-h-[60vh] overflow-y-auto px-1.5 py-1.5">
        {groups.map(group => (
          <div key={group.kind} className="mb-2">
            <div className="px-1.5 py-1 font-mono text-[8px] tracking-[0.2em] text-white/35">{group.kind.toUpperCase()}</div>
            {group.files.map(file => {
              const site = file.id ? siteForFile(file.id) : undefined;
              const on = active === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => {
                    setActive(file.id);
                    if (site) onLocate(site.lat, site.lng);
                  }}
                  className={`mb-0.5 w-full rounded-md px-1.5 py-1 text-left font-mono text-[10px] tracking-wide transition-colors ${on ? 'bg-[var(--gold-primary)]/15 text-[var(--gold-primary)]' : 'text-white/70 hover:bg-white/5'}`}
                  title={site ? `${site.name} · ${site.city}` : file.path}
                >
                  {file.name}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
