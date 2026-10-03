'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Camera, Radio, Network, NotebookPen, Cpu, AppWindow, Heart, Music2, Cloud, Puzzle, ShieldCheck, Terminal, Activity, Zap, Tv } from 'lucide-react';
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

import { DESK_TABS } from '@/lib/desk-tabs';
import type { DeskTabId } from '@/lib/desk-tabs';
import { embedUrl } from '@/components/LiveNewsPreviews';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
const StudioEngine = dynamic(() => import('@/components/StudioEngine'), { ssr: false });
const AgentDashboards = dynamic(() => import('@/components/AgentDashboards'), { ssr: false });
const PlatformPipeline = dynamic(() => import('@/components/PlatformPipeline'), { ssr: false });

type Tab = DeskTabId;
type MasaAgent = { id: string; name: string; role: string; interface: string; callable: boolean; status: 'available' | 'missing'; command?: string };
type Integration = { id: string; name: string; kind: 'skill' | 'plugin' | 'mcp'; source: string; description: string; status: 'pending' | 'approved' | 'disabled'; addedAt: string };
type Oversight = { id: string; title: string; objective: string; proposedAction: string; agent: string; risk: 'low' | 'medium' | 'high' | 'critical'; status: 'pending' | 'approved' | 'rejected' | 'completed'; rationale?: string; reviewer?: string; decisionNote?: string; createdAt: string; updatedAt: string };
type SocialLink = { id: string; name: string; login: string; landing: string; developer: string };
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

const DESK_TAB_ICONS = {
  graph: Network,
  notes: NotebookPen,
  voice: Mic,
  tools: Cpu,
  chrome: AppWindow,
  life: Heart,
  traces: Radio,
  studio: Music2,
  tv: Tv,
  providers: Cloud,
  integrations: Puzzle,
  oversight: ShieldCheck,
  agents: Terminal,
} as const;

export default function UnifiedDesk() {
  const [tab, setTab] = useState<Tab>('graph');
  useEffect(() => {
    const open = () => setTab('agents');
    window.addEventListener('masa:open-command-group', open);
    return () => window.removeEventListener('masa:open-command-group', open);
  }, []);
  const [notes, setNotes] = useState<ForensicNote[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [agent, setAgent] = useState('masa');
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
  const [chromeUrl, setChromeUrl] = useState('https://masaia.live');
  const [hiddenQ, setHiddenQ] = useState('');
  const [hidden, setHidden] = useState<string>('');
  const [studioTrack, setStudioTrack] = useState('');
  const [studioStatus, setStudioStatus] = useState('IDEA');
  const [tvFeeds, setTvFeeds] = useState<Array<{ id: string; name: string; city?: string; country?: string; url: string; embed_allowed?: boolean }>>([]);
  const [tvChannel, setTvChannel] = useState<string>('');
  const [providers, setProviders] = useState<Array<{ id: string; name: string; website: string; docs: string; console?: string; envKeys: string[]; models: string[]; capabilities: string[]; configured?: boolean }>>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationKind, setIntegrationKind] = useState<Integration['kind']>('mcp');
  const [integrationName, setIntegrationName] = useState('');
  const [integrationSource, setIntegrationSource] = useState('');
  const [integrationDescription, setIntegrationDescription] = useState('');
  const [integrationMessage, setIntegrationMessage] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [oversight, setOversight] = useState<Oversight[]>([]);
  const [oversightTitle, setOversightTitle] = useState('');
  const [oversightObjective, setOversightObjective] = useState('');
  const [oversightAction, setOversightAction] = useState('');
  const [oversightRisk, setOversightRisk] = useState<Oversight['risk']>('medium');
  const [oversightMessage, setOversightMessage] = useState('');
  const [agents, setAgents] = useState<MasaAgent[]>([]);
  const [dispatchAgent, setDispatchAgent] = useState('hermes');
  const [dispatchInput, setDispatchInput] = useState('');
  const [dispatchOutput, setDispatchOutput] = useState('');
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [mcpLive, setMcpLive] = useState<Array<{ name: string; transport: string; tools: string; status: string }>>([]);
  const [mcpLiveNote, setMcpLiveNote] = useState('');
  const refreshMcpLive = useCallback(() => {
    fetch('/api/masa/mcp-live').then(r => r.json()).then(d => { setMcpLive(d.servers || []); setMcpLiveNote(d.none ? 'No MCP servers configured in Hermes yet.' : ''); }).catch(() => setMcpLiveNote('Could not reach Hermes.'));
  }, []);
  useEffect(() => { if (tab === 'integrations') refreshMcpLive(); }, [tab, refreshMcpLive]);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [masaIntel, setMasaIntel] = useState<{
    masa?: { present?: boolean; map?: string };
    hermes?: { profile?: string; skillCount?: number; skills?: string[]; skillsPath?: string };
    inventory?: { total?: number; localRegistry?: number };
    foundation?: { resources?: Array<{ id: string; name: string; present: boolean; mode: string }>; inventoryEntries?: number };
  } | null>(null);
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
    fetch('/api/masa/intelligence').then(r => r.json()).then(setMasaIntel).catch(() => {});
    fetch('/api/masa/providers').then(r => r.json()).then(d => setProviders(d.providers || [])).catch(() => {});
    fetch('/api/masa/integrations').then(r => r.json()).then(d => setIntegrations(d.integrations || [])).catch(() => {});
    fetch('/api/masa/social-links').then(r => r.json()).then(d => setSocialLinks(d.links || [])).catch(() => {});
    fetch('/api/masa/oversight').then(r => r.json()).then(d => setOversight(d.requests || [])).catch(() => {});
    fetch('/api/masa/agents').then(r => r.json()).then(d => setAgents(d.agents || [])).catch(() => {});
    fetch('/api/live-news').then(r => r.json()).then(d => {
      const feeds = d.feeds || [];
      setTvFeeds(feeds);
      setTvChannel(prev => prev || feeds.find((f: any) => f.embed_allowed)?.id || feeds[0]?.id || '');
    }).catch(() => {});
  }, []);

  const dispatch = async () => {
    setDispatchBusy(true);
    setDispatchOutput('');
    try {
      const res = await fetch('/api/masa/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: dispatchAgent, input: dispatchInput }) });
      const data = await res.json();
      setDispatchOutput(data.stdout || data.stderr || data.error || JSON.stringify(data, null, 2));
    } catch (error) {
      setDispatchOutput(error instanceof Error ? error.message : 'Dispatch failed');
    } finally {
      setDispatchBusy(false);
    }
  };

  const createOversight = async () => {
    const res = await fetch('/api/masa/oversight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: oversightTitle, objective: oversightObjective, proposedAction: oversightAction, risk: oversightRisk }) });
    const data = await res.json();
    if (!res.ok) { setOversightMessage(data.error || 'Unable to queue request'); return; }
    setOversight(items => [data.request, ...items]);
    setOversightTitle('');
    setOversightObjective('');
    setOversightAction('');
    setOversightMessage('Queued for human review. No agent action was executed.');
  };

  const decideOversight = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch('/api/masa/oversight', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, reviewer: 'operator' }) });
    if (!res.ok) return;
    const data = await res.json();
    setOversight(items => items.map(item => item.id === id ? data.request : item));
  };

  const addIntegration = async () => {
    setIntegrationMessage('');
    const res = await fetch('/api/masa/integrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: integrationName, kind: integrationKind, source: integrationSource, description: integrationDescription }),
    });
    const data = await res.json();
    if (!res.ok) { setIntegrationMessage(data.error || 'Registration failed'); return; }
    setIntegrations(items => [...items.filter(item => item.id !== data.integration.id), data.integration]);
    setIntegrationName('');
    setIntegrationSource('');
    setIntegrationDescription('');
    setIntegrationMessage('Registered for operator review. No code was executed.');
  };

  const setIntegrationStatus = async (id: string, status: Integration['status']) => {
    const res = await fetch('/api/masa/integrations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (!res.ok) return;
    const data = await res.json();
    setIntegrations(items => items.map(item => item.id === id ? data.integration : item));
  };

  const saveNote = async () => {
    if (!title.trim() || !body.trim()) return;
    const res = await fetch('/api/forensics/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, agent, planet: 'earth' }),
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

  const startTrackRecording = async () => {
    if (recording) return;
    const stream = streamRef.current || await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    if (!streamRef.current) streamRef.current = stream;
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recordingChunksRef.current = [];
    recorder.ondataavailable = event => {
      if (event.data.size) recordingChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordingChunksRef.current, { type: mimeType || 'audio/webm' });
      setRecordedUrl(url => {
        if (url) URL.revokeObjectURL(url);
        return URL.createObjectURL(blob);
      });
    };
    recorder.start(250);
    recorderRef.current = recorder;
    setRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => setRecordingSeconds(value => value + 1), 1000);
  };

  const stopTrackRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    setRecording(false);
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
        body: JSON.stringify({ text, image: seeingRef.current ? captureFrame() : undefined, agent, planet: 'earth' }),
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
  }, [agent]);

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
    recorderRef.current?.stop();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    stopVision();
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
  }, [recordedUrl]);

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
          {DESK_TABS.map(({ id, label }) => {
            const Icon = DESK_TAB_ICONS[id];
            return (
              <button key={id} type="button" title={label} aria-label={label} onClick={() => setTab(id)} className={`flex-1 py-1.5 border-b-2 ${tab === id ? 'text-[var(--gold-light)] border-[var(--gold-primary)]' : 'text-[var(--text-muted)] border-transparent'}`}>
                <Icon className="w-3 h-3 mx-auto" />
              </button>
            );
          })}
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

        {tab === 'agents' && (
          <div className="space-y-3 masa-agent-console">
            <div className="flex items-center justify-between border-b border-[var(--cyan-primary)]/20 pb-2">
              <div>
                <div className="text-[var(--cyan-primary)] tracking-[0.2em]">HORUS-1 // AGENT CONSOLE</div>
                <div className="text-[8px] text-[var(--text-muted)]">LIVE LOCAL LANES · CLI / MCP / PROMPT FABRIC</div>
              </div>
              <Activity className="h-4 w-4 text-[var(--cyan-primary)] animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-1">
              {agents.map(item => (
                <button key={item.id} type="button" onClick={() => setDispatchAgent(item.id)} className={`agent-node text-left ${dispatchAgent === item.id ? 'agent-node--active' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[9px] text-[var(--text-heading)]">{item.name}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'available' ? 'bg-[#53e38b] shadow-[0_0_8px_#53e38b]' : 'bg-[var(--alert-red)]'}`} />
                  </div>
                  <div className="mt-1 text-[7px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.interface} · {item.status}</div>
                </button>
              ))}
            </div>
            <div className="rounded border border-[var(--gold-primary)]/30 bg-black/40 p-2">
              <div className="mb-1 flex items-center gap-1 text-[8px] tracking-[0.18em] text-[var(--gold-light)]"><Zap className="h-3 w-3" /> DISPATCH VECTOR</div>
              <select value={dispatchAgent} onChange={e => setDispatchAgent(e.target.value)} className="w-full rounded border border-white/10 bg-black/60 px-2 py-1.5 text-[10px] font-mono">
                {agents.filter(item => item.callable).map(item => <option key={item.id} value={item.id}>{item.name} · {item.interface}</option>)}
              </select>
              <input value={dispatchInput} onChange={e => setDispatchInput(e.target.value)} placeholder="COMMAND / PROMPT / TASK" className="mt-2 w-full rounded border border-white/10 bg-black/60 px-2 py-1.5 text-[10px] font-mono" />
              <button type="button" onClick={dispatch} disabled={dispatchBusy} className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-[var(--cyan-primary)]/15 py-2 text-[10px] tracking-[0.18em] text-[var(--cyan-primary)] disabled:opacity-40">
                <Terminal className="h-3 w-3" /> {dispatchBusy ? 'EXECUTING VECTOR' : 'EXECUTE THROUGH HORUS'}
              </button>
            </div>
            {dispatchOutput && <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-[var(--cyan-primary)]/20 bg-black/70 p-2 text-[8px] leading-relaxed text-[var(--text-secondary)]">{dispatchOutput}</pre>}

            <div className="pt-1"><AgentDashboards /></div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-2">
            <select value={agent} onChange={e => setAgent(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono">
              {FORENSIC_AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              
            </select>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="NOTE TITLE" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] font-mono" />
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="RAW FORENSIC BODY" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] font-mono" />
            <button type="button" onClick={saveNote} className="w-full py-1.5 rounded bg-[var(--gold-primary)]/20 text-[var(--gold-light)] text-[10px] tracking-[0.2em]">HARDWIRE NOTE</button>
            {notes.slice(0, 12).map(n => (
              <div key={n.id} className="rounded border border-white/10 p-2">
                <div className="text-[10px] text-[var(--gold-light)]">{n.title}</div>
                <div className="text-[8px] text-[var(--text-muted)]">{n.agent} · {n.ts.slice(0, 16)}</div>
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

            <PlatformPipeline />
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
            <div className="masa-intel-panel rounded-lg border border-[var(--gold-primary)]/30 bg-[var(--gold-primary)]/5 p-2">
              <div className="text-[var(--gold-light)] tracking-[0.18em]">MASA INTELLIGENCE FABRIC</div>
              <div className="mt-1 text-[9px] text-[var(--text-muted)]">MASA map + local Hermes registry · read-only</div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <div className="masa-intel-card masa-intel-card--green rounded border border-white/10 p-1.5">
                  <div className="text-[8px] text-[var(--text-muted)]">MASA MAP</div>
                  <div className="text-[var(--cyan-primary)]">{masaIntel?.masa?.present ? 'ONLINE' : 'CHECKING'}</div>
                </div>
                <div className="masa-intel-card masa-intel-card--purple rounded border border-white/10 p-1.5">
                  <div className="text-[8px] text-[var(--text-muted)]">HERMES SKILLS</div>
                  <div className="text-[var(--gold-light)]">{masaIntel?.hermes?.skillCount ?? '—'}</div>
                </div>
              </div>
              <div className="mt-2 text-[8px] break-all text-[var(--text-muted)]">
                {masaIntel?.hermes?.skillsPath || 'Loading local registry…'}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {(masaIntel?.foundation?.resources || []).map(resource => (
                  <div key={resource.id} className="rounded border border-white/10 p-1.5">
                    <div className={resource.present ? 'text-[#53e38b]' : 'text-[var(--alert-red)]'}>{resource.present ? 'LIVE' : 'MISSING'}</div>
                    <div className="text-[7px] text-[var(--text-muted)]">{resource.name}</div>
                    <div className="text-[7px] text-[var(--gold-light)]">{resource.mode}</div>
                  </div>
                ))}
              </div>
              {masaIntel?.hermes?.skills && (
                <div className="mt-2 flex max-h-20 flex-wrap gap-1 overflow-y-auto">
                  {masaIntel.hermes.skills.map(skill => <span key={skill} className="masa-chip masa-chip--purple">{skill}</span>)}
                </div>
              )}

              <div className="masa-intel-alert mt-2 rounded border border-white/10 px-2 py-1 text-[8px]">
                RED ALERT LANE: live alerts remain in the existing MASA alert surfaces.
              </div>
            </div>
            <p>Local traces: <span className="text-[var(--gold-light)]">data/langsmith-local.jsonl</span></p>
            <p>Remote LangSmith posts when <span className="text-[var(--gold-light)]">LANGSMITH_API_KEY</span> is set.</p>
            <p>Notes hardwired: <span className="text-[var(--gold-light)]">data/forensic-notes.json</span></p>
            <p>Recreate spec: <span className="text-[var(--gold-light)]">data/masa-unified.json</span></p>
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

        {tab === 'studio' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[var(--gold-light)] tracking-[0.18em]">GARAGE STUDIO · CALIFORNIA TAKE DECK</div>
                <div className="text-[9px] text-[var(--text-muted)]">HORUS hears the mic locally: voice, phrasing, cadence, and live transcript feed.</div>
              </div>
              <div className={`h-2 w-2 rounded-full ${recording ? 'bg-red-400 shadow-[0_0_12px_#f87171] animate-pulse' : 'bg-white/20'}`} />
            </div>
            <input value={studioTrack} onChange={e => setStudioTrack(e.target.value)} placeholder="TRACK / UPLOAD TITLE" className="w-full rounded border border-white/10 bg-black/40 px-2 py-2 text-[11px] font-mono" />
            <select value={studioStatus} onChange={e => setStudioStatus(e.target.value)} className="w-full rounded border border-white/10 bg-black/40 px-2 py-2 text-[10px] font-mono">
              <option>IDEA</option><option>RECORDING</option><option>EDITING</option><option>MIX READY</option><option>MASTER READY</option><option>DROP READY</option>
            </select>
            <StudioEngine title={studioTrack} />
            <div className="rounded border border-[var(--cyan-primary)]/30 bg-black/50 p-2">
              <div className="flex items-center justify-between text-[9px] text-[var(--cyan-primary)]">
                <span>MIC SIGNAL · {Math.round(audioLevel * 100)}%</span>
                <span className="tabular-nums">{Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded bg-white/10">
                <div className="h-full bg-gradient-to-r from-[var(--cyan-primary)] via-[var(--gold-primary)] to-red-400 transition-[width] duration-75" style={{ width: `${Math.max(2, Math.round(audioLevel * 100))}%` }} />
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={recording ? stopTrackRecording : startTrackRecording} className={`flex-1 rounded py-2 text-[10px] tracking-[0.16em] ${recording ? 'bg-red-500/20 text-red-300' : 'bg-[var(--gold-primary)]/20 text-[var(--gold-light)]'}`}>
                  {recording ? 'STOP TAKE' : 'RECORD TAKE'}
                </button>
                {recordedUrl && <a href={recordedUrl} download={`${studioTrack || 'masa-take'}.webm`} className="rounded bg-white/10 px-3 py-2 text-[10px] text-[var(--cyan-primary)]">SAVE</a>}
              </div>
              {recordedUrl && <audio controls src={recordedUrl} className="mt-2 h-8 w-full" />}
            </div>
            {transcript && <div className="rounded border border-[var(--gold-primary)]/25 bg-[var(--gold-primary)]/5 p-2 text-[9px] text-[var(--text-secondary)]"><span className="text-[var(--gold-light)]">LIVE FLOW · </span>{transcript}</div>}
            <div className="grid grid-cols-2 gap-1 text-[9px]">
              {['VOCALS CLEAN', 'INSTRUMENTAL BALANCED', 'MIX CHECKED', 'MASTER LOUDNESS', 'COVER ART', 'METADATA'].map(item => (
                <label key={item} className="flex items-center gap-1 rounded border border-white/10 p-2"><input type="checkbox" />{item}</label>
              ))}
            </div>
            <div className="rounded border border-[#53e38b]/40 bg-[#2ecc71]/10 p-2 text-[10px] text-[#9af0b7]">{studioTrack || 'Untitled track'} · {studioStatus}</div>
          </div>
        )}

        {tab === 'tv' && (() => {
          const active = tvFeeds.find(f => f.id === tvChannel);
          const player = active ? embedUrl(active.url, active.embed_allowed !== false) : null;
          return (
            <div className="space-y-2">
              <div className="text-[var(--gold-light)] tracking-[0.18em]">LIVE TV · STAYS IN MASA</div>
              <div className="w-full aspect-video rounded border border-white/10 bg-black overflow-hidden">
                {player ? (
                  <iframe src={player} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-[var(--text-muted)] text-center px-6">
                    {active ? `${active.name} does not allow embedding — pick another channel.` : 'Pick a channel below.'}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                {tvFeeds.map(feed => (
                  <button
                    key={feed.id}
                    type="button"
                    onClick={() => setTvChannel(feed.id)}
                    className={`rounded border p-1.5 text-left text-[9px] tracking-[0.08em] ${tvChannel === feed.id ? 'border-[var(--gold-primary)] text-[var(--gold-light)] bg-[var(--gold-primary)]/10' : 'border-white/10 text-[var(--text-muted)]'}`}
                  >
                    <div className="truncate">{feed.name}</div>
                    <div className="truncate text-[8px] opacity-70">{feed.city}{feed.embed_allowed === false ? ' · external only' : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {tab === 'providers' && (
          <div className="space-y-2">
            <div className="text-[var(--gold-light)] tracking-[0.18em]">MODEL BRAIN · PROVIDER LINK</div>
            <div className="text-[9px] text-[var(--text-muted)]">API keys are never displayed. Configure them in your local environment, then refresh.</div>
            {providers.map(provider => (
              <div key={provider.id} className="rounded border border-white/10 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[var(--cyan-primary)]">{provider.name}</span>
                  <span className={`text-[8px] ${provider.configured ? 'text-[#53e38b]' : 'text-[var(--text-muted)]'}`}>{provider.configured ? 'CONFIGURED' : 'KEY NEEDED'}</span>
                </div>
                <div className="mt-1 text-[8px] text-[var(--text-muted)]">{provider.capabilities.join(' · ')} · {provider.models.length} models</div>
                <div className="mt-1 flex gap-2 text-[8px]">
                  <a className="text-[var(--gold-light)] underline" href={provider.website} target="_blank" rel="noreferrer">SITE</a>
                  <a className="text-[var(--gold-light)] underline" href={provider.docs} target="_blank" rel="noreferrer">API DOCS</a>
                  {provider.console && <a className="text-[var(--gold-light)] underline" href={provider.console} target="_blank" rel="noreferrer">DASHBOARD</a>}
                </div>
                <div className="mt-1 text-[8px] break-words text-[var(--text-secondary)]">{provider.models.slice(0, 6).join(' · ')}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'integrations' && (
          <div className="space-y-2">
            <div className="text-[var(--gold-light)] tracking-[0.18em]">EXTENSION BAY · SKILLS / PLUGINS / MCP</div>
            <div className="rounded border border-[var(--cyan-primary)]/30 bg-[var(--cyan-primary)]/5 p-2">
              <div className="text-[var(--cyan-primary)] tracking-[0.14em]">OFFICIAL SOCIAL LINKS</div>
              <div className="mt-1 text-[8px] text-[var(--text-muted)]">Login, landing, and developer pages. No credentials are handled here.</div>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {socialLinks.map(link => (
                  <div key={link.id} className="rounded border border-white/10 p-1.5">
                    <div className="text-[9px] text-[var(--text-heading)]">{link.name}</div>
                    <div className="mt-0.5 flex gap-2 text-[7px]">
                      <a className="text-[var(--gold-light)] underline" href={link.login} target="_blank" rel="noreferrer">LOGIN</a>
                      <a className="text-[var(--gold-light)] underline" href={link.landing} target="_blank" rel="noreferrer">HOME</a>
                      <a className="text-[var(--gold-light)] underline" href={link.developer} target="_blank" rel="noreferrer">DEV</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-white/10 bg-black/40 p-2">
              <div className="flex items-center justify-between text-[9px] tracking-[0.16em] text-[var(--cyan-primary)]">
                <span>LIVE MCP SERVERS · HERMES</span>
                <button type="button" onClick={refreshMcpLive} className="text-[8px] text-[var(--gold-light)] underline">REFRESH</button>
              </div>
              {mcpLive.length === 0 && <div className="mt-1 text-[8px] text-[var(--text-muted)]">{mcpLiveNote || 'No MCP servers connected yet — register one below.'}</div>}
              {mcpLive.map(s => (
                <div key={s.name} className="mt-1 flex items-center justify-between gap-2 rounded border border-white/10 px-2 py-1 text-[8px]">
                  <span className="text-[var(--text-heading)]">{s.name}</span>
                  <span className="truncate text-[var(--text-muted)]">{s.transport}</span>
                  <span className={s.status.includes('enabled') ? 'text-[#53e38b]' : 'text-[var(--text-muted)]'}>{s.status}</span>
                </div>
              ))}
            </div>
            <div className="rounded border border-[#53e38b]/30 bg-[#2ecc71]/10 p-2 text-[9px] text-[#9af0b7]">
              Register first, inspect permissions, then approve. MASA never auto-runs downloaded code or connects to an MCP server from this panel.
            </div>
            <select value={integrationKind} onChange={e => setIntegrationKind(e.target.value as Integration['kind'])} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono">
              <option value="mcp">MCP SERVER</option><option value="skill">SKILL</option><option value="plugin">PLUGIN</option>
            </select>
            <input value={integrationName} onChange={e => setIntegrationName(e.target.value)} placeholder="NAME" className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono" />
            <input value={integrationSource} onChange={e => setIntegrationSource(e.target.value)} placeholder={integrationKind === 'mcp' ? 'https://server.example/sse' : '/path or git@host:org/repo.git'} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono" />
            <textarea value={integrationDescription} onChange={e => setIntegrationDescription(e.target.value)} placeholder="CAPABILITIES / PERMISSIONS / NOTES" rows={2} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono" />
            <button type="button" onClick={addIntegration} className="w-full rounded bg-[var(--gold-primary)]/20 py-1.5 text-[10px] tracking-[0.16em] text-[var(--gold-light)]">REGISTER FOR REVIEW</button>
            {integrationMessage && <div className="text-[9px] text-[var(--cyan-primary)]">{integrationMessage}</div>}
            {integrations.map(item => (
              <div key={item.id} className="rounded border border-white/10 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[var(--cyan-primary)]">{item.name}</span>
                  <span className={`text-[8px] ${item.status === 'approved' ? 'text-[#53e38b]' : item.status === 'disabled' ? 'text-[var(--alert-red)]' : 'text-[var(--gold-light)]'}`}>{item.status.toUpperCase()}</span>
                </div>
                <div className="text-[8px] text-[var(--text-muted)]">{item.kind.toUpperCase()} · {item.source}</div>
                <div className="mt-1 text-[9px] text-[var(--text-secondary)]">{item.description}</div>
                {item.id !== 'hermes-robonaut' && item.id !== 'mcp-sse-template' && (
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={() => setIntegrationStatus(item.id, 'approved')} className="text-[8px] text-[#53e38b] underline">APPROVE</button>
                    <button type="button" onClick={() => setIntegrationStatus(item.id, 'disabled')} className="text-[8px] text-[var(--alert-red)] underline">DISABLE</button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

        {tab === 'oversight' && (
          <div className="space-y-2">
            <div className="text-[var(--gold-light)] tracking-[0.18em]">HUMAN OVERSIGHT · REASONING CONTROL PLANE</div>
            <div className="rounded border border-[#53e38b]/30 bg-[#2ecc71]/10 p-2 text-[9px] text-[#9af0b7]">
              Agents may propose plans and tool actions. A human must approve before anything can be wired into an execution path.
            </div>
            <input value={oversightTitle} onChange={e => setOversightTitle(e.target.value)} placeholder="REQUEST TITLE" className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono" />
            <textarea value={oversightObjective} onChange={e => setOversightObjective(e.target.value)} placeholder="OBJECTIVE / CONTEXT" rows={2} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono" />
            <textarea value={oversightAction} onChange={e => setOversightAction(e.target.value)} placeholder="PROPOSED ACTION / TOOL PLAN" rows={3} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono" />
            <select value={oversightRisk} onChange={e => setOversightRisk(e.target.value as Oversight['risk'])} className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] font-mono">
              <option value="low">LOW RISK</option><option value="medium">MEDIUM RISK</option><option value="high">HIGH RISK</option><option value="critical">CRITICAL RISK</option>
            </select>
            <button type="button" onClick={createOversight} className="w-full rounded bg-[var(--gold-primary)]/20 py-1.5 text-[10px] tracking-[0.16em] text-[var(--gold-light)]">QUEUE FOR HUMAN REVIEW</button>
            {oversightMessage && <div className="text-[9px] text-[var(--cyan-primary)]">{oversightMessage}</div>}
            {oversight.map(item => (
              <div key={item.id} className="rounded border border-white/10 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[var(--cyan-primary)]">{item.title}</span>
                  <span className="text-[8px] text-[var(--gold-light)]">{item.status.toUpperCase()} · {item.risk.toUpperCase()}</span>
                </div>
                <div className="mt-1 text-[9px] text-[var(--text-secondary)]">{item.objective}</div>
                <div className="mt-1 text-[8px] text-[var(--text-muted)]">{item.proposedAction}</div>
                {item.status === 'pending' && <div className="mt-2 flex gap-2"><button type="button" onClick={() => decideOversight(item.id, 'approved')} className="text-[8px] text-[#53e38b] underline">APPROVE</button><button type="button" onClick={() => decideOversight(item.id, 'rejected')} className="text-[8px] text-[var(--alert-red)] underline">REJECT</button></div>}
              </div>
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
