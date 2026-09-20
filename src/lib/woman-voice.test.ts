import { describe, expect, it } from 'vitest';
import { pickWomanVoice } from './woman-voice';

describe('pickWomanVoice', () => {
  it('is safe on the server', () => {
    expect(pickWomanVoice()).toBeUndefined();
  });
});
