import path from 'node:path';

export type IntegrationKind = 'skill' | 'plugin' | 'mcp';
export type IntegrationStatus = 'pending' | 'approved' | 'disabled';

export type MasaIntegration = {
  id: string;
  name: string;
  kind: IntegrationKind;
  source: string;
  description: string;
  status: IntegrationStatus;
  addedAt: string;
  command?: string;
  envKeys?: string[];
};

export const INTEGRATIONS_FILE = path.join(process.cwd(), 'data', 'masa-integrations.json');

export const BUILTIN_INTEGRATIONS: MasaIntegration[] = [
  {
    id: 'hermes-robonaut',
    name: 'Hermes Robonaut skills',
    kind: 'skill',
    source: '/home/kingmlb/.hermes/profiles/robonaut/skills',
    description: 'Read-only visibility into the active Hermes skill registry.',
    status: 'approved',
    addedAt: new Date(0).toISOString(),
  },
  {
    id: 'mcp-sse-template',
    name: 'MCP server (HTTP/SSE)',
    kind: 'mcp',
    source: 'https://your-mcp-server.example/sse',
    description: 'Template for an explicitly approved remote MCP endpoint.',
    status: 'pending',
    addedAt: new Date(0).toISOString(),
  },
  {
    id: 'kaligpt-source',
    name: 'KaliGPT',
    kind: 'plugin',
    source: '/home/kingmlb/MASA-tools/kaligpt',
    description: 'Downloaded KaliGPT agent source available for explicit MASA integration.',
    status: 'pending',
    addedAt: new Date(0).toISOString(),
  },
  {
    id: 'mythos-agent-source',
    name: 'Mythos Agent',
    kind: 'plugin',
    source: '/home/kingmlb/MASA-tools/mythos-agent',
    description: 'Downloaded Mythos Agent source available for explicit MASA integration.',
    status: 'pending',
    addedAt: new Date(0).toISOString(),
  },
  {
    id: 'fable-source',
    name: 'Claude Fable 5 research source',
    kind: 'skill',
    source: '/home/kingmlb/MASA-tools/claude-fable-5',
    description: 'Downloaded Fable research and prompt-analysis source.',
    status: 'approved',
    addedAt: new Date(0).toISOString(),
  },
  {
    id: 'robin-osint-source',
    name: 'Robin OSINT',
    kind: 'plugin',
    source: '/home/kingmlb/MASA-tools/robin',
    description: 'Downloaded Robin OSINT source available for explicit MASA integration.',
    status: 'pending',
    addedAt: new Date(0).toISOString(),
  },
  {
    id: 'hexstrike-source',
    name: 'HexStrike AI',
    kind: 'mcp',
    source: '/home/kingmlb/.hermes/profiles/robonaut/skills/hexstrike-ai-master',
    description: 'HexStrike AI MCP and reconnaissance source wired into the MASA integration registry.',
    status: 'approved',
    addedAt: new Date(0).toISOString(),
  },
  {
    id: 'hydra-source',
    name: 'THC Hydra',
    kind: 'plugin',
    source: '/home/kingmlb/.hermes/profiles/robonaut/skills/thc-hydra-master',
    description: 'THC Hydra source wired into the MASA integration registry.',
    status: 'approved',
    addedAt: new Date(0).toISOString(),
  },
];

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function normalizeIntegration(input: Partial<MasaIntegration>): MasaIntegration {
  const name = input.name?.trim();
  const source = input.source?.trim();
  if (!name || name.length > 120) throw new Error('A name up to 120 characters is required');
  if (!source || source.length > 500) throw new Error('A source up to 500 characters is required');
  if (input.kind !== 'skill' && input.kind !== 'plugin' && input.kind !== 'mcp') throw new Error('Invalid integration kind');
  if (input.kind === 'mcp' && !isHttpUrl(source)) throw new Error('MCP sources must use an HTTP(S) URL');
  if (input.kind !== 'mcp' && isHttpUrl(source) === false && !source.startsWith('/') && !source.startsWith('git@')) {
    throw new Error('Skills and plugins must use a local path or repository URL');
  }
  return {
    id: input.id || `${input.kind}-${crypto.randomUUID()}`,
    name,
    kind: input.kind,
    source,
    description: input.description?.trim().slice(0, 500) || 'No description supplied.',
    status: input.status === 'approved' || input.status === 'disabled' ? input.status : 'pending',
    addedAt: input.addedAt || new Date().toISOString(),
    ...(input.command?.trim() ? { command: input.command.trim().slice(0, 300) } : {}),
    ...(input.envKeys?.length ? { envKeys: input.envKeys.slice(0, 20) } : {}),
  };
}
