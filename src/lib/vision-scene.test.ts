import { describe, expect, it } from 'vitest';
import { enrollFromSpeech, parseScene } from './vision-scene';

describe('parseScene', () => {
  it('extracts objects and persons from json', () => {
    const s = parseScene('{"reply":"Mug on desk.","objects":["mug"],"persons":[{"label":"unknown","confidence":"med"}]}', 'x');
    expect(s.objects).toEqual(['mug']);
    expect(s.persons[0].label).toBe('unknown');
  });
});

describe('enrollFromSpeech', () => {
  it('learns a name from speech', () => {
    expect(enrollFromSpeech('this is Amina')).toEqual({ name: 'Amina', kind: 'object' });
    expect(enrollFromSpeech('this is me')).toMatchObject({ name: 'me', kind: 'person' });
  });
});
