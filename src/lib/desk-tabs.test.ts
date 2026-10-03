import { describe, it, expect } from 'vitest';
import { DESK_TABS } from './desk-tabs';

describe('DESK_TABS', () => {
  it('keeps one accessible label per desk tab', () => {
    expect(DESK_TABS).toHaveLength(13);
    const ids = DESK_TABS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tab of DESK_TABS) {
      expect(tab.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers every desk surface exactly once', () => {
    expect(DESK_TABS.map(t => t.id).sort()).toEqual(
      ['agents', 'chrome', 'graph', 'integrations', 'life', 'notes', 'oversight', 'providers', 'studio', 'tools', 'traces', 'tv', 'voice'],
    );
  });
});
