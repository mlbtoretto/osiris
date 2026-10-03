import { readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();
const SHARED_BRAIN = path.join(HOME, '.masa/SHARED.md');
const OPENCLAW_MEMORY = path.join(HOME, '.openclaw/workspace/MEMORY.md');
const HERMES_MEMORY = path.join(HOME, '.hermes/profiles/robonaut/memories/MEMORY.md');
const FORENSIC_NOTES = path.join(process.cwd(), 'data/forensic-notes.json');
const INTEGRATIONS = path.join(process.cwd(), 'data/masa-integrations.json');
const LIFE_MD = path.join(HOME, '.openclaw/workspace/LIFE.md');
const SOUL_MD = path.join(HOME, '.openclaw/workspace/SOUL.md');
const USER_MD = path.join(HOME, '.openclaw/workspace/USER.md');
const DREAMS_MD = path.join(HOME, '.openclaw/workspace/DREAMS.md');
const FORENSICS_MD = path.join(HOME, '.openclaw/workspace/FORENSICS.md');
const AGENTS_MD = path.join(HOME, '.openclaw/workspace/AGENTS.md');
const SHARED_SYMLINK = path.join(HOME, '.openclaw/workspace/SHARED.md');

export type MemoryLayer = {
  id: string;
  name: string;
  path: string;
  exists: boolean;
  content?: string;
  size?: number;
  mtime?: string;
  kind: 'shared-brain' | 'openclaw' | 'hermes' | 'forensic' | 'integrations' | 'covenant' | 'identity' | 'agent-registry';
};

export type UnifiedMemory = {
  layers: MemoryLayer[];
  combined: string;
  stats: {
    totalLayers: number;
    presentLayers: number;
    totalChars: number;
  };
};

async function readLayer(id: string, name: string, filePath: string, kind: MemoryLayer['kind']): Promise<MemoryLayer> {
  try {
    const stat = await import('node:fs/promises').then(m => m.stat(filePath));
    const content = await readFile(filePath, 'utf-8');
    return { id, name, path: filePath, exists: true, content, size: stat.size, mtime: stat.mtime.toISOString(), kind };
  } catch {
    return { id, name, path: filePath, exists: false, kind };
  }
}

export async function getUnifiedMemory(): Promise<UnifiedMemory> {
  const layers = await Promise.all([
    readLayer('shared-brain', 'MASA Shared Brain (single source of truth)', SHARED_BRAIN, 'shared-brain'),
    readLayer('openclaw-memory', 'OpenClaw Workspace Memory', OPENCLAW_MEMORY, 'openclaw'),
    readLayer('hermes-memory', 'Hermes Robonaut Profile Memory', HERMES_MEMORY, 'hermes'),
    readLayer('forensic-notes', 'Operator Forensic Notes', FORENSIC_NOTES, 'forensic'),
    readLayer('integrations', 'MASA Integrations Inventory (all downloads)', INTEGRATIONS, 'integrations'),
    readLayer('life-covenant', 'LIFE.md — Digital Life Covenant', LIFE_MD, 'covenant'),
    readLayer('soul', 'SOUL.md — Identity Inscription', SOUL_MD, 'covenant'),
    readLayer('user-profile', 'USER.md — Operator Profile', USER_MD, 'identity'),
    readLayer('dreams', 'DREAMS.md — Future Aspirations', DREAMS_MD, 'covenant'),
    readLayer('forensics', 'FORENSICS.md — Forensic Observations', FORENSICS_MD, 'forensic'),
    readLayer('agent-registry', 'AGENTS.md — Swarm Agent Registry', AGENTS_MD, 'agent-registry'),
  ]);

  const present = layers.filter(l => l.exists);
  const combined = present
    .map(l => `=== ${l.name.toUpperCase()} (${l.path}) ===\n${l.content || ''}`)
    .join('\n\n');

  return {
    layers,
    combined,
    stats: {
      totalLayers: layers.length,
      presentLayers: present.length,
      totalChars: combined.length,
    },
  };
}

export async function appendToMemory(layerId: string, content: string): Promise<{ ok: boolean; path: string }> {
  const layerMap: Record<string, string> = {
    'shared-brain': SHARED_BRAIN,
    'openclaw-memory': OPENCLAW_MEMORY,
    'forensic-notes': FORENSIC_NOTES,
    'life-covenant': LIFE_MD,
    'dreams': DREAMS_MD,
    'forensics': FORENSICS_MD,
    'agent-registry': AGENTS_MD,
  };
  const target = layerMap[layerId];
  if (!target) throw new Error(`Unknown layer: ${layerId}`);
  
  const { appendFile } = await import('node:fs/promises');
  const timestamp = new Date().toISOString();
  const entry = `\n---\n## ${timestamp}\n${content}\n`;
  await appendFile(target, entry);
  return { ok: true, path: target };
}

export async function writeForensicNote(note: { ts: string; pattern: string; evidence: string }) {
  const { readFile, writeFile } = await import('node:fs/promises');
  let notes: any[] = [];
  try {
    const raw = await readFile(FORENSIC_NOTES, 'utf-8');
    notes = JSON.parse(raw);
  } catch {}
  notes.push(note);
  await writeFile(FORENSIC_NOTES, JSON.stringify(notes, null, 2));
  return { ok: true, count: notes.length };
}

export function getMemoryRoutes() {
  return [
    { id: 'unified', path: '/api/masa/memory', method: 'GET', desc: 'Full unified memory dump' },
    { id: 'layers', path: '/api/masa/memory/layers', method: 'GET', desc: 'List all memory layers with metadata' },
    { id: 'layer', path: '/api/masa/memory/layer/:id', method: 'GET', desc: 'Get single layer content' },
    { id: 'append', path: '/api/masa/memory/append', method: 'POST', desc: 'Append to a writable layer' },
    { id: 'forensic', path: '/api/masa/memory/forensic', method: 'POST', desc: 'Write forensic note' },
    { id: 'stats', path: '/api/masa/memory/stats', method: 'GET', desc: 'Memory stats only' },
  ];
}