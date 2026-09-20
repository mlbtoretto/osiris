/**
 * Literal inventory of every operator file / project / vendor / home rack.
 * Paths are absolute on this machine. The live API verifies existence.
 */

export type InventoryKind = 'project' | 'vendor' | 'data' | 'home' | 'download' | 'lab' | 'url';

export type InventoryFile = {
  id: string;
  name: string;
  path: string;
  kind: InventoryKind;
  /** Optional live service URL (War Room, etc.). */
  href?: string;
};

const P = '/home/kingmlb/Projects';
const V = `${P}/lab/vendor`;
const D = '/home/kingmlb/Downloads';
const H = '/home/kingmlb';

/** Literally all racks. Add here when new trees land. */
export const ALL_FILES: InventoryFile[] = [
  // ── Projects ──
  { id: 'proj-osiris', name: 'Osiris / MASA IA', path: `${P}/osiris`, kind: 'project' },
  { id: 'proj-t3mp3st', name: 'T3MP3ST', path: `${P}/T3MP3ST`, kind: 'project', href: 'http://127.0.0.1:3333/ui/' },
  { id: 'proj-agent-zero', name: 'Agent Zero', path: `${P}/agent-zero`, kind: 'project' },
  { id: 'proj-hexstrike', name: 'HexStrike AI', path: `${P}/hexstrike-ai`, kind: 'project' },
  { id: 'proj-mcp-hydra', name: 'MCP Hydra', path: `${P}/mcp-hydra`, kind: 'project' },
  { id: 'proj-penligent', name: 'Penligent', path: `${P}/penligent`, kind: 'project' },
  { id: 'proj-robin', name: 'Robin', path: `${P}/robin`, kind: 'project' },
  { id: 'proj-lab', name: 'Lab root', path: `${P}/lab`, kind: 'lab' },
  { id: 'proj-lab-src', name: 'Lab src', path: `${P}/lab/src`, kind: 'lab' },
  { id: 'proj-lab-config', name: 'Lab config', path: `${P}/lab/config`, kind: 'lab' },
  { id: 'proj-lab-readme', name: 'Lab README', path: `${P}/lab/README.md`, kind: 'lab' },

  // ── Osiris data ──
  { id: 'data-forensic', name: 'Forensic notes', path: `${P}/osiris/data/forensic-notes.json`, kind: 'data' },
  { id: 'data-unified', name: 'Unified recreate', path: `${P}/osiris/data/osiris-unified.json`, kind: 'data' },
  { id: 'data-patterns', name: 'Work patterns', path: `${P}/osiris/data/work-patterns.json`, kind: 'data' },

  // ── Vendor (every unpacked tree) ──
  { id: 'vend-earth', name: 'Google Earth Enterprise', path: `${V}/earthenterprise-master`, kind: 'vendor' },
  { id: 'vend-gev', name: "God's Eye View", path: `${V}/gods-eye-view-main`, kind: 'vendor' },
  { id: 'vend-skills', name: 'Skills', path: `${V}/skillss-main`, kind: 'vendor' },
  { id: 'vend-signal', name: 'signal-cli', path: `${V}/signal-cli-master`, kind: 'vendor' },
  { id: 'vend-crypto', name: 'Crypto OpSec Roadmap', path: `${V}/Crypto-OpSec-SelfGuard-RoadMap-main`, kind: 'vendor' },
  { id: 'vend-spacex', name: 'SpaceX API', path: `${V}/SpaceX-API-master`, kind: 'vendor' },
  { id: 'vend-phone', name: 'phoneintel', path: `${V}/phoneintel-main`, kind: 'vendor' },
  { id: 'vend-skip', name: 'skip-trace', path: `${V}/skip-trace-main`, kind: 'vendor' },
  { id: 'vend-mitre', name: 'MITRE ATT&CK', path: `${V}/mitreattack-python-main`, kind: 'vendor' },
  { id: 'vend-cs50', name: 'cs50', path: `${V}/cs50-master`, kind: 'vendor' },
  { id: 'vend-darknet', name: 'darknet-mcp-server', path: `${V}/darknet-mcp-server-main`, kind: 'vendor' },
  { id: 'vend-hackgpt', name: 'HackGpt', path: `${V}/HackGpt-main`, kind: 'vendor' },
  { id: 'vend-omega', name: 'Omegacode CLI', path: `${V}/omegacode-cli-uncensored-AI-main`, kind: 'vendor' },
  { id: 'vend-sparrow', name: 'Sparrow-Hawk CodeArt', path: `${V}/Sparrow-Hawk-CodeArtGenerator-main`, kind: 'vendor' },
  { id: 'vend-prompts', name: 'system_prompts_leaks', path: `${V}/system_prompts_leaks-main`, kind: 'vendor' },
  { id: 'vend-thgtoa', name: 'THGTOA', path: `${V}/thgtoa-main`, kind: 'vendor' },
  { id: 'vend-toolx', name: 'Tool-X', path: `${V}/Tool-X-main`, kind: 'vendor' },
  { id: 'vend-bls', name: 'BLS Bible', path: `${V}/bls-bible-development`, kind: 'vendor' },
  { id: 'vend-fable', name: 'Claude Fable system prompt', path: `${V}/claude-fable-5-system-prompt-clean-main`, kind: 'vendor' },

  // ── Homes / agent racks ──
  { id: 'home-openclaw', name: 'OpenClaw home', path: `${H}/.openclaw`, kind: 'home' },
  { id: 'home-openclaw-ws', name: 'OpenClaw workspace', path: `${H}/.openclaw/workspace`, kind: 'home' },
  { id: 'home-hermes', name: 'Hermes home', path: `${H}/.hermes`, kind: 'home' },
  { id: 'home-grok', name: 'Grok home', path: `${H}/.grok`, kind: 'home' },
  { id: 'home-claude', name: 'Claude home', path: `${H}/.claude`, kind: 'home' },
  { id: 'home-agents', name: 'Agents home', path: `${H}/.agents`, kind: 'home' },
  { id: 'home-work', name: 'Work', path: `${H}/Work`, kind: 'home' },
  { id: 'home-docs', name: 'Documents', path: `${H}/Documents`, kind: 'home' },
  { id: 'home-downloads', name: 'Downloads', path: `${H}/Downloads`, kind: 'home' },

  // ── Download zips (source archives) ──
  { id: 'zip-bls', name: 'bls-bible-development.zip', path: `${D}/bls-bible-development.zip`, kind: 'download' },
  { id: 'zip-fable', name: 'claude-fable-5-system-prompt-clean-main.zip', path: `${D}/claude-fable-5-system-prompt-clean-main.zip`, kind: 'download' },
  { id: 'zip-crypto', name: 'Crypto-OpSec-SelfGuard-RoadMap-main.zip', path: `${D}/Crypto-OpSec-SelfGuard-RoadMap-main.zip`, kind: 'download' },
  { id: 'zip-cs50', name: 'cs50-master.zip', path: `${D}/cs50-master.zip`, kind: 'download' },
  { id: 'zip-darknet', name: 'darknet-mcp-server-main.zip', path: `${D}/darknet-mcp-server-main.zip`, kind: 'download' },
  { id: 'zip-earth', name: 'earthenterprise-master.zip', path: `${D}/earthenterprise-master.zip`, kind: 'download' },
  { id: 'zip-fud', name: 'FUD-master.zip', path: `${D}/FUD-master.zip`, kind: 'download' },
  { id: 'zip-gev', name: 'gods-eye-view-main.zip', path: `${D}/gods-eye-view-main.zip`, kind: 'download' },
  { id: 'zip-hackgpt', name: 'HackGpt-main.zip', path: `${D}/HackGpt-main.zip`, kind: 'download' },
  { id: 'zip-mitre', name: 'mitreattack-python-main.zip', path: `${D}/mitreattack-python-main.zip`, kind: 'download' },
  { id: 'zip-omega', name: 'omegacode-cli-uncensored-AI-main.zip', path: `${D}/omegacode-cli-uncensored-AI-main.zip`, kind: 'download' },
  { id: 'zip-phone', name: 'phoneintel-main.zip', path: `${D}/phoneintel-main.zip`, kind: 'download' },
  { id: 'zip-signal', name: 'signal-cli-master.zip', path: `${D}/signal-cli-master.zip`, kind: 'download' },
  { id: 'zip-skills', name: 'skillss-main.zip', path: `${D}/skillss-main.zip`, kind: 'download' },
  { id: 'zip-skip', name: 'skip-trace-main.zip', path: `${D}/skip-trace-main.zip`, kind: 'download' },
  { id: 'zip-spacex', name: 'SpaceX-API-master.zip', path: `${D}/SpaceX-API-master.zip`, kind: 'download' },
  { id: 'zip-sparrow', name: 'Sparrow-Hawk-CodeArtGenerator-main.zip', path: `${D}/Sparrow-Hawk-CodeArtGenerator-main.zip`, kind: 'download' },
  { id: 'zip-prompts', name: 'system_prompts_leaks-main.zip', path: `${D}/system_prompts_leaks-main.zip`, kind: 'download' },
  { id: 'zip-thgtoa', name: 'thgtoa-main.zip', path: `${D}/thgtoa-main.zip`, kind: 'download' },
  { id: 'zip-toolx', name: 'Tool-X-main.zip', path: `${D}/Tool-X-main.zip`, kind: 'download' },

  // ── Live URLs ──
  { id: 'url-t3-warroom', name: 'T3MP3ST War Room', path: `${P}/T3MP3ST`, kind: 'url', href: 'http://127.0.0.1:3333/ui/' },
  { id: 'url-masa', name: 'MASA Tailscale', path: `${P}/osiris`, kind: 'url', href: 'https://kingmlb-1.sole-sidewinder.ts.net/' },
];

export function fileById(id: string): InventoryFile | undefined {
  return ALL_FILES.find(f => f.id === id);
}

export function filesByIds(ids: string[]): InventoryFile[] {
  return ids.map(fileById).filter((f): f is InventoryFile => Boolean(f));
}

export function allFileIds(): string[] {
  return ALL_FILES.map(f => f.id);
}
