import path from 'node:path';
import { stat } from 'node:fs/promises';

export type MasaAgent = {
  id: string;
  name: string;
  role: string;
  source: string;
  interface: 'cli' | 'mcp' | 'library' | 'prompt';
  callable: boolean;
  status: 'available' | 'missing';
  command?: string;
};

const HERMES = '/home/kingmlb/.hermes/profiles/robonaut/skills';
const TOOLS = '/home/kingmlb/MASA-tools';

const definitions: Omit<MasaAgent, 'status'>[] = [
  { id: 'hermes', name: 'Hermes Robonaut', role: 'Primary local agent runtime and skill router', source: '/home/kingmlb/.hermes/profiles/robonaut', interface: 'cli', callable: true, command: '/home/kingmlb/.local/bin/hermes' },
  { id: 'kaligpt', name: 'KaliGPT', role: 'Kali/Linux security assistant', source: path.join(TOOLS, 'kaligpt'), interface: 'cli', callable: true, command: 'python3 -m agents' },
  { id: 'mythos', name: 'Mythos Agent', role: 'AI code review and security analysis', source: path.join(TOOLS, 'mythos-agent'), interface: 'cli', callable: true, command: 'node dist/cli/index.js' },
  { id: 'robin-osint', name: 'Robin OSINT', role: 'OSINT investigation and reporting', source: path.join(TOOLS, 'robin'), interface: 'library', callable: true, command: 'streamlit run ui.py' },
  { id: 'hexstrike', name: 'HexStrike AI', role: 'Reconnaissance MCP tooling', source: path.join(HERMES, 'hexstrike-ai-master'), interface: 'mcp', callable: true, command: 'python3 hexstrike_server.py --port 8888' },
  { id: 'hydra', name: 'THC Hydra', role: 'Credential-audit tool', source: path.join(HERMES, 'thc-hydra-master'), interface: 'cli', callable: true, command: 'hydra' },
  { id: 'fable', name: 'Claude Fable 5', role: 'Prompt and reasoning reference', source: path.join(TOOLS, 'claude-fable-5'), interface: 'prompt', callable: true },
  { id: 'openclaw', name: 'OpenClaw', role: 'Local workspace agent', source: '/home/kingmlb/.openclaw', interface: 'cli', callable: true, command: '/usr/bin/openclaw' },
  { id: 'pi', name: 'Pi', role: 'Local agent runtime', source: '/home/kingmlb/.pi', interface: 'cli', callable: true, command: '/home/kingmlb/.local/share/mise/installs/pi/latest/pi/pi' },
  { id: 'agent-zero', name: 'Agent Zero', role: 'General-purpose local agent', source: path.join(HERMES, 'autonomous-ai-agents'), interface: 'library', callable: true },
  { id: 'grok', name: 'Grok', role: 'xAI Grok on this machine', source: '/home/kingmlb/.grok', interface: 'cli', callable: true, command: 'grok' },
  { id: 'opencode', name: 'OpenCode', role: 'Local coding agent', source: '/home/kingmlb/.config/opencode', interface: 'cli', callable: true, command: 'opencode' },
  { id: 'lmstudio', name: 'LM Studio', role: 'Local model server', source: '/home/kingmlb/.lmstudio', interface: 'cli', callable: true, command: 'lms' },
  { id: 'ollama', name: 'Ollama', role: 'Local model runtime', source: '/home/kingmlb/.ollama', interface: 'cli', callable: true, command: 'ollama' },
  { id: 'droid', name: 'Droid', role: 'Factory coding agent', source: '/home/kingmlb/.local/bin/droid', interface: 'cli', callable: true, command: 'droid' },
  { id: 'codex', name: 'Codex', role: 'Codex CLI on this machine', source: '/home/kingmlb/.codex', interface: 'cli', callable: true, command: 'codex' },
  { id: 'cursor', name: 'Cursor', role: 'Cursor agent home', source: '/home/kingmlb/.cursor', interface: 'cli', callable: true },
];

export async function masaAgents(): Promise<MasaAgent[]> {
  return Promise.all(definitions.map(async agent => ({
    ...agent,
    status: await stat(agent.source).then(() => 'available' as const).catch(() => 'missing' as const),
  })));
}
