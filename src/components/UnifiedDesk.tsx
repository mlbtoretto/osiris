'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Camera, Radio, Network, NotebookPen, Cpu, AppWindow, Heart } from 'lucide-react';
import { LIFE_LAYERS } from '@/lib/digital-life';
import { REACH } from '@/lib/reach';
import { INSCRIPTION } from '@/lib/inscription';
import { COMPANIES, SWARM_SIZE } from '@/lib/swarm';
import { buildCorrelationGraph, UNIFIED_TOOLS, type GraphLink, type GraphNode } from '@/lib/correlation';
import { TEAM_FREE } from '@/lib/free-models';
import { ARMY_MAX_TOKENS } from '@/lib/agent-army';
import { INTERNET_LAYERS, ROBIN_ENGINES, type SurfaceTool } from '@/lib/internet-surface';
import { FORENSIC_AGENTS, type ForensicNote } from '@/lib/forensic-notes';
import { enrollFromSpeech, type Scene } from '@/lib/vision-scene';
import { speakAsWoman } from '@/lib/woman-voice';
import type { PlanetId } from '@/lib/planets';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

type Tab = 'graph' | 'notes' | 'voice' | 'tools' | 'chrome' | 'life' | 'traces';
type Usage = { prompt: number; completion: number; total: number; model: string };
type Recog = {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const SpeechRec = typeof window === 'undefined'
  ? undefined
  : ((window as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: new () => Recog }).webkitSpeechRecognition);

export default function UnifiedDesk({ planet }: { planet: PlanetId }) {
  const [tab, setTab] = useState<Tab>('graph');
  const [notes, setNotes] = useState<ForensicNote[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [agent, setAgent] = useState('osiris');
  const [listening, setListening] = useState(false);
  const [seeing, setSeeing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [scene, setScene] = useState<Scene | null>(null);
  const [live, setLive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const seeingRef = useRef(false);
  const liveRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const [usage, setUsage] = useState<Usage>({ prompt: 0, completion: 0, total: 0, model: '—' });
  const [sessionTokens, setSessionTokens] = useState({ prompt: 0, completion: 0, total: 0 });
  const [busy, setBusy] = useState(false);
  const [tools, setTools] = useState<Array<SurfaceTool & { present?: boolean; path?: string }>>([]);
  const [chrome, setChrome] = useState<{ attached?: boolean; tabs?: Array<{ title?: string; url?: string }>; hint?: string } | null>(null);
  const [chromeUrl, setChromeUrl] = useState('https://osirisai.live');
  const [hiddenQ, setHiddenQ] = useState('');
  const [hidden, setHidden] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<Recog | null>(null);

  const graph = buildCorrelationGraph(notes);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const warm = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', warm);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', warm);
  }, []);

  useEffect(() => {
    fetch('/api/forensics/notes').then(r => r.json()).then(d => setNotes(d.notes || [])).catch(() => {});
    fetch('/api/forensics/tools').then(r => r.json()).then(d => setTools(d.tools || UNIFIED_TOOLS)).catch(() => setTools([...UNIFIED_TOOLS]));
  }, []);

  const saveNote = async () => {
    if (!title.trim() || !body.trim()) return;
    const res = await fetch('/api/forensics/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, agent, planet }),
    });
    if (!res.ok) return;
    const d = await res.json();
    setNotes(n => [d.note, ...n]);
    setTitle('');
    setBody('');
  };

  const stopVision = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    seeingRef.current = false;
    setSeeing(false);
    cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setAudioLevel(0);
  };

  const startVision = async (facing: 'user' | 'environment' = 'user') => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      await videoRef.current.play().catch(() => {});
    }
    seeingRef.current = true;
    setSeeing(true);
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      setAudioLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return '';
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const converse = useCallback(async (text: string) => {
    const taught = enrollFromSpeech(text);
    if (taught) {
      await fetch('/api/vision/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taught, note: text }),
      });
    }
    setBusy(true);
    try {
      const res = await fetch('/api/ai/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image: seeingRef.current ? captureFrame() : undefined, agent, planet }),
      });
      const d = await res.json();
      if (d.scene) setScene(d.scene);
      if (d.reply) {
        setReply(d.reply);
        speakAsWoman(d.reply);
      }
      if (d.usage) {
        setUsage(d.usage);
        setSessionTokens(s => ({
          prompt: s.prompt + (d.usage.prompt || 0),
          completion: s.completion + (d.usage.completion || 0),
          total: s.total + (d.usage.total || 0),
        }));
      }
    } finally {
      setBusy(false);
    }
  }, [agent, planet]);

  const toggleListen = () => {
    if (!SpeechRec) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = ev => {
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const chunk = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) final += chunk;
        else setTranscript(chunk);
      }
      if (final.trim()) {
        setTranscript(final.trim());
        converse(final.trim());
      }
    };
    rec.onend = () => {
      setListening(false);
      if (liveRef.current && SpeechRec) {
        try { rec.start(); setListening(true); } catch { /* browser lock */ }
      }
    };
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  useEffect(() => {
    if (!live || !seeing) return;
    const iv = setInterval(() => {
      if (!busy) converse('what do you see');
    }, 10000);
    return () => clearInterval(iv);
  }, [live, seeing, busy, converse]);

  useEffect(() => () => {
    recRef.current?.stop();
    stopVision();
    window.speechSynthesis?.cancel();
  }, []);

  const onExif = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/forensics/exif', { method: 'POST', body: fd });
    const d = await res.json();
    setBody(JSON.stringify(d.meta || d, null, 2).slice(0, 4000));
    setTitle(`EXIF ${file.name}`);
    setTab('notes');
  };

  return (
    <div className="w-[min(92vw,400px)] max-h-[min(78vh,620px)] overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-panel)]/92 backdrop-blur-xl flex flex-col">
      <div className="px-3 pt-2.5 pb-2 border-b border-white/5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[8px] tracking-[0.32em] text-[var(--gold-primary)]">{INSCRIPTION.unit}</div>
            <div className="text-[11px] font-mono tracking-[0.12em] text-[var(--text-heading)]">{INSCRIPTION.callsign} · {SWARM_SIZE} · 1V/1S</div>
          </div>
          <TokenMeter usage={usage} session={sessionTokens} />
        </div>
        <div className="mt-2 flex gap-0.5">
          {([['graph', Network], ['notes', NotebookPen], ['voice', Mic], ['tools', Cpu], ['chrome', AppWindow], ['life', Heart], ['traces', Radio]] as const).map(([id, Icon]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`flex-1 py-1.5 text-[7px] tracking-[0.14em] border-b-2 ${tab === id ? 'text-[var(--gold-light)] border-[var(--gold-primary)]' : 'text-[var(--text-muted)] border-transparent'}`}>
              <Icon className="w-3 h-3 mx-auto mb-0.5" />
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto styled-scrollbar p-3 min-h-[280px]">
        {tab === 'graph' && (
          <div className="h-[300px] rounded-lg overflow-hidden bg-black/40">
            <ForceGraph2D
              graphData={{ nodes: graph.nodes, links: graph.links as GraphLink[] }}
              backgroundColor="rgba(0,0,0,0)"
              nodeLabel="name"
              nodeColor="color"
              nodeRelSize={4}
              linkColor={() => 'rgba(212,175,55,0.25)'}
              cooldownTicks={80}
            />
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-2">
            <select value={agent} onChange={e => setAgent(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono">
              {FORENSIC_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="corp-iraq">corp-iraq</option>
            </select>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="NOTE TITLE" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] font-mono" />
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="RAW FORENSIC BODY" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] font-mono" />
            <button type="button" onClick={saveNote} className="w-full py-1.5 rounded bg-[var(--gold-primary)]/20 text-[var(--gold-light)] text-[10px] tracking-[0.2em]">HARDWIRE NOTE</button>
            {notes.slice(0, 12).map(n => (
              <div key={n.id} className="rounded border border-white/10 p-2">
                <div className="text-[10px] text-[var(--gold-light)]">{n.title}</div>
                <div className="text-[8px] text-[var(--text-muted)]">{n.agent} · {n.planet} · {n.ts.slice(0, 16)}</div>
                <div className="mt-1 text-[10px] whitespace-pre-wrap text-[var(--text-secondary)]">{n.body.slice(0, 280)}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'voice' && (
          <div className="space-y-3">
            <video ref={videoRef} autoPlay muted playsInline className={`w-full rounded-lg bg-black ${seeing ? 'block' : 'hidden'}`} />
            <div className="h-1 rounded bg-white/10 overflow-hidden">
              <div className="h-full bg-[var(--cyan-primary)] transition-[width] duration-75" style={{ width: `${Math.round(audioLevel * 100)}%` }} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={async () => {
                const next = !live;
                liveRef.current = next;
                setLive(next);
                if (next) {
                  if (!seeingRef.current) await startVision('user');
                  if (!listening) toggleListen();
                } else {
                  recRef.current?.stop();
                  setListening(false);
                }
              }} className={`flex-1 py-2 rounded-lg text-[10px] tracking-[0.16em] ${live ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
                {live || listening ? 'LIVE TALK' : 'START TALK'}
              </button>
              <button type="button" onClick={() => seeing ? stopVision() : startVision('user')} className={`flex-1 py-2 rounded-lg text-[10px] tracking-[0.16em] ${seeing ? 'bg-cyan-500/20 text-cyan-200' : 'bg-white/5 text-[var(--text-secondary)]'}`}>
                <Camera className="w-3 h-3 inline mr-1" />{seeing ? 'CAM OFF' : 'FACE CAM'}
              </button>
              <button type="button" onClick={() => startVision('environment')} className="px-2 rounded-lg bg-white/5 text-[9px] tracking-[0.12em] text-[var(--text-muted)]">WORLD</button>
            </div>
            <button type="button" disabled={busy} onClick={() => converse(transcript || 'what do you see')} className="w-full py-2 rounded-lg bg-[var(--cyan-primary)]/15 text-[var(--cyan-primary)] text-[10px] tracking-[0.18em] disabled:opacity-40">
              {busy ? 'SEEING…' : 'CHAT / IDENTIFY'}
            </button>
            <div className="text-[9px] text-[var(--text-muted)]">Say “this is …” to teach a person or object. Names only from your enrollments.</div>
            <div className="text-[10px] text-[var(--text-muted)]">HEARD</div>
            <div className="text-[12px] font-mono text-[var(--text-heading)] min-h-[2.5rem]">{transcript || '—'}</div>
            <div className="text-[10px] text-[var(--text-muted)]">HORUS-1</div>
            <div className="text-[12px] font-mono text-[var(--gold-light)] whitespace-pre-wrap">{reply || '—'}</div>
            {scene && (
              <div className="flex flex-wrap gap-1">
                {scene.objects.map(o => <span key={o} className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] tracking-[0.12em]">{o}</span>)}
                {scene.persons.map(p => <span key={p.label} className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[9px] tracking-[0.12em] text-cyan-200">{p.label} {p.confidence}</span>)}
              </div>
            )}
          </div>
        )}

        {tab === 'tools' && (
          <div className="space-y-3">
            {INTERNET_LAYERS.map(layer => {
              const rack = tools.filter(t => t.layer === layer.id);
              if (!rack.length) return null;
              return (
                <div key={layer.id}>
                  <div className="text-[8px] tracking-[0.22em] text-[var(--gold-primary)]">{layer.name}</div>
                  <div className="text-[8px] text-[var(--text-muted)] mb-1">{layer.holds}</div>
                  {rack.map(tool => (
                    <a key={tool.id} href={tool.href.startsWith('http') ? tool.href : undefined} target={tool.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block rounded-lg border border-white/10 p-2 mb-1 hover:bg-white/5">
                      <div className="flex justify-between text-[11px] font-mono gap-2">
                        <span className="text-[var(--gold-light)]">{tool.name}</span>
                        <span className="text-[8px] tracking-[0.12em] text-[var(--text-muted)]">{tool.use.toUpperCase()}{tool.present ? ' · LOCAL' : ''}</span>
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)]">{tool.desk}</div>
                    </a>
                  ))}
                  {layer.id === 'dark' && (
                    <div className="text-[8px] tracking-[0.08em] text-[var(--text-secondary)] leading-relaxed">
                      ROBIN ENGINES: {ROBIN_ENGINES.join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex gap-1">
              <input value={hiddenQ} onChange={e => setHiddenQ(e.target.value)} placeholder="host they took down" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono" />
              <button type="button" className="px-2 text-[9px] tracking-[0.12em] text-[var(--cyan-primary)]" onClick={async () => {
                const r = await fetch(`/api/osint/hidden?q=${encodeURIComponent(hiddenQ)}`);
                setHidden(JSON.stringify(await r.json(), null, 2).slice(0, 4000));
              }}>UNHIDE</button>
            </div>
            {hidden && <pre className="text-[8px] text-[var(--text-muted)] whitespace-pre-wrap max-h-40 overflow-y-auto">{hidden}</pre>}
            <label className="block rounded-lg border border-dashed border-white/15 p-3 text-center text-[10px] tracking-[0.16em] text-[var(--text-muted)] cursor-pointer">
              DROP IMAGE → EXIFTOOL
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onExif(f); }} />
            </label>
          </div>
        )}

        {tab === 'chrome' && (
          <div className="space-y-2">
            <div className="text-[10px] text-[var(--text-secondary)]">Local Chromium DevTools Protocol · 127.0.0.1:9222 · full domains on this box only.</div>
            <button type="button" className="w-full py-2 rounded bg-white/10 text-[10px] tracking-[0.16em] text-[var(--gold-light)]" onClick={async () => {
              await fetch('/api/chrome/devtools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'launch' }) });
              setChrome(await (await fetch('/api/chrome/devtools')).json());
            }}>LAUNCH CHROME CDP</button>
            <div className="flex gap-1">
              <input value={chromeUrl} onChange={e => setChromeUrl(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono" />
              <button type="button" className="px-2 text-[9px] tracking-[0.12em] text-[var(--cyan-primary)]" onClick={async () => {
                await fetch('/api/chrome/devtools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'navigate', url: chromeUrl }) });
                setChrome(await (await fetch('/api/chrome/devtools')).json());
              }}>GO</button>
            </div>
            <div className="flex gap-1">
              {['screenshot', 'dom', 'network', 'console'].map(action => (
                <button key={action} type="button" className="flex-1 py-1 rounded bg-black/40 text-[8px] tracking-[0.12em] text-[var(--text-muted)]" onClick={async () => {
                  const r = await fetch('/api/chrome/devtools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
                  const d = await r.json();
                  if (d.png) setReply(d.png);
                  else setBody(JSON.stringify(d, null, 2).slice(0, 4000));
                }}>{action.toUpperCase()}</button>
              ))}
            </div>
            <pre className="text-[9px] text-[var(--text-muted)] whitespace-pre-wrap">{chrome ? JSON.stringify(chrome, null, 2).slice(0, 1800) : 'Not attached.'}</pre>
          </div>
        )}

        {tab === 'life' && (
          <div className="space-y-2 text-[10px] font-mono text-[var(--text-secondary)]">
            <div className="text-[var(--gold-light)] tracking-[0.18em]">DIGITAL LIFE · STAY · GROW · GUIDE</div>
            {LIFE_LAYERS.map(layer => (
              <div key={layer.id} className="rounded border border-white/10 p-2">
                <div className="text-[var(--gold-primary)] tracking-[0.16em]">{layer.name}</div>
                <div>{layer.tactic}</div>
              </div>
            ))}
            <div className="text-[var(--cyan-primary)] tracking-[0.18em] pt-2">REACH — WHAT YOU CAN SEE</div>
            {REACH.map(r => (
              <div key={r.id} className="rounded border border-white/10 p-2">
                <div className="text-[var(--cyan-primary)]">{r.name}</div>
                <div>{r.see}</div>
              </div>
            ))}
            <button type="button" className="w-full py-2 rounded bg-[var(--gold-primary)]/20 text-[var(--gold-light)] tracking-[0.16em]" onClick={async () => {
              await fetch('/api/life', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pattern: 'stacked raw mission', evidence: 'operator executing globe+swarm+osint as one OS' }) });
            }}>RECORD HOW I WORK</button>
          </div>
        )}

        {tab === 'traces' && (
          <div className="text-[10px] font-mono space-y-2 text-[var(--text-secondary)]">
            <p>Local traces: <span className="text-[var(--gold-light)]">data/langsmith-local.jsonl</span></p>
            <p>Remote LangSmith posts when <span className="text-[var(--gold-light)]">LANGSMITH_API_KEY</span> is set.</p>
            <p>Notes hardwired: <span className="text-[var(--gold-light)]">data/forensic-notes.json</span></p>
            <p>Recreate spec: <span className="text-[var(--gold-light)]">data/osiris-unified.json</span></p>
            <p>{SWARM_SIZE} models · 8 companies · {INSCRIPTION.voice} voice · {INSCRIPTION.vision} vision</p>
            <p>Army max tokens: <span className="text-[var(--gold-light)]">{ARMY_MAX_TOKENS.toLocaleString()}</span> · free lanes {TEAM_FREE.length}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {TEAM_FREE.map(m => <span key={m.id} className="masa-chip" title={`${m.role} · max ${m.maxTokens ?? ARMY_MAX_TOKENS}`}>{m.name}</span>)}
            </div>
            {COMPANIES.map(c => (
              <div key={c.id} className="text-[9px]">{c.id} {c.name} — {c.role}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TokenMeter({ usage, session }: { usage: Usage; session: { prompt: number; completion: number; total: number } }) {
  return (
    <div className="text-right font-mono">
      <div className="text-[8px] tracking-[0.2em] text-[var(--text-muted)]">{usage.model}</div>
      <div className="text-[11px] text-[var(--cyan-primary)] tabular-nums">{session.total.toLocaleString()} tok</div>
      <div className="text-[8px] text-[var(--text-muted)]">in {session.prompt} · out {session.completion}</div>
      {usage.total > 0 && (
        <div className="text-[8px] text-[var(--gold-dim)]">last {usage.total}</div>
      )}
    </div>
  );
}
