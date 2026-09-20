import { OPERATOR_SITES } from './operator-sites';
import { PLANETS, PLANET_VAULTS } from './planets';
import type { ForensicNote } from './forensic-notes';
import { SURFACE_TOOLS } from './internet-surface';

export { UNIFIED_TOOLS, SURFACE_TOOLS, INTERNET_LAYERS, ROBIN_ENGINES } from './internet-surface';

export type GraphNode = {
  id: string;
  name: string;
  group: 'agent' | 'site' | 'tool' | 'planet' | 'note';
  color: string;
};

export type GraphLink = {
  source: string;
  target: string;
  kind: string;
};

export function buildCorrelationGraph(notes: ForensicNote[] = []) {
  const nodes: GraphNode[] = [
    { id: 'langsmith', name: 'LangSmith', group: 'tool', color: '#d4af37' },
  ];
  const links: GraphLink[] = [];

  for (const planet of PLANETS) {
    nodes.push({ id: `planet:${planet.id}`, name: planet.name, group: 'planet', color: planet.accent });
    links.push({ source: 'langsmith', target: `planet:${planet.id}`, kind: 'trace' });
  }

  for (const site of OPERATOR_SITES) {
    nodes.push({ id: `site:${site.id}`, name: site.name, group: site.kind === 'agent' || site.kind === 'storm' ? 'agent' : 'site', color: site.kind === 'farm' ? '#14F195' : site.kind === 'corp' ? '#d4af37' : site.kind === 'storm' ? '#ff6b35' : site.kind === 'archive' ? '#b388ff' : '#00e5ff' });
    links.push({ source: 'planet:earth', target: `site:${site.id}`, kind: 'hosts' });
    for (const file of site.files) {
      const tid = `tool:${file.name}`;
      if (!nodes.some(n => n.id === tid)) {
        nodes.push({ id: tid, name: file.name, group: 'tool', color: '#9b978e' });
      }
      links.push({ source: `site:${site.id}`, target: tid, kind: 'file' });
    }
  }

  for (const tool of SURFACE_TOOLS) {
    const id = `tool:${tool.id}`;
    if (!nodes.some(n => n.id === id)) {
      nodes.push({ id, name: tool.name, group: 'tool', color: tool.use === 'commercial' ? '#ff9500' : '#00e5ff' });
    }
    links.push({ source: `planet:${tool.planet}`, target: id, kind: tool.layer });
    links.push({ source: 'langsmith', target: id, kind: 'trace' });
  }

  for (const [planetId, vaults] of Object.entries(PLANET_VAULTS)) {
    for (const vault of vaults) {
      const id = `vault:${vault.id}`;
      nodes.push({ id, name: vault.name, group: 'tool', color: '#b388ff' });
      links.push({ source: `planet:${planetId}`, target: id, kind: 'vault' });
    }
  }

  for (const note of notes) {
    const id = `note:${note.id}`;
    nodes.push({ id, name: note.title, group: 'note', color: '#f0d060' });
    links.push({ source: 'langsmith', target: id, kind: 'note' });
    if (note.agent) links.push({ source: id, target: `site:${note.agent}`, kind: 'agent' });
    if (note.planet) links.push({ source: id, target: `planet:${note.planet}`, kind: 'world' });
  }

  return { nodes, links };
}

export type TraceEvent = {
  id: string;
  ts: string;
  agent: string;
  planet: string;
  tool: string;
  input: string;
  output: string;
};
