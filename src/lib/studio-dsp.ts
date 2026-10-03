/** Pure studio helpers. No Web Audio globals, so they run under vitest. */

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const dbToGain = (db: number) => Math.pow(10, db / 20);
export const gainToDb = (g: number) => (g <= 0.00001 ? -100 : 20 * Math.log10(g));

/** Beats-per-minute to seconds per beat, clamped to a playable range. */
export const beatSeconds = (bpm: number) => 60 / clamp(bpm, 30, 300);

/** Min/max envelope per bucket, for drawing a waveform without holding every sample on screen. */
export function computePeaks(channel: Float32Array, buckets: number): Float32Array {
  const out = new Float32Array(Math.max(1, buckets) * 2);
  const size = Math.max(1, Math.floor(channel.length / Math.max(1, buckets)));
  for (let b = 0; b < buckets; b++) {
    let lo = 0;
    let hi = 0;
    const start = b * size;
    const end = Math.min(channel.length, start + size);
    for (let i = start; i < end; i++) {
      const s = channel[i];
      if (s < lo) lo = s;
      if (s > hi) hi = s;
    }
    out[b * 2] = lo;
    out[b * 2 + 1] = hi;
  }
  return out;
}

/** Interleave channels and encode 16-bit PCM WAV. TPDF dither keeps quiet tails from truncating to steps. */
export function encodeWav(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  const numCh = Math.max(1, channels.length);
  const frames = channels[0]?.length ?? 0;
  const bytes = 44 + frames * numCh * 2;
  const buf = new ArrayBuffer(bytes);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, numCh, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * numCh * 2, true);
  v.setUint16(32, numCh * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, frames * numCh * 2, true);
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < numCh; c++) {
      const dither = (Math.random() - Math.random()) / 32768;
      const s = clamp((channels[c]?.[i] ?? 0) + dither, -1, 1);
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return buf;
}

/** Decaying-noise impulse response for a ConvolverNode. */
export function reverbImpulse(sampleRate: number, seconds = 1.8, decay = 2.6): Float32Array[] {
  const len = Math.floor(sampleRate * seconds);
  return [0, 1].map(() => {
    const ch = new Float32Array(len);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    return ch;
  });
}

/** Pick a MediaRecorder mime the current browser can produce. Safari gives audio/mp4, Chrome/Firefox give webm/ogg. */
export function pickRecorderMime(isSupported: (t: string) => boolean): string | undefined {
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(isSupported);
}

/** Track ids that should sound: solo wins over everything, otherwise anything not muted. */
export function audibleTracks(tracks: Array<{ id: string; mute: boolean; solo: boolean }>): Set<string> {
  const anySolo = tracks.some(t => t.solo);
  return new Set(tracks.filter(t => (anySolo ? t.solo : !t.mute)).map(t => t.id));
}

export const formatTime = (sec: number) => {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

// ---- step sequencer helpers ----
export const midiToFreq = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
/** One 16th note. */
export const stepSeconds = (bpm: number) => beatSeconds(bpm) / 4;
/** Swing delays every odd 16th by up to a third of a step. amount 0..1. */
export const swingOffset = (step: number, bpm: number, amount: number) => (step % 2 === 1 ? stepSeconds(bpm) * clamp(amount, 0, 1) * 0.33 : 0);
