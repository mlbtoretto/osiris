import { describe, expect, it } from 'vitest';
import { audibleTracks, beatSeconds, computePeaks, dbToGain, encodeWav, formatTime, gainToDb, pickRecorderMime, reverbImpulse } from './studio-dsp';

describe('studio-dsp', () => {
  it('converts dB and gain both ways', () => {
    expect(dbToGain(0)).toBeCloseTo(1);
    expect(dbToGain(-6)).toBeCloseTo(0.501, 2);
    expect(gainToDb(dbToGain(-12))).toBeCloseTo(-12);
    expect(gainToDb(0)).toBe(-100);
  });
  it('clamps tempo', () => {
    expect(beatSeconds(120)).toBeCloseTo(0.5);
    expect(beatSeconds(5)).toBeCloseTo(2);
    expect(beatSeconds(9999)).toBeCloseTo(0.2);
  });
  it('finds min/max peaks per bucket', () => {
    const p = computePeaks(new Float32Array([0, 0.5, -0.25, 0, 0, -1, 0.75, 0]), 2);
    expect(Array.from(p)).toEqual([-0.25, 0.5, -1, 0.75]);
  });
  it('writes a valid 16-bit stereo WAV header and size', () => {
    const wav = encodeWav([new Float32Array(100).fill(0.5), new Float32Array(100).fill(-0.5)], 44100);
    const v = new DataView(wav);
    expect(wav.byteLength).toBe(44 + 100 * 2 * 2);
    expect(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3))).toBe('RIFF');
    expect(v.getUint16(22, true)).toBe(2);
    expect(v.getUint32(24, true)).toBe(44100);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getInt16(44, true)).toBeGreaterThan(16000);
    expect(v.getInt16(46, true)).toBeLessThan(-16000);
  });
  it('clips instead of wrapping on overs', () => {
    const v = new DataView(encodeWav([new Float32Array([4, -4])], 8000));
    expect(v.getInt16(44, true)).toBe(32767);
    expect(v.getInt16(46, true)).toBe(-32768);
  });
  it('builds a decaying stereo impulse', () => {
    const ir = reverbImpulse(8000, 1, 2);
    expect(ir).toHaveLength(2);
    expect(ir[0]).toHaveLength(8000);
    const head = ir[0].slice(0, 400).reduce((a, x) => a + Math.abs(x), 0);
    const tail = ir[0].slice(7600).reduce((a, x) => a + Math.abs(x), 0);
    expect(head).toBeGreaterThan(tail * 5);
  });
  it('picks a supported recorder mime, mp4 for Safari', () => {
    expect(pickRecorderMime(t => t === 'audio/mp4')).toBe('audio/mp4');
    expect(pickRecorderMime(() => false)).toBeUndefined();
  });
  it('lets solo override mute, and mute silence otherwise', () => {
    const t = [{ id: 'a', mute: false, solo: false }, { id: 'b', mute: true, solo: false }, { id: 'c', mute: true, solo: true }];
    expect([...audibleTracks(t)]).toEqual(['c']);
    expect([...audibleTracks(t.map(x => ({ ...x, solo: false })))]).toEqual(['a']);
  });
  it('formats time', () => { expect(formatTime(75.34)).toBe('01:15.3'); expect(formatTime(-2)).toBe('00:00.0'); });
});

import { midiToFreq, stepSeconds, swingOffset } from './studio-dsp';
describe('sequencer helpers', () => {
  it('maps MIDI notes to Hz', () => { expect(midiToFreq(69)).toBeCloseTo(440); expect(midiToFreq(57)).toBeCloseTo(220); });
  it('sixteenth-note length follows tempo', () => { expect(stepSeconds(120)).toBeCloseTo(0.125); });
  it('swings only odd steps', () => {
    expect(swingOffset(0, 120, 1)).toBe(0);
    expect(swingOffset(1, 120, 1)).toBeCloseTo(0.125 * 0.33);
    expect(swingOffset(1, 120, 0)).toBe(0);
  });
});
