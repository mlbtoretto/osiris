'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { StudioEngine as Engine, MAX_TRACKS, type InputSettings, type Lane, type TrackState } from '@/lib/studio-engine';
import { formatTime, gainToDb, stepSeconds } from '@/lib/studio-dsp';
import { GENRES, KEYS, produce, tapTempo, type Genre } from '@/lib/studio-producer';
import type { VoiceKind } from '@/lib/studio-voices';

const LS = 'masa-studio-devices';
const btn = 'rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[9px] tracking-[0.14em]';
const btnOn = 'border-[var(--gold-primary)]/60 bg-[var(--gold-primary)]/15 text-[var(--gold-light)]';
const PADS: Array<{ kind: VoiceKind; label: string; note?: number }> = [
  { kind: 'kick', label: 'KICK' }, { kind: 'snare', label: 'SNARE' }, { kind: 'clap', label: 'CLAP' }, { kind: 'hat', label: 'HAT' },
  { kind: 'openhat', label: 'OPEN' }, { kind: 'tom', label: 'TOM' }, { kind: 'bass', label: 'BASS', note: 36 }, { kind: 'lead', label: 'LEAD', note: 72 },
];

type Devices = { inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] };

const readLS = (): Partial<{ input: string; output: string }> => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } };
const writeLS = (v: object) => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch { /* private mode */ } };

export default function StudioEngine({ title }: { title?: string }) {
  const [eng, setEng] = useState<Engine | null>(null);
  const [, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pos, setPos] = useState(0);
  const [meter, setMeter] = useState({ master: 0, input: 0 });
  // wizard
  const [step, setStep] = useState(0);
  const [devices, setDevices] = useState<Devices>({ inputs: [], outputs: [] });
  const [inputId, setInputId] = useState('default');
  const [outputId, setOutputId] = useState('default');
  const [channels, setChannels] = useState<1 | 2>(1);
  const [monitor, setMonitor] = useState(false);
  const [outputNote, setOutputNote] = useState('');
  const [wizardOpen, setWizardOpen] = useState(true);
  // producer
  const [genre, setGenre] = useState<Genre>('trap');
  const [key, setKey] = useState('auto');
  const [aiPrompt, setAiPrompt] = useState('');
  const [busy, setBusy] = useState('');
  const [taps, setTaps] = useState<number[]>([]);
  const [countIn, setCountIn] = useState(4);
  const [openMixer, setOpenMixer] = useState<string | null>(null);

  const rerender = useCallback(() => setTick(t => t + 1), []);
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  // Boot on a user tap: browsers only allow audio after a gesture.
  const powerOn = async () => {
    try {
      const e = new Engine();
      await e.resume();
      e.subscribe(rerender);
      setEng(e);
      const saved = readLS();
      if (saved.input) setInputId(saved.input);
      if (saved.output) setOutputId(saved.output);
      setReady(true);
    } catch (err) { fail(err); }
  };

  useEffect(() => () => { eng?.dispose(); }, [eng]);

  // Animation loop: playhead and meters only while the studio is live.
  useEffect(() => {
    if (!ready || !eng) return;
    let raf = 0; let last = 0;
    const loop = (t: number) => {
      if (t - last > 33) { last = t; setPos(eng.position); setMeter({ master: eng.masterLevel().peak, input: eng.inputLevel().peak }); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, eng]);

  const refreshDevices = async () => {
    if (!eng) return;
    try { setDevices(await eng.listDevices()); } catch (err) { fail(err); }
  };

  const grantAccess = async () => {
    if (!eng) return;
    setError('');
    try {
      // Labels are hidden until a permission grant, so open the default mic once, list, then release.
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach(t => t.stop());
      await refreshDevices();
      setStep(1);
    } catch (err) { fail(err); }
  };

  const openSelectedInput = async () => {
    if (!eng) return;
    setError('');
    try {
      const s: InputSettings = { deviceId: inputId, channelCount: channels, monitor };
      await eng.openInput(s);
      writeLS({ input: inputId, output: outputId });
      await refreshDevices();
      setStep(2);
    } catch (err) { fail(err); }
  };

  const chooseOutput = async () => {
    if (!eng) return;
    const ok = await eng.setOutputDevice(outputId);
    setOutputNote(outputId === 'default' ? 'Using the system output.' : ok ? 'Routed to the selected output for this page only.' : "This browser can't pick an output; it plays through the system output.");
    writeLS({ input: inputId, output: outputId });
    setStep(3);
  };

  const guard = <A extends unknown[]>(fn: (...a: A) => Promise<void> | void) => async (...a: A) => { setError(''); try { await fn(...a); } catch (err) { fail(err); } };

  const runProduce = guard(() => {
    if (!eng) return;
    const p = produce({ genre, key: key === 'auto' ? undefined : key });
    eng.setBpm(p.bpm); eng.setPattern(p.pattern);
    if (!eng.playing) void eng.play(0);
  });

  const runAi = guard(async () => {
    if (!eng || !aiPrompt.trim()) return;
    setBusy('ai');
    try {
      const res = await fetch('/api/studio/produce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aiPrompt }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'AI producer failed');
      eng.setBpm(d.bpm); eng.setPattern({ ...d.pattern, swing: d.swing });
      if (!eng.playing) void eng.play(0);
    } finally { setBusy(''); }
  });

  const runBounce = guard(async () => {
    if (!eng) return;
    setBusy('bounce');
    try {
      const blob = await eng.bounce();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(title || 'masa-mix').replace(/[^\w-]+/g, '_')}.wav`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } finally { setBusy(''); }
  });

  const onTapTempo = () => {
    if (!eng) return;
    const now = performance.now();
    const next = [...(now - (taps[taps.length - 1] ?? 0) > 2000 ? [] : taps), now];
    setTaps(next);
    const bpm = tapTempo(next);
    if (bpm) eng.setBpm(bpm);
  };

  if (!ready || !eng) {
    return (
      <div className="rounded border border-[var(--gold-primary)]/30 bg-black/40 p-3 space-y-2">
        <div className="text-[var(--gold-light)] tracking-[0.18em] text-[10px]">PRODUCER ENGINE</div>
        <div className="text-[9px] text-[var(--text-muted)]">Multitrack recorder, step sequencer, tap-in pads, auto-producer and mixer. Everything runs in this page; nothing on the system is changed.</div>
        <button type="button" onClick={powerOn} className={`${btn} ${btnOn} w-full py-2`}>POWER ON STUDIO</button>
        {error && <div className="text-[9px] text-red-300">{error}</div>}
      </div>
    );
  }

  const tracks = eng.getTracks();
  const pat = eng.pattern;
  const sec = stepSeconds(eng.bpm);
  const playStep = eng.playing ? Math.floor(pos / sec) % pat.steps : -1;
  const timelineLen = Math.max(8, eng.length + 1);

  return (
    <div className="space-y-3">
      {error && <div className="rounded border border-red-400/40 bg-red-500/10 p-2 text-[9px] text-red-200">{error}</div>}

      {/* SETUP WIZARD */}
      <div className="rounded border border-white/10 bg-black/40 p-2">
        <button type="button" onClick={() => setWizardOpen(o => !o)} className="flex w-full items-center justify-between text-[9px] tracking-[0.16em] text-[var(--cyan-primary)]">
          <span>AUDIO SETUP · STEP {Math.min(step + 1, 4)} OF 4{eng.inputOpen ? ` · IN: ${eng.inputLabel || 'ready'}` : ''}</span><span>{wizardOpen ? '−' : '+'}</span>
        </button>
        {wizardOpen && (
          <div className="mt-2 space-y-2 text-[9px] text-[var(--text-secondary)]">
            {step === 0 && (<>
              <div>1 · ACCESS. Your browser asks once to use the microphone and lists your audio devices. MASA only uses them inside this page; it never changes system audio settings.</div>
              <div className="flex gap-2"><button type="button" onClick={grantAccess} className={`${btn} ${btnOn} flex-1`}>GRANT ACCESS</button><button type="button" onClick={() => { setStep(3); setWizardOpen(false); }} className={btn}>SKIP (PADS ONLY)</button></div>
            </>)}
            {step === 1 && (<>
              <div>2 · INPUT. Pick the mic or interface. Echo cancel, noise suppression and auto-gain are switched off so takes stay clean.</div>
              <select value={inputId} onChange={e => setInputId(e.target.value)} className="w-full rounded border border-white/10 bg-black/50 px-2 py-2 text-[10px]">
                <option value="default">System default input</option>
                {devices.inputs.filter(d => d.deviceId !== 'default').map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Input ${d.deviceId.slice(0, 6)}`}</option>)}
              </select>
              <div className="flex gap-2">
                {([1, 2] as const).map(c => <button key={c} type="button" onClick={() => setChannels(c)} className={`${btn} flex-1 ${channels === c ? btnOn : ''}`}>{c === 1 ? 'MONO' : 'STEREO'}</button>)}
                <button type="button" onClick={refreshDevices} className={btn}>RESCAN</button>
              </div>
              <button type="button" onClick={openSelectedInput} className={`${btn} ${btnOn} w-full`}>OPEN INPUT</button>
            </>)}
            {step === 2 && (<>
              <div>3 · OUTPUT. Where you hear the mix. Not every browser can route audio to a specific device (iPhone always uses the system output).</div>
              <select value={outputId} onChange={e => setOutputId(e.target.value)} className="w-full rounded border border-white/10 bg-black/50 px-2 py-2 text-[10px]">
                <option value="default">System default output</option>
                {devices.outputs.filter(d => d.deviceId !== 'default').map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Output ${d.deviceId.slice(0, 6)}`}</option>)}
              </select>
              <button type="button" onClick={chooseOutput} className={`${btn} ${btnOn} w-full`}>USE THIS OUTPUT</button>
            </>)}
            {step >= 3 && (<>
              <div>4 · LEVEL CHECK. {outputNote} Speak or play; the bar should peak near the top without going red. Use headphones before turning monitoring on or it will feed back.</div>
              <div className="h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-gradient-to-r from-[var(--cyan-primary)] via-[var(--gold-primary)] to-red-400" style={{ width: `${Math.min(100, Math.round(meter.input * 100))}%` }} /></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { const v = !monitor; setMonitor(v); eng.setMonitor(v); }} disabled={!eng.inputOpen} className={`${btn} flex-1 ${monitor ? btnOn : ''} disabled:opacity-40`}>MONITOR {monitor ? 'ON' : 'OFF'}</button>
                <button type="button" onClick={() => eng.setLatency(eng.reportedLatencyMs())} className={`${btn} flex-1`}>AUTO LATENCY</button>
                <button type="button" onClick={() => { setStep(1); void refreshDevices(); }} className={btn}>REDO</button>
              </div>
              <Slider label="LATENCY COMPENSATION" value={eng.latencyMs} min={0} max={400} step={1} onChange={v => eng.setLatency(v)} fmt={v => `${v} ms`} />
              <button type="button" onClick={() => setWizardOpen(false)} className={`${btn} ${btnOn} w-full`}>READY</button>
            </>)}
          </div>
        )}
      </div>

      {/* TRANSPORT */}
      <div className="rounded border border-[var(--cyan-primary)]/30 bg-black/50 p-2 space-y-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={guard(() => (eng.playing ? eng.stop() : eng.play(eng.position)))} className={`${btn} flex-1 ${eng.playing && !eng.recording ? btnOn : ''}`}>{eng.playing ? 'STOP' : 'PLAY'}</button>
          <button type="button" onClick={guard(() => (eng.recording ? eng.stopRecording() : eng.startRecording(countIn)))} disabled={!eng.inputOpen} className={`${btn} flex-1 ${eng.recording ? 'border-red-400/60 bg-red-500/20 text-red-200' : ''} disabled:opacity-40`}>{eng.recording ? 'STOP REC' : '● REC'}</button>
          <div className="w-20 text-right text-[11px] tabular-nums text-[var(--cyan-primary)]">{formatTime(pos)}</div>
        </div>
        <div className="grid grid-cols-4 gap-1 items-center">
          <label className="col-span-2 flex items-center gap-1 text-[8px] text-[var(--text-muted)]">BPM
            <input type="number" min={40} max={240} value={eng.bpm} onChange={e => eng.setBpm(Number(e.target.value))} className="w-16 rounded border border-white/10 bg-black/50 px-1 py-1 text-[11px] text-white" />
          </label>
          <button type="button" onClick={onTapTempo} className={btn}>TAP TEMPO</button>
          <button type="button" onClick={() => eng.setMetronome(!eng.metronome)} className={`${btn} ${eng.metronome ? btnOn : ''}`}>CLICK</button>
          <button type="button" onClick={() => eng.setLoop(!eng.loop)} className={`${btn} ${eng.loop ? btnOn : ''}`}>LOOP</button>
          <label className="col-span-3 flex items-center gap-1 text-[8px] text-[var(--text-muted)]">COUNT-IN
            <select value={countIn} onChange={e => setCountIn(Number(e.target.value))} className="rounded border border-white/10 bg-black/50 px-1 py-1 text-[10px] text-white"><option value={0}>off</option><option value={2}>2 beats</option><option value={4}>4 beats</option></select>
          </label>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-[var(--text-muted)]">MASTER
          <div className="h-1.5 flex-1 overflow-hidden rounded bg-white/10"><div className={`h-full ${meter.master > 0.95 ? 'bg-red-400' : 'bg-[#53e38b]'}`} style={{ width: `${Math.min(100, Math.round(meter.master * 100))}%` }} /></div>
        </div>
      </div>

      {/* PRODUCER */}
      <div className="rounded border border-[var(--gold-primary)]/30 bg-[var(--gold-primary)]/5 p-2 space-y-2">
        <div className="text-[9px] tracking-[0.18em] text-[var(--gold-light)]">AUTO-PRODUCER · DOES THE BEAT FOR YOU</div>
        <div className="grid grid-cols-3 gap-1">
          <select value={genre} onChange={e => setGenre(e.target.value as Genre)} className="col-span-2 rounded border border-white/10 bg-black/50 px-2 py-2 text-[10px]">{GENRES.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}</select>
          <select value={key} onChange={e => setKey(e.target.value)} className="rounded border border-white/10 bg-black/50 px-2 py-2 text-[10px]"><option value="auto">KEY: AUTO</option>{KEYS.map(k => <option key={k} value={k}>{k}</option>)}</select>
        </div>
        <button type="button" onClick={runProduce} className={`${btn} ${btnOn} w-full py-2`}>PRODUCE FOR ME</button>
        <div className="flex gap-1">
          <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void runAi(); }} placeholder="or describe it: dark late-night drill in F minor" className="min-w-0 flex-1 rounded border border-white/10 bg-black/50 px-2 py-2 text-[10px]" />
          <button type="button" onClick={runAi} disabled={busy === 'ai' || !aiPrompt.trim()} className={`${btn} disabled:opacity-40`}>{busy === 'ai' ? '…' : 'ASK AI'}</button>
        </div>
      </div>

      {/* CHANNEL RACK */}
      <div className="rounded border border-white/10 bg-black/40 p-2 space-y-2">
        <div className="flex items-center justify-between text-[9px] tracking-[0.16em] text-[var(--cyan-primary)]">
          <span>CHANNEL RACK</span>
          <span className="flex gap-1">
            {([16, 32] as const).map(n => <button key={n} type="button" onClick={() => eng.patchPattern({ steps: n })} className={`${btn} ${pat.steps === n ? btnOn : ''}`}>{n}</button>)}
            <button type="button" onClick={() => eng.clearPattern()} className={btn}>CLEAR</button>
          </span>
        </div>
        <div className="overflow-x-auto styled-scrollbar">
          <div className="min-w-max space-y-1">
            {pat.lanes.map((l: Lane) => (
              <div key={l.id} className="flex items-center gap-1">
                <button type="button" onClick={() => eng.updateLane(l.id, { mute: !l.mute })} className={`w-12 shrink-0 rounded border px-1 py-1 text-left text-[8px] ${l.mute ? 'border-white/10 text-white/30' : 'border-white/20 text-[var(--text-secondary)]'}`}>{l.name.toUpperCase()}</button>
                <div className="flex gap-[2px]">
                  {Array.from({ length: pat.steps }, (_, i) => {
                    const on = l.cells[i] !== null;
                    return (
                      <button key={i} type="button" aria-label={`${l.name} step ${i + 1}`} onClick={() => eng.toggleCell(l.id, i)}
                        className={`h-6 w-4 rounded-[2px] border ${i % 4 === 0 ? 'border-white/30' : 'border-white/10'} ${on ? (l.kind === 'bass' ? 'bg-[#4de1ff]' : l.kind === 'lead' ? 'bg-[#b18cff]' : 'bg-[var(--gold-primary)]') : 'bg-black/40'} ${playStep === i ? 'ring-1 ring-white' : ''}`} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2"><Slider label="SWING" value={pat.swing} min={0} max={1} step={0.05} onChange={v => eng.patchPattern({ swing: v })} fmt={v => `${Math.round(v * 100)}%`} /><Slider label="PATTERN LEVEL" value={pat.gainDb} min={-24} max={6} step={1} onChange={v => eng.patchPattern({ gainDb: v })} fmt={v => `${v} dB`} /></div>
        <div className="text-[8px] text-[var(--text-muted)]">TAP-IN: hit a pad while playing and it quantises into the rack.</div>
        <div className="grid grid-cols-4 gap-1">
          {PADS.map(p => (
            <button key={p.kind} type="button" onPointerDown={e => { e.preventDefault(); eng.tap(p.kind, p.note); }} className="h-12 touch-none select-none rounded border border-white/15 bg-white/5 text-[9px] tracking-[0.12em] active:bg-[var(--gold-primary)]/30">{p.label}</button>
          ))}
        </div>
      </div>

      {/* TRACKS + MIXER */}
      <div className="rounded border border-white/10 bg-black/40 p-2 space-y-2">
        <div className="flex items-center justify-between text-[9px] tracking-[0.16em] text-[var(--cyan-primary)]"><span>TRACKS · MIXER</span>
          <button type="button" onClick={() => eng.addTrack()} disabled={tracks.length >= MAX_TRACKS} className={`${btn} disabled:opacity-40`}>+ TRACK</button></div>
        {tracks.map((t: TrackState) => (
          <div key={t.id} className="rounded border border-white/10 p-1.5 space-y-1">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.color }} />
              <input value={t.name} onChange={e => eng.update(t.id, { name: e.target.value.slice(0, 24) })} className="min-w-0 flex-1 bg-transparent text-[10px] outline-none" />
              <button type="button" onClick={() => eng.update(t.id, { armed: true })} className={`${btn} ${t.armed ? 'border-red-400/60 bg-red-500/20 text-red-200' : ''}`}>ARM</button>
              <button type="button" onClick={() => eng.update(t.id, { mute: !t.mute })} className={`${btn} ${t.mute ? btnOn : ''}`}>M</button>
              <button type="button" onClick={() => eng.update(t.id, { solo: !t.solo })} className={`${btn} ${t.solo ? btnOn : ''}`}>S</button>
              <button type="button" onClick={() => setOpenMixer(openMixer === t.id ? null : t.id)} className={btn}>MIX</button>
            </div>
            <Wave track={t} total={timelineLen} pos={pos} onSeek={s => eng.seek(s)} />
            {openMixer === t.id && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                <Slider label="VOLUME" value={t.gainDb} min={-40} max={6} step={0.5} onChange={v => eng.update(t.id, { gainDb: v })} fmt={v => `${v} dB`} />
                <Slider label="PAN" value={t.pan} min={-1} max={1} step={0.05} onChange={v => eng.update(t.id, { pan: v })} fmt={v => (v === 0 ? 'C' : v < 0 ? `L${Math.round(-v * 100)}` : `R${Math.round(v * 100)}`)} />
                <Slider label="LOW" value={t.eqLow} min={-12} max={12} step={0.5} onChange={v => eng.update(t.id, { eqLow: v })} fmt={v => `${v} dB`} />
                <Slider label="MID" value={t.eqMid} min={-12} max={12} step={0.5} onChange={v => eng.update(t.id, { eqMid: v })} fmt={v => `${v} dB`} />
                <Slider label="HIGH" value={t.eqHigh} min={-12} max={12} step={0.5} onChange={v => eng.update(t.id, { eqHigh: v })} fmt={v => `${v} dB`} />
                <Slider label="REVERB" value={t.reverb} min={0} max={1} step={0.05} onChange={v => eng.update(t.id, { reverb: v })} fmt={v => `${Math.round(v * 100)}%`} />
                <label className={`${btn} text-center`}>IMPORT AUDIO<input type="file" accept="audio/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void guard(() => eng.importFile(t.id, f))(); e.target.value = ''; }} /></label>
                <div className="flex gap-1"><button type="button" onClick={() => eng.clearTrack(t.id)} className={`${btn} flex-1`}>CLEAR</button><button type="button" onClick={() => eng.removeTrack(t.id)} disabled={tracks.length <= 1} className={`${btn} flex-1 disabled:opacity-40`}>DELETE</button></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={runBounce} disabled={busy === 'bounce'} className={`${btn} ${btnOn} w-full py-2 disabled:opacity-40`}>{busy === 'bounce' ? 'RENDERING…' : 'EXPORT MIX AS WAV'}</button>
      <div className="text-[8px] text-[var(--text-muted)]">Master runs {Math.round(gainToDb(0.6))} dB of headroom into a limiter. Session lives in this tab; export to keep it.</div>
    </div>
  );
}

function Wave({ track, total, pos, onSeek }: { track: TrackState; total: number; pos: number; onSeek: (s: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth; const h = c.clientHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d'); if (!g) return;
    g.scale(dpr, dpr); g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(0, 0, w, h);
    if (track.peaks) {
      const n = track.peaks.length / 2;
      const x0 = (track.offset / total) * w; const cw = (track.duration / total) * w;
      g.fillStyle = track.color;
      for (let i = 0; i < n; i++) {
        const x = x0 + (i / n) * cw; const lo = track.peaks[i * 2]; const hi = track.peaks[i * 2 + 1];
        g.fillRect(x, h / 2 - hi * h / 2, Math.max(1, cw / n), Math.max(1, (hi - lo) * h / 2));
      }
    }
    g.fillStyle = '#fff'; g.fillRect((pos / total) * w, 0, 1, h);
  }, [track, total, pos]);
  return <canvas ref={ref} className="h-10 w-full cursor-pointer rounded" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); onSeek(((e.clientX - r.left) / r.width) * total); }} />;
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="flex flex-col gap-0.5 text-[8px] text-[var(--text-muted)]">
      <span className="flex justify-between"><span>{label}</span><span className="tabular-nums">{fmt ? fmt(value) : value}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-[var(--gold-primary)]" />
    </label>
  );
}
