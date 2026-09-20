/** 1,000-model swarm. One commander. One voice. One vision. */

export const SWARM_SIZE = 1000;

const FAMILIES = [
  'grok-4.6', 'gemini-2.5-flash', 'gemini-2.0-flash', 'hermes-4', 'llama-3.3',
  'llama-3.2', 'qwen-2.5', 'qwen-3', 'mistral', 'mixtral',
  'deepseek-v3', 'deepseek-flash', 'gemma-3', 'gpt-5.2', 'claude-sonnet',
  'command-r', 'phi-4', 'yi-large', 'nemotron', 'solar',
  'dbrx', 'jamba', 'olmo', 'falcon', 'arctic',
  'glm-4.7-flash', 'kimi-k3', 'cerebras-llama', 'horus-local', 'openrouter-free',
] as const;

export type SwarmCell = {
  id: number;
  name: string;
  family: string;
  company: number;
};

export function swarmCell(n: number): SwarmCell {
  const i = ((n - 1) % FAMILIES.length + FAMILIES.length) % FAMILIES.length;
  const family = FAMILIES[i];
  return {
    id: n,
    name: `${family}/${String(n).padStart(4, '0')}`,
    family,
    company: Math.ceil(n / 125),
  };
}

export function swarmRoster(limit = SWARM_SIZE): SwarmCell[] {
  const out: SwarmCell[] = [];
  for (let n = 1; n <= limit; n++) out.push(swarmCell(n));
  return out;
}

export const COMPANIES = [
  { id: 1, name: 'ALPHA', role: 'surface / DNS' },
  { id: 2, name: 'BRAVO', role: 'identity / social' },
  { id: 3, name: 'CHARLIE', role: 'IoT / Shodan' },
  { id: 4, name: 'DELTA', role: 'Robin dark-web watch' },
  { id: 5, name: 'ECHO', role: 'geo / CCTV / ADS-B' },
  { id: 6, name: 'FOXTROT', role: 'chain / messaging' },
  { id: 7, name: 'GOLF', role: 'threat / ATT&CK' },
  { id: 8, name: 'HOTEL', role: 'link / Exif / Chrome' },
] as const;
