/** Single source of truth for the UnifiedDesk tab rail.
 *  Tabs render icon-only (title + aria-label carry the name), so the desk
 *  shows tools/links without word labels. */

export const DESK_TABS = [
  { id: 'graph', label: 'Graph' },
  { id: 'notes', label: 'Notes' },
  { id: 'voice', label: 'Voice' },
  { id: 'tools', label: 'Tools' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'life', label: 'Life' },
  { id: 'traces', label: 'Traces' },
  { id: 'studio', label: 'Studio' },
  { id: 'tv', label: 'TV' },
  { id: 'providers', label: 'Providers' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'oversight', label: 'Oversight' },
  { id: 'agents', label: 'Agents' },
] as const;

export type DeskTabId = (typeof DESK_TABS)[number]['id'];
