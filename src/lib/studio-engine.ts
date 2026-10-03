/** Browser multitrack engine on Web Audio. Client-only: create it from a user gesture. */
import { audibleTracks, beatSeconds, clamp, computePeaks, dbToGain, encodeWav, pickRecorderMime, reverbImpulse, stepSeconds, swingOffset } from './studio-dsp';
import { triggerVoice, type VoiceKind } from './studio-voices';

export const MAX_TRACKS = 8;
const COLORS = ['#f5c542', '#4de1ff', '#ff6b6b', '#53e38b', '#b18cff', '#ff9f43', '#5fa8ff', '#ff7ac6'];

export type TrackState = {
  id: string; name: string; color: string;
  gainDb: number; pan: number; eqLow: number; eqMid: number; eqHigh: number; reverb: number;
  mute: boolean; solo: boolean; armed: boolean;
  /** Seconds from timeline zero to where this clip starts. */
  offset: number; duration: number; peaks: Float32Array | null;
};

type Chain = { input: GainNode; out: AudioNode };
type TrackNode = { chain: Chain; buffer: AudioBuffer | null; source: AudioBufferSourceNode | null };

export const MAX_STEPS = 32;
/** One channel-rack row. cells[i] is null (off) or the MIDI note to play on that step. */
export type Lane = { id: string; kind: VoiceKind; name: string; cells: (number | null)[]; gainDb: number; mute: boolean };
export type PatternState = { steps: 16 | 32; swing: number; gainDb: number; lanes: Lane[] };

export function defaultPattern(): PatternState {
  const mk = (kind: VoiceKind, name: string): Lane => ({ id: kind, kind, name, cells: Array(MAX_STEPS).fill(null), gainDb: 0, mute: false });
  return { steps: 16, swing: 0, gainDb: -3, lanes: [mk('kick', 'Kick'), mk('snare', 'Snare'), mk('clap', 'Clap'), mk('hat', 'Hat'), mk('openhat', 'Open Hat'), mk('tom', 'Tom'), mk('bass', 'Bass'), mk('lead', 'Lead')] };
}

export type InputSettings = { deviceId?: string; channelCount: 1 | 2; monitor: boolean };

/** One place builds a track's signal path, so live playback and offline bounce sound identical. */
function buildChain(ctx: BaseAudioContext, s: TrackState, dest: AudioNode, reverbIn: AudioNode): Chain {
  const input = ctx.createGain();
  const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 200; low.gain.value = s.eqLow;
  const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1500; mid.Q.value = 0.9; mid.gain.value = s.eqMid;
  const high = ctx.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 6000; high.gain.value = s.eqHigh;
  const pan = ctx.createStereoPanner(); pan.pan.value = s.pan;
  const fader = ctx.createGain(); fader.gain.value = dbToGain(s.gainDb);
  const send = ctx.createGain(); send.gain.value = s.reverb;
  input.connect(low); low.connect(mid); mid.connect(high); high.connect(pan); pan.connect(fader);
  fader.connect(dest); fader.connect(send); send.connect(reverbIn);
  return { input, out: fader };
}

export class StudioEngine {
  ctx: AudioContext;
  bpm = 120;
  metronome = false;
  loop = false;
  loopStart = 0;
  loopEnd = 8;
  /** Milliseconds subtracted from a take's start to cancel round-trip latency. */
  latencyMs = 0;
  playing = false;
  recording = false;
  pattern: PatternState = defaultPattern();
  private patternBus: GainNode;
  private laneBus = new Map<string, GainNode>();
  private nextStepIdx = 0;
  private tracks: TrackState[] = [];
  private nodes = new Map<string, TrackNode>();
  private master: GainNode;
  private limiter: DynamicsCompressorNode;
  private analyser: AnalyserNode;
  private reverbIn: GainNode;
  private startedAt = 0;
  private startPos = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextClick = 0;
  private listeners = new Set<() => void>();
  private inputStream: MediaStream | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private monitorGain: GainNode | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private recTrack: string | null = null;
  private recPos = 0;
  private buf = new Float32Array(2048);

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'interactive' });
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6; // headroom: drums, bass and tracks sum hot before the limiter
    this.limiter = this.ctx.createDynamicsCompressor();
    Object.assign(this.limiter.threshold, { value: -3 });
    Object.assign(this.limiter.knee, { value: 0 });
    Object.assign(this.limiter.ratio, { value: 20 });
    Object.assign(this.limiter.attack, { value: 0.003 });
    Object.assign(this.limiter.release, { value: 0.12 });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.master.connect(this.limiter); this.limiter.connect(this.analyser); this.analyser.connect(this.ctx.destination);
    const conv = this.ctx.createConvolver();
    const ir = reverbImpulse(this.ctx.sampleRate);
    const irBuf = this.ctx.createBuffer(2, ir[0].length, this.ctx.sampleRate);
    ir.forEach((c, i) => irBuf.copyToChannel(new Float32Array(c), i));
    conv.buffer = irBuf;
    this.reverbIn = this.ctx.createGain();
    this.reverbIn.connect(conv); conv.connect(this.master);
    this.patternBus = this.ctx.createGain();
    this.patternBus.connect(this.master);
    this.applyPattern();
    this.addTrack();
  }

  // ---- pattern (channel rack) ----
  private applyPattern() {
    this.patternBus.gain.value = dbToGain(this.pattern.gainDb);
    this.pattern.lanes.forEach(l => {
      let g = this.laneBus.get(l.id);
      if (!g) { g = this.ctx.createGain(); g.connect(this.patternBus); this.laneBus.set(l.id, g); }
      g.gain.value = l.mute ? 0 : dbToGain(l.gainDb);
    });
  }
  setPattern(p: PatternState) { this.pattern = p; this.applyPattern(); this.emit(); }
  patchPattern(patch: Partial<Pick<PatternState, 'steps' | 'swing' | 'gainDb'>>) { this.setPattern({ ...this.pattern, ...patch }); }
  updateLane(id: string, patch: Partial<Pick<Lane, 'gainDb' | 'mute'>>) {
    this.setPattern({ ...this.pattern, lanes: this.pattern.lanes.map(l => (l.id === id ? { ...l, ...patch } : l)) });
  }
  /** Toggle a step. Pitched lanes keep `note` (default C2 for bass, C4 for lead). */
  toggleCell(laneId: string, step: number, note?: number) {
    this.setPattern({ ...this.pattern, lanes: this.pattern.lanes.map(l => {
      if (l.id !== laneId) return l;
      const cells = l.cells.slice();
      cells[step] = cells[step] === null ? (note ?? (l.kind === 'bass' ? 36 : l.kind === 'lead' ? 72 : 60)) : null;
      return { ...l, cells };
    }) });
  }
  clearPattern() { this.setPattern({ ...this.pattern, lanes: this.pattern.lanes.map(l => ({ ...l, cells: Array(MAX_STEPS).fill(null) })) }); }

  /** Play a voice right now (pad tap). */
  audition(kind: VoiceKind, note = 60) {
    void this.resume();
    const bus = this.laneBus.get(kind) ?? this.patternBus;
    triggerVoice(this.ctx, bus, kind, this.ctx.currentTime + 0.005, note, stepSeconds(this.bpm));
  }
  /** Tap-in: sound the pad and, if the transport is running, quantise the hit to the nearest step. */
  tap(kind: VoiceKind, note?: number) {
    this.audition(kind, note ?? (kind === 'bass' ? 36 : kind === 'lead' ? 72 : 60));
    if (!this.playing) return;
    const step = Math.round(this.position / stepSeconds(this.bpm)) % this.pattern.steps;
    const lane = this.pattern.lanes.find(l => l.id === kind);
    if (lane && lane.cells[step] === null) this.toggleCell(kind, step, note);
  }

  private schedulePattern(pos: number) {
    const sec = stepSeconds(this.bpm);
    while (this.nextStepIdx * sec < pos + 0.15) {
      const idx = this.nextStepIdx;
      const step = idx % this.pattern.steps;
      const when = this.startedAt + (idx * sec - this.startPos) + swingOffset(step, this.bpm, this.pattern.swing);
      if (when >= this.ctx.currentTime - 0.01) {
        this.pattern.lanes.forEach(l => {
          const n = l.cells[step];
          if (n !== null && n !== undefined && !l.mute) triggerVoice(this.ctx, this.laneBus.get(l.id) ?? this.patternBus, l.kind, Math.max(when, this.ctx.currentTime), n, sec);
        });
      }
      this.nextStepIdx++;
    }
  }

  setBpm(v: number) { this.bpm = clamp(Math.round(v) || 120, 40, 240); this.emit(); }
  setMetronome(v: boolean) { this.metronome = v; this.emit(); }
  setLoop(v: boolean) { this.loop = v; this.emit(); }
  setLatency(ms: number) { this.latencyMs = clamp(Math.round(ms) || 0, 0, 400); this.emit(); }

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit() { this.listeners.forEach(fn => fn()); }
  getTracks() { return this.tracks; }
  get sampleRate() { return this.ctx.sampleRate; }
  /** Round-trip latency the browser reports, in ms. Only a starting point for latencyMs. */
  reportedLatencyMs() {
    const c = this.ctx as AudioContext & { outputLatency?: number };
    return Math.round(((c.baseLatency || 0) + (c.outputLatency || 0)) * 1000);
  }

  async resume() { if (this.ctx.state !== 'running') await this.ctx.resume(); }

  /** Route output to a specific device. Not every browser can (iOS Safari can't); returns false then. */
  async setOutputDevice(deviceId: string): Promise<boolean> {
    const c = this.ctx as AudioContext & { setSinkId?: (id: string) => Promise<void> };
    if (!c.setSinkId) return false;
    try { await c.setSinkId(deviceId === 'default' ? '' : deviceId); return true; } catch { return false; }
  }

  // ---- tracks ----
  addTrack(): TrackState | null {
    if (this.tracks.length >= MAX_TRACKS) return null;
    const n = this.tracks.length + 1;
    const t: TrackState = {
      id: `t${Date.now().toString(36)}${n}`, name: `Track ${n}`, color: COLORS[(n - 1) % COLORS.length],
      gainDb: 0, pan: 0, eqLow: 0, eqMid: 0, eqHigh: 0, reverb: 0, mute: false, solo: false, armed: n === 1,
      offset: 0, duration: 0, peaks: null,
    };
    this.tracks = [...this.tracks, t];
    this.nodes.set(t.id, { chain: buildChain(this.ctx, t, this.master, this.reverbIn), buffer: null, source: null });
    this.emit();
    return t;
  }

  removeTrack(id: string) {
    if (this.tracks.length <= 1) return;
    this.stopSource(id);
    this.nodes.get(id)?.chain.out.disconnect();
    this.nodes.delete(id);
    this.tracks = this.tracks.filter(t => t.id !== id);
    if (!this.tracks.some(t => t.armed)) this.tracks = this.tracks.map((t, i) => (i === 0 ? { ...t, armed: true } : t));
    this.emit();
  }

  /** Update a track. The chain is rebuilt in place, which is cheap for a handful of nodes. */
  update(id: string, patch: Partial<TrackState>) {
    this.tracks = this.tracks.map(t => {
      if (t.id !== id) return patch.armed ? { ...t, armed: false } : t;
      return { ...t, ...patch };
    });
    const t = this.tracks.find(x => x.id === id);
    const node = this.nodes.get(id);
    if (t && node) {
      const wasPlaying = this.playing;
      node.chain.out.disconnect();
      const src = node.source;
      node.chain = buildChain(this.ctx, t, this.master, this.reverbIn);
      if (src && wasPlaying) src.connect(node.chain.input);
    }
    this.applyAudibility();
    this.emit();
  }

  private applyAudibility() {
    const ok = audibleTracks(this.tracks);
    this.nodes.forEach((node, id) => { node.chain.out.disconnect(); if (ok.has(id)) node.chain.out.connect(this.master); });
    // Reverb send taps the fader, so re-add it for audible tracks only.
    this.tracks.forEach(t => {
      const node = this.nodes.get(t.id);
      if (!node || !ok.has(t.id)) return;
      const send = this.ctx.createGain(); send.gain.value = t.reverb;
      node.chain.out.connect(send); send.connect(this.reverbIn);
    });
  }

  setBuffer(id: string, buffer: AudioBuffer, offset = 0) {
    const node = this.nodes.get(id); if (!node) return;
    node.buffer = buffer;
    this.tracks = this.tracks.map(t => (t.id === id ? { ...t, offset, duration: buffer.duration, peaks: computePeaks(buffer.getChannelData(0), 480) } : t));
    this.emit();
  }
  clearTrack(id: string) {
    const node = this.nodes.get(id); if (!node) return;
    this.stopSource(id); node.buffer = null;
    this.tracks = this.tracks.map(t => (t.id === id ? { ...t, duration: 0, offset: 0, peaks: null } : t));
    this.emit();
  }
  async importFile(id: string, file: File) {
    const audio = await this.ctx.decodeAudioData(await file.arrayBuffer());
    this.setBuffer(id, audio, 0);
    this.update(id, { name: file.name.replace(/\.[^.]+$/, '').slice(0, 24) });
  }

  patternHasNotes() { return this.pattern.lanes.some(l => l.cells.slice(0, this.pattern.steps).some(c => c !== null)); }

  // ---- transport ----
  get position() { return this.playing ? this.startPos + (this.ctx.currentTime - this.startedAt) : this.startPos; }
  get length() { return this.tracks.reduce((m, t) => Math.max(m, t.offset + t.duration), 0); }

  private stopSource(id: string) {
    const node = this.nodes.get(id);
    try { node?.source?.stop(); } catch { /* already stopped */ }
    node?.source?.disconnect();
    if (node) node.source = null;
  }

  private startSources(from: number, when: number) {
    this.applyAudibility();
    this.tracks.forEach(t => {
      const node = this.nodes.get(t.id);
      if (!node?.buffer) return;
      this.stopSource(t.id);
      const rel = from - t.offset;
      if (rel >= node.buffer.duration) return;
      const src = this.ctx.createBufferSource();
      src.buffer = node.buffer;
      src.connect(node.chain.input);
      if (rel >= 0) src.start(when, rel); else src.start(when + -rel);
      node.source = src;
    });
  }

  async play(from = this.startPos) {
    await this.resume();
    if (this.playing) this.stopTransport(false);
    this.startPos = clamp(from, 0, 36000);
    this.startedAt = this.ctx.currentTime + 0.05;
    this.startSources(this.startPos, this.startedAt);
    this.playing = true;
    this.nextClick = Math.ceil((this.startPos * 1) / beatSeconds(this.bpm)) * beatSeconds(this.bpm);
    this.nextStepIdx = Math.ceil(this.startPos / stepSeconds(this.bpm));
    this.timer = setInterval(() => this.tick(), 25);
    this.emit();
  }

  private tick() {
    const pos = this.position;
    if (this.loop && this.loopEnd > this.loopStart && pos >= this.loopEnd) {
      if (this.recording) return;
      void this.play(this.loopStart);
      return;
    }
    if (!this.recording && !this.patternHasNotes() && this.length > 0 && pos > this.length + 0.25 && !this.loop) { this.stopTransport(true); return; }
    this.schedulePattern(pos);
    if (this.metronome) {
      const beat = beatSeconds(this.bpm);
      while (this.nextClick < pos + 0.15) {
        const when = this.startedAt + (this.nextClick - this.startPos);
        if (when > this.ctx.currentTime) this.click(when, Math.round(this.nextClick / beat) % 4 === 0);
        this.nextClick += beat;
      }
    }
    this.emit();
  }

  private click(when: number, accent: boolean) {
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.frequency.value = accent ? 1600 : 1000;
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.5, when + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    o.connect(g); g.connect(this.master); o.start(when); o.stop(when + 0.06);
  }

  private stopTransport(rewind: boolean) {
    const pos = this.position;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.tracks.forEach(t => this.stopSource(t.id));
    this.playing = false;
    this.startPos = rewind ? 0 : pos;
  }

  stop() {
    if (this.recording) void this.stopRecording();
    this.stopTransport(false);
    this.startPos = 0;
    this.emit();
  }
  seek(sec: number) { if (this.playing) void this.play(sec); else { this.startPos = clamp(sec, 0, 36000); this.emit(); } }

  // ---- input ----
  async listDevices() {
    const all = await navigator.mediaDevices.enumerateDevices();
    return { inputs: all.filter(d => d.kind === 'audioinput'), outputs: all.filter(d => d.kind === 'audiooutput') };
  }

  /** Open an input with processing off: echo cancel / noise suppression / AGC ruin music takes. */
  async openInput(s: InputSettings) {
    this.closeInput();
    this.inputStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: s.deviceId && s.deviceId !== 'default' ? { exact: s.deviceId } : undefined, channelCount: s.channelCount, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.inputSource = this.ctx.createMediaStreamSource(this.inputStream);
    this.inputAnalyser = this.ctx.createAnalyser(); this.inputAnalyser.fftSize = 1024;
    this.inputSource.connect(this.inputAnalyser);
    this.setMonitor(s.monitor);
  }
  setMonitor(on: boolean) {
    this.monitorGain?.disconnect(); this.monitorGain = null;
    if (on && this.inputSource) { this.monitorGain = this.ctx.createGain(); this.monitorGain.gain.value = 0.8; this.inputSource.connect(this.monitorGain); this.monitorGain.connect(this.ctx.destination); }
  }
  closeInput() {
    this.monitorGain?.disconnect(); this.inputSource?.disconnect();
    this.inputStream?.getTracks().forEach(t => t.stop());
    this.inputStream = null; this.inputSource = null; this.inputAnalyser = null; this.monitorGain = null;
  }
  get inputOpen() { return !!this.inputStream; }
  get inputLabel() { return this.inputStream?.getAudioTracks()[0]?.label || ''; }

  private level(a: AnalyserNode | null) {
    if (!a) return { rms: 0, peak: 0 };
    if (this.buf.length !== a.fftSize) this.buf = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(this.buf as Float32Array<ArrayBuffer>);
    let sum = 0; let peak = 0;
    for (let i = 0; i < a.fftSize; i++) { const v = Math.abs(this.buf[i]); sum += v * v; if (v > peak) peak = v; }
    return { rms: Math.sqrt(sum / a.fftSize), peak };
  }
  inputLevel() { return this.level(this.inputAnalyser); }
  masterLevel() { return this.level(this.analyser); }

  // ---- record ----
  async startRecording(countInBeats = 0) {
    if (!this.inputStream) throw new Error('Open an input first');
    const armed = this.tracks.find(t => t.armed);
    if (!armed) throw new Error('Arm a track first');
    await this.resume();
    const mime = pickRecorderMime(t => MediaRecorder.isTypeSupported(t));
    this.recorder = new MediaRecorder(this.inputStream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.recorder.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
    this.recTrack = armed.id;
    const wasMetronome = this.metronome;
    if (countInBeats > 0) {
      this.metronome = true;
      const beat = beatSeconds(this.bpm);
      const back = this.startPos;
      await this.play(back - countInBeats * beat < 0 ? 0 : back - countInBeats * beat);
      await new Promise(r => setTimeout(r, Math.max(0, (countInBeats * beat - (back - this.position)) * 1000)));
      this.metronome = wasMetronome;
    } else if (!this.playing) await this.play(this.startPos);
    this.recPos = this.position;
    this.recorder.start();
    this.recording = true;
    this.emit();
  }

  async stopRecording() {
    const rec = this.recorder; const id = this.recTrack;
    if (!rec || !id) return;
    this.recording = false;
    const done = new Promise<void>(res => { rec.onstop = () => res(); });
    if (rec.state !== 'inactive') rec.stop();
    await done;
    const blob = new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' });
    this.recorder = null; this.recTrack = null;
    if (blob.size > 0) {
      const audio = await this.ctx.decodeAudioData(await blob.arrayBuffer());
      this.setBuffer(id, audio, Math.max(0, this.recPos - this.latencyMs / 1000));
    }
    this.emit();
  }

  // ---- export ----
  /** Render the whole mix offline (solo/mute/EQ/reverb/limiter applied) and return a WAV. */
  async bounce(): Promise<Blob> {
    const patLen = this.patternHasNotes() ? this.pattern.steps * stepSeconds(this.bpm) * 4 : 0; // four passes when only a pattern exists
    const len = Math.max(0.5, Math.max(this.length, patLen) + 1.5);
    const sr = this.ctx.sampleRate;
    const off = new OfflineAudioContext(2, Math.ceil(len * sr), sr);
    const master = off.createGain();
    master.gain.value = 0.6;
    const lim = off.createDynamicsCompressor();
    Object.assign(lim.threshold, { value: -3 }); Object.assign(lim.knee, { value: 0 }); Object.assign(lim.ratio, { value: 20 });
    Object.assign(lim.attack, { value: 0.003 }); Object.assign(lim.release, { value: 0.12 });
    master.connect(lim); lim.connect(off.destination);
    const conv = off.createConvolver();
    const ir = reverbImpulse(sr); const irBuf = off.createBuffer(2, ir[0].length, sr);
    ir.forEach((c, i) => irBuf.copyToChannel(new Float32Array(c), i));
    conv.buffer = irBuf;
    const rIn = off.createGain(); rIn.connect(conv); conv.connect(master);
    const ok = audibleTracks(this.tracks);
    this.tracks.forEach(t => {
      const b = this.nodes.get(t.id)?.buffer;
      if (!b || !ok.has(t.id)) return;
      const chain = buildChain(off, t, master, rIn);
      const s = off.createBufferSource(); s.buffer = b; s.connect(chain.input); s.start(t.offset);
    });
    if (this.patternHasNotes()) {
      const sec = stepSeconds(this.bpm);
      const bus = off.createGain(); bus.gain.value = dbToGain(this.pattern.gainDb); bus.connect(master);
      const total = Math.floor(Math.max(this.length, patLen) / sec);
      this.pattern.lanes.forEach(l => {
        if (l.mute) return;
        const lb = off.createGain(); lb.gain.value = dbToGain(l.gainDb); lb.connect(bus);
        for (let i = 0; i < total; i++) {
          const step = i % this.pattern.steps; const n = l.cells[step];
          if (n !== null && n !== undefined) triggerVoice(off, lb, l.kind, i * sec + swingOffset(step, this.bpm, this.pattern.swing), n, sec);
        }
      });
    }
    const rendered = await off.startRendering();
    return new Blob([encodeWav([rendered.getChannelData(0), rendered.getChannelData(1)], sr)], { type: 'audio/wav' });
  }

  dispose() {
    this.stop(); this.closeInput();
    void this.ctx.close();
    this.listeners.clear();
  }
}
