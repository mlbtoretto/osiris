'use client';

import { useEffect, useState } from 'react';
import { PLATFORM_FEEDS } from '@/lib/platform-feeds';

const btn = 'rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[9px] tracking-[0.14em]';
const btnOn = 'border-[var(--gold-primary)]/60 bg-[var(--gold-primary)]/15 text-[var(--gold-light)]';

type Result = { id: string; name: string; ok: boolean; error?: string };
type Manifest = { date: string; results: Result[] };

export default function PlatformPipeline() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [running, setRunning] = useState(false);
  const [goingTo, setGoingTo] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const load = () => fetch('/api/masa/platform-pipeline').then(r => r.json()).then(d => setManifest(d.manifest || null)).catch(() => {});
  useEffect(() => { if (open) load(); }, [open]);

  const goLogin = async (url: string, id: string) => {
    setGoingTo(id); setError('');
    try {
      await fetch('/api/chrome/devtools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'launch' }) });
      await new Promise(r => setTimeout(r, 800));
      await fetch('/api/chrome/devtools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'navigate', url }) });
    } catch {
      setError('Could not reach the Chrome CDP endpoint.');
    } finally {
      setGoingTo('');
    }
  };

  const runNow = async () => {
    setRunning(true); setError('');
    try {
      const res = await fetch('/api/masa/platform-pipeline', { method: 'POST' });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setManifest(data);
    } catch {
      setError('Pipeline request failed.');
    } finally {
      setRunning(false);
    }
  };

  const status = (id: string) => manifest?.results.find(r => r.id === id);

  return (
    <div className="rounded border border-white/10 bg-black/40 p-2 space-y-2">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between text-left">
        <div>
          <div className="text-[10px] tracking-[0.16em] text-[var(--gold-light)]">DAILY PLATFORM PIPELINE</div>
          <div className="text-[8px] text-[var(--text-muted)]">Runs 08:17 local daily · log in once per platform, it stays signed in.</div>
        </div>
        <span className="text-[var(--text-muted)]">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="space-y-2">
          {error && <div className="rounded border border-red-400/40 bg-red-500/10 p-1.5 text-[9px] text-red-200">{error}</div>}
          <button type="button" onClick={runNow} disabled={running} className={`${btn} ${btnOn} w-full disabled:opacity-40`}>{running ? 'RUNNING…' : 'RUN PIPELINE NOW'}</button>
          {manifest && <div className="text-[8px] text-[var(--text-muted)]">Last run: {manifest.date}</div>}

          {(['social', 'bounty'] as const).map(cat => (
            <div key={cat} className="space-y-1">
              <div className="text-[8px] tracking-[0.16em] text-[var(--cyan-primary)]">{cat === 'social' ? 'FEEDS' : 'BUG BOUNTY'}</div>
              {PLATFORM_FEEDS.filter(f => f.category === cat).map(f => {
                const s = status(f.id);
                return (
                  <div key={f.id} className="flex items-center gap-2 rounded border border-white/10 px-2 py-1">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s ? (s.ok ? 'bg-[#53e38b]' : 'bg-red-400') : 'bg-white/20'}`} />
                    <span className="flex-1 truncate text-[9px] text-[var(--text-secondary)]">{f.name}</span>
                    {s && !s.ok && <span className="text-[7px] text-red-300">last run failed</span>}
                    <a href={s?.ok ? `/api/masa/platform-pipeline/image/${manifest!.date}/${f.id}` : undefined} target="_blank" rel="noreferrer" className={`text-[8px] ${s?.ok ? 'text-[var(--gold-light)] underline' : 'text-white/20 pointer-events-none'}`}>VIEW</a>
                    <button type="button" onClick={() => goLogin(f.url, f.id)} disabled={goingTo === f.id} className={`${btn} disabled:opacity-40`}>{goingTo === f.id ? '…' : 'LOG IN'}</button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
