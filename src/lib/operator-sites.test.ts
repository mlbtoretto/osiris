import { describe, expect, it } from 'vitest';
import { ALL_FILES } from './file-inventory';
import { inventoryCoverage, OPERATOR_SITES, allWiredFiles } from './operator-sites';

describe('literal all-files wiring', () => {
  it('covers every inventory id on at least one site', () => {
    const cov = inventoryCoverage();
    expect(cov.missing).toEqual([]);
    expect(cov.wired).toBe(cov.total);
    expect(cov.total).toBe(ALL_FILES.length);
    expect(ALL_FILES.length).toBeGreaterThan(40);
  });

  it('puts ALL FILES vault on the map with the full inventory', () => {
    const vault = OPERATOR_SITES.find(s => s.id === 'vault-all');
    expect(vault).toBeTruthy();
    expect(vault!.files.length).toBe(ALL_FILES.length);
    expect(OPERATOR_SITES.some(s => s.id === 'storm-seattle')).toBe(true);
    expect(allWiredFiles().length).toBe(ALL_FILES.length);
  });
});
