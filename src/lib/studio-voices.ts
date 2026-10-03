/** Synthesised drum and bass voices. Work on any BaseAudioContext so live playback and offline bounce share them. */
import { midiToFreq } from './studio-dsp';

export type VoiceKind = 'kick' | 'snare' | 'clap' | 'hat' | 'openhat' | 'tom' | 'bass' | 'lead';
export const DRUM_KINDS: VoiceKind[] = ['kick', 'snare', 'clap', 'hat', 'openhat', 'tom'];

let noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(ctx: BaseAudioContext) {
  let b = noiseCache.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, b);
  }
  return b;
}
export const resetNoiseCache = () => { noiseCache = new WeakMap(); };

function env(g: GainNode, t: number, peak: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function noiseHit(ctx: BaseAudioContext, dest: AudioNode, t: number, o: { type: BiquadFilterType; freq: number; q?: number; peak: number; dur: number }) {
  const s = ctx.createBufferSource(); s.buffer = noise(ctx);
  const f = ctx.createBiquadFilter(); f.type = o.type; f.frequency.value = o.freq; f.Q.value = o.q ?? 0.7;
  const g = ctx.createGain(); env(g, t, o.peak, o.dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + o.dur + 0.02);
}

function toneHit(ctx: BaseAudioContext, dest: AudioNode, t: number, o: { from: number; to: number; sweep: number; peak: number; dur: number; type?: OscillatorType }) {
  const osc = ctx.createOscillator(); osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.from, t); osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + o.sweep);
  const g = ctx.createGain(); env(g, t, o.peak, o.dur);
  osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + o.dur + 0.02);
}

/** Trigger one voice. `note` is a MIDI note for the pitched voices and shifts drum pitch slightly. */
export function triggerVoice(ctx: BaseAudioContext, dest: AudioNode, kind: VoiceKind, when: number, note = 60, stepLen = 0.125) {
  switch (kind) {
    case 'kick': toneHit(ctx, dest, when, { from: 150, to: 42, sweep: 0.12, peak: 1, dur: 0.42 }); break;
    case 'snare':
      noiseHit(ctx, dest, when, { type: 'highpass', freq: 1800, peak: 0.55, dur: 0.18 });
      toneHit(ctx, dest, when, { from: 220, to: 160, sweep: 0.08, peak: 0.45, dur: 0.12, type: 'triangle' }); break;
    case 'clap':
      [0, 0.011, 0.024].forEach(d => noiseHit(ctx, dest, when + d, { type: 'bandpass', freq: 1500, q: 1.2, peak: 0.5, dur: 0.07 }));
      noiseHit(ctx, dest, when + 0.03, { type: 'bandpass', freq: 1400, q: 1, peak: 0.4, dur: 0.16 }); break;
    case 'hat': noiseHit(ctx, dest, when, { type: 'highpass', freq: 7500, peak: 0.28, dur: 0.05 }); break;
    case 'openhat': noiseHit(ctx, dest, when, { type: 'highpass', freq: 7000, peak: 0.26, dur: 0.32 }); break;
    case 'tom': toneHit(ctx, dest, when, { from: 190 * Math.pow(2, (note - 60) / 12), to: 90, sweep: 0.18, peak: 0.8, dur: 0.35 }); break;
    case 'bass':
    case 'lead': {
      const bass = kind === 'bass';
      const dur = Math.max(0.08, stepLen * (bass ? 0.95 : 0.8));
      const osc = ctx.createOscillator(); osc.type = bass ? 'sawtooth' : 'square';
      osc.frequency.value = midiToFreq(note);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = bass ? 6 : 2;
      f.frequency.setValueAtTime(bass ? 1800 : 3200, when); f.frequency.exponentialRampToValueAtTime(bass ? 220 : 800, when + dur);
      const g = ctx.createGain(); env(g, when, bass ? 0.5 : 0.3, dur);
      osc.connect(f); f.connect(g); g.connect(dest); osc.start(when); osc.stop(when + dur + 0.02);
      break;
    }
  }
}
