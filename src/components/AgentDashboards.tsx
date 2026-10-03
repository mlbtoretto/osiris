'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildLanes, RUNTIME_META, type Lane, type LaneConfig, type RuntimeId } from '@/lib/command-lanes';

type Turn = { input: string; reply: string; model?: string; ok: boolean; ms: number; ts: number };
type Stats = { turns: number; ok: number; fail: number; totalMs: number; lastMs: number };

const emptyStats = (): Stats => ({ turns: 0, ok: 0, fail: 0, totalMs: 0, lastMs: 0 });
const RUNTIME_ORDER: RuntimeId[] = ['hermes', 'openclaw', 'pi', 'free', 'ollama', 'agent-zero', 'junie', 'crush', 'notrack', 't3'];

/** Vice sky: striped sun, scrolling grid floor, stars, rain. One static frame on reduced-motion. */
function ViceSky() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stars = Array.from({ length: 55 }, () => ({ x: Math.random(), y: Math.random() * 0.5, s: Math.random() * 1.4 + 0.4, p: Math.random() * Math.PI * 2 }));
    const drops = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), v: 0.35 + Math.random() * 0.8 }));
    const draw = (t: number) => {
      const w = canvas.clientWidth || 360;
      const h = canvas.clientHeight || 92;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = 0.2 + 0.55 * Math.abs(Math.sin(t / 1100 + s.p));
        ctx.fillStyle = '#ffd9ec';
        ctx.fillRect(s.x * w, s.y * h, s.s, s.s);
      }
      ctx.globalAlpha = 1;
      const cx = w / 2;
      const cy = h * 0.66;
      const r = Math.min(w, h) * 0.42;
      const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
      sun.addColorStop(0, '#ffd24a');
      sun.addColorStop(0.55, '#ff2d78');
      sun.addColorStop(1, '#c2145b');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#05060a';
      let y = cy - r * 0.05;
      let gap = 1.5;
      while (y < cy + r + 2) {
        ctx.fillRect(cx - r - 2, y, r * 2 + 4, gap);
        y += gap + 5;
        gap += 1.4;
      }
      const hz = h * 0.72;
      ctx.strokeStyle = 'rgba(255,45,120,0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, hz);
      ctx.lineTo(w, hz);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,229,204,0.5)';
      ctx.lineWidth = 1;
      for (let i = -9; i <= 9; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * w * 0.018, hz);
        ctx.lineTo(cx + i * w * 0.15, h);
        ctx.stroke();
      }
      for (let k = 0; k < 6; k++) {
        const p = ((t / 1600 + k / 6) % 1 + 1) % 1;
        const gy = hz + (h - hz) * p * p;
        ctx.globalAlpha = 0.15 + p * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,229,204,0.28)';
      for (const d of drops) {
        const dy = ((d.y + t / 1000 * d.v) % 1) * h;
        ctx.beginPath();
        ctx.moveTo(d.x * w, dy);
        ctx.lineTo(d.x * w - 2, dy + 7);
        ctx.stroke();
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw(0);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="block h-[92px] w-full" aria-hidden="true" />;
}

export default function AgentDashboards() {
  const [config, setConfig] = useState<LaneConfig | null>(null);
  const [activeId, setActiveId] = useState('');
  const [threads, setThreads] = useState<Record<string, Turn[]>>({});
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState<string[]>(['VICE DESK ONLINE · ALL LANES STAGED']);
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    fetch('/api/masa/agent-console')
      .then(r => r.json())
      .then((next: LaneConfig) => {
        setConfig(next);
        const first = buildLanes(next).find(l => !l.launchOnly) || buildLanes(next)[0];
        if (first) setActiveId(first.id);
      })
      .catch(() => setError('Could not load model and agent lanes.'));
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      const n = new Date();
      setClock(`${String(n.getUTCHours()).padStart(2, '0')}:${String(n.getUTCMinutes()).padStart(2, '0')}:${String(n.getUTCSeconds()).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const lanes = useMemo(() => buildLanes(config), [config]);
  const active: Lane | undefined = lanes.find(l => l.id === activeId) || lanes.find(l => !l.launchOnly) || lanes[0];
  const groups = useMemo(() => {
    return RUNTIME_ORDER.map(rt => ({ rt, meta: RUNTIME_META[rt], lanes: lanes.filter(l => l.runtime === rt) })).filter(g => g.lanes.length > 0);
  }, [lanes]);
  const totals = useMemo(() => {
    const all = Object.values(stats);
    return { turns: all.reduce((n, s) => n + s.turns, 0), fail: all.reduce((n, s) => n + s.fail, 0) };
  }, [stats]);

  const pushEvent = (e: string) => setEvents(prev => [`${new Date().toISOString().slice(11, 19)}Z ${e}`, ...prev].slice(0, 14));

  const send = async (lane: Lane, prompt: string) => {
    const text = lane.launchOnly ? 'open' : prompt.trim();
    if (!text || busy[lane.id]) return;
    setBusy(b => ({ ...b, [lane.id]: true }));
    setError('');
    if (!lane.launchOnly) setInput('');
    const t0 = performance.now();
    try {
      const res = await fetch('/api/masa/agent-console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runtime: lane.runtime, input: text, agentId: lane.agentId, provider: lane.provider, model: lane.model }),
      });
      const data = await res.json();
      const ms = Math.round(performance.now() - t0);
      const ok = !!data.ok;
      const turn: Turn = {
        input: lane.launchOnly ? '◈ OPEN REQUEST' : text,
        reply: data.reply || data.detail || 'No response.',
        model: data.model,
        ok,
        ms,
        ts: Date.now() + Math.random(),
      };
      setThreads(prev => ({ ...prev, [lane.id]: [...(prev[lane.id] || []), turn].slice(-30) }));
      setStats(prev => {
        const s = prev[lane.id] || emptyStats();
        return { ...prev, [lane.id]: { turns: s.turns + 1, ok: s.ok + (ok ? 1 : 0), fail: s.fail + (ok ? 0 : 1), totalMs: s.totalMs + ms, lastMs: ms } };
      });
      pushEvent(`${lane.label} ${ok ? 'OK' : 'FAIL'} ${ms}ms`);
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      const turn: Turn = { input: text, reply: err instanceof Error ? err.message : 'Request failed.', ok: false, ms, ts: Date.now() + Math.random() };
      setThreads(prev => ({ ...prev, [lane.id]: [...(prev[lane.id] || []), turn].slice(-30) }));
      setStats(prev => {
        const s = prev[lane.id] || emptyStats();
        return { ...prev, [lane.id]: { turns: s.turns + 1, ok: s.ok, fail: s.fail + 1, totalMs: s.totalMs + ms, lastMs: ms } };
      });
      pushEvent(`${lane.label} FAIL ${ms}ms`);
    } finally {
      setBusy(b => ({ ...b, [lane.id]: false }));
    }
  };

  if (!config || !active) {
    return (
      <section className="overflow-hidden rounded-sm border border-white/10 bg-[#05060a]">
        <ViceSky />
        <div className="p-3 text-[10px] font-mono tracking-[0.2em] text-[#ff2d78]">{error || 'BOOTING VICE DESK…'}</div>
      </section>
    );
  }

  const neon = RUNTIME_META[active.runtime].neon;
  const thread = threads[active.id] || [];
  const st = stats[active.id] || emptyStats();
  const ticker = events.join('  ///  ');

  return (
    <section className="relative overflow-hidden rounded-sm border border-white/10 bg-[#05060a] font-mono">
      <style>{`@keyframes vice-tick{from{transform:translateX(0)}to{transform:translateX(-50%)}}.vice-tick{display:inline-block;white-space:nowrap;animation:vice-tick 40s linear infinite}.vice-scan{background:repeating-linear-gradient(0deg,rgba(255,255,255,0.028) 0 1px,transparent 1px 3px)}@media (prefers-reduced-motion:reduce){.vice-tick{animation:none}}`}</style>
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg,#ff2d78,#ffd24a 45%,#00e5cc)' }} />
      <ViceSky />

      <div className="flex items-end justify-between gap-2 px-2 pt-1.5">
        <div>
          <div className="text-[15px] font-bold leading-none tracking-[0.28em] text-[#f2f2f2]" style={{ textShadow: '0 0 12px rgba(255,45,120,0.8),0 0 2px #ff2d78' }}>VICE DESK</div>
          <div className="mt-1 text-[8px] tracking-[0.22em] text-[#00e5cc]">{lanes.length} LANES · {totals.turns} TURNS{totals.fail > 0 && <span className="text-[#ff3b3b]"> · {totals.fail} FAIL</span>}</div>
        </div>
        <div className="text-right text-[10px] tabular-nums tracking-[0.14em] text-[#ffd24a]">ZULU {clock}Z</div>
      </div>

      <div className="mt-1 overflow-hidden border-y border-white/10 bg-black/60 px-2 py-1 text-[8px] tracking-[0.12em] text-[#ff9f1c]">
        <span className="vice-tick">{ticker}  ///  {ticker}</span>
      </div>

      <div className="space-y-1.5 px-2 py-2">
        {groups.map(g => (
          <div key={g.rt}>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5" style={{ background: g.meta.neon, boxShadow: `0 0 6px ${g.meta.neon}` }} />
              <span className="text-[8px] tracking-[0.3em]" style={{ color: g.meta.neon }}>{g.meta.tag}</span>
              <span className="text-[8px] text-white/25">{g.lanes.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {g.lanes.map(lane => {
                const on = lane.id === active.id;
                const s = stats[lane.id];
                const dot = busy[lane.id] ? lane && RUNTIME_META[lane.runtime].neon : s ? (s.fail > s.ok ? '#ff3b3b' : '#53e38b') : 'rgba(255,255,255,0.2)';
                return (
                  <button
                    key={lane.id}
                    type="button"
                    onClick={() => setActiveId(lane.id)}
                    className="flex min-w-0 items-center gap-1.5 rounded-sm border px-1.5 py-1 text-left text-[8px] tracking-[0.06em]"
                    style={on
                      ? { borderColor: `${RUNTIME_META[lane.runtime].neon}88`, background: `${RUNTIME_META[lane.runtime].neon}14`, color: RUNTIME_META[lane.runtime].neon }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${busy[lane.id] ? 'animate-pulse' : ''}`} style={{ background: dot, boxShadow: `0 0 5px ${dot}` }} />
                    <span className="truncate">{lane.label}</span>
                    {s && s.turns > 0 && <span className="shrink-0 opacity-60">{s.turns}×{s.lastMs}ms</span>}
                    {lane.launchOnly && <span className="shrink-0 opacity-60">◈</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-2 mb-2 rounded-sm border bg-black/50 p-2" style={{ borderColor: `${neon}55` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[11px] font-bold tracking-[0.12em]" style={{ color: neon }}>{active.label}</div>
            <div className="text-[8px] tracking-[0.14em] text-white/35">
              {st.turns} TURNS · {st.ok} OK · {st.fail > 0 ? <span className="text-[#ff3b3b]">{st.fail} FAIL</span> : '0 FAIL'} · AVG {st.turns ? Math.round(st.totalMs / st.turns) : 0}MS
            </div>
          </div>
          {busy[active.id] && <div className="shrink-0 animate-pulse text-[9px] tracking-[0.2em]" style={{ color: neon }}>LIVE…</div>}
        </div>

        <div className="styled-scrollbar mt-2 max-h-64 space-y-1.5 overflow-y-auto pr-0.5">
          {thread.length === 0 && <div className="text-[9px] text-white/30">Private line open. Nothing said yet.</div>}
          {thread.slice().reverse().map(t => (
            <article key={t.ts} className={`rounded-sm border p-1.5 text-[9px] ${t.ok ? 'border-white/10 bg-white/[0.03]' : 'border-[#ff3b3b]/40 bg-[#ff3b3b]/5'}`}>
              <div className="truncate text-[8px] tracking-[0.08em] text-[#ffd24a]/80">◈ {t.input}</div>
              <div className="mt-1 whitespace-pre-wrap leading-snug text-white/85">{t.reply}</div>
              <div className="mt-1 text-[7px] uppercase tracking-[0.14em] text-white/30">{t.model || ''}{t.model ? ' · ' : ''}{t.ms}ms{t.ok ? '' : ' · FAIL'}</div>
            </article>
          ))}
        </div>

        {active.launchOnly ? (
          <button
            type="button"
            disabled={!!busy[active.id]}
            onClick={() => send(active, 'open')}
            className="mt-2 w-full rounded-sm border px-2 py-2 text-[10px] font-bold tracking-[0.24em] disabled:opacity-40"
            style={{ borderColor: `${neon}88`, background: `${neon}14`, color: neon }}
          >
            {busy[active.id] ? 'OPENING…' : '◈ OPEN T3 DESKTOP'}
          </button>
        ) : (
          <div className="mt-2 flex gap-1">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(active, input); }}
              placeholder={`TALK TO ${active.label}…`}
              className="min-w-0 flex-1 rounded-sm border border-white/10 bg-black/70 px-2 py-2 text-[10px]"
              style={{ color: '#fff' }}
            />
            <button
              type="button"
              disabled={!!busy[active.id] || !input.trim()}
              onClick={() => send(active, input)}
              className="shrink-0 rounded-sm border px-2.5 text-[10px] font-bold tracking-[0.2em] disabled:opacity-40"
              style={{ borderColor: `${neon}88`, background: `${neon}14`, color: neon }}
            >
              {busy[active.id] ? '…' : 'SEND'}
            </button>
          </div>
        )}
        {error && <div className="mt-1 text-[9px] text-[#ff3b3b]">{error}</div>}
      </div>
      <div className="vice-scan pointer-events-none absolute inset-0" />
    </section>
  );
}
