import path from 'node:path';
import { stat } from 'node:fs/promises';
import { ALL_FILES } from '@/lib/file-inventory';

const ROOT = process.cwd();
const HERMES = '/home/kingmlb/.hermes/profiles/robonaut';
const TOOLS = '/home/kingmlb/MASA-tools';

export type FoundationResource = {
  id: string;
  name: string;
  kind: 'runtime' | 'memory' | 'registry' | 'integration' | 'observability';
  path?: string;
  route?: string;
  present: boolean;
  mode: 'read-only' | 'write-through' | 'governed';
};

async function exists(target: string) {
  return stat(target).then(() => true).catch(() => false);
}

export async function foundationResources(): Promise<FoundationResource[]> {
  const resources: Array<Omit<FoundationResource, 'present'>> = [
    { id: 'masa-runtime', name: 'MASA / MASA runtime', kind: 'runtime', path: ROOT, route: '/api/ai/converse', mode: 'governed' },
    { id: 'masa-agent-router', name: 'HORUS-1 agent router', kind: 'runtime', path: path.join(ROOT, 'src/lib/masa-agents.ts'), route: '/api/masa/agents', mode: 'governed' },
    { id: 'hermes-profile', name: 'Hermes Robonaut profile', kind: 'runtime', path: HERMES, route: '/api/masa/intelligence', mode: 'read-only' },
    { id: 'hermes-config', name: 'Hermes model and provider config', kind: 'registry', path: path.join(HERMES, 'config.yaml'), mode: 'read-only' },
    { id: 'hermes-skills', name: 'Hermes skills registry', kind: 'integration', path: path.join(HERMES, 'skills'), mode: 'governed' },
    { id: 'kaligpt-source', name: 'KaliGPT agent source', kind: 'integration', path: path.join(TOOLS, 'kaligpt'), mode: 'governed' },
    { id: 'mythos-agent-source', name: 'Mythos Agent source', kind: 'integration', path: path.join(TOOLS, 'mythos-agent'), mode: 'governed' },
    { id: 'fable-source', name: 'Claude Fable 5 research source', kind: 'integration', path: path.join(TOOLS, 'claude-fable-5'), mode: 'read-only' },
    { id: 'robin-osint-source', name: 'Robin OSINT source', kind: 'integration', path: path.join(TOOLS, 'robin'), mode: 'governed' },
    { id: 'hexstrike-source', name: 'HexStrike AI source', kind: 'integration', path: path.join(HERMES, 'skills', 'hexstrike-ai-master'), mode: 'governed' },
    { id: 'hydra-source', name: 'THC Hydra source', kind: 'integration', path: path.join(HERMES, 'skills', 'thc-hydra-master'), mode: 'governed' },
    { id: 'model-catalog', name: 'MASA provider and model catalog', kind: 'registry', path: path.join(ROOT, 'src/lib/masa-providers.ts'), route: '/api/masa/providers', mode: 'read-only' },
    { id: 'local-traces', name: 'Local LangSmith-compatible traces', kind: 'observability', path: path.join(ROOT, 'data/langsmith-local.jsonl'), mode: 'write-through' },
    { id: 'local-memory', name: 'Operator memory and forensic notes', kind: 'memory', path: path.join(ROOT, 'data/forensic-notes.json'), route: '/api/forensics/notes', mode: 'write-through' },
    { id: 'integration-registry', name: 'Skills, plugins, and MCP registry', kind: 'integration', path: path.join(ROOT, 'data/masa-integrations.json'), route: '/api/masa/integrations', mode: 'governed' },
    { id: 'human-oversight', name: 'Human oversight queue', kind: 'observability', path: path.join(ROOT, 'data/masa-oversight.json'), route: '/api/masa/oversight', mode: 'governed' },
    { id: 'file-inventory', name: 'Operator file and project inventory', kind: 'registry', path: path.join(ROOT, 'src/lib/file-inventory.ts'), route: '/api/operator/files', mode: 'read-only' },
  ];
  return Promise.all(resources.map(async resource => ({ ...resource, present: await exists(resource.path || resource.route || '') })));
}

export async function foundationSnapshot() {
  const resources = await foundationResources();
  return {
    name: 'MASA Intelligence Foundation',
    callsign: 'HORUS-1',
    resources,
    inventoryEntries: ALL_FILES.length,
    updatedAt: new Date().toISOString(),
  };
}
