/** Shared lane roster for VICE DESK — every model + agent, paneled separately.
 *  The agent-console backend owns the config shape; this module turns it into
 *  lanes and carries the per-runtime vice neon. Pure: safe to unit test. */

export type RuntimeId =
  | 'hermes'
  | 'openclaw'
  | 'pi'
  | 'free'
  | 'ollama'
  | 'agent-zero'
  | 'notrack'
  | 'junie'
  | 'crush'
  | 't3';

export type Lane = {
  id: string;
  label: string;
  runtime: RuntimeId;
  agentId?: string;
  provider?: string;
  model?: string;
  /** Launch-only lanes (desktop apps) open out instead of chatting inline. */
  launchOnly?: boolean;
};

export type LaneConfig = {
  runtimes: {
    hermes: { models: Array<{ provider: string; model: string; label: string }> };
    openclaw: { agents: string[] };
    pi: { providers: string[]; models: Record<string, string[]> };
    free: { models: Array<{ id: string; label: string }> };
    ollama: { models: string[] };
    'agent-zero': { note: string };
    notrack: { note: string; configured: boolean };
    junie: { note: string };
    crush: { note: string };
    t3: { note: string; launchOnly: boolean };
  };
};

export const RUNTIME_META: Record<RuntimeId, { tag: string; neon: string }> = {
  hermes: { tag: 'HERMES', neon: '#ffd24a' },
  openclaw: { tag: 'OPENCLAW', neon: '#ff2d78' },
  pi: { tag: 'PI', neon: '#00e5cc' },
  free: { tag: 'FREE API', neon: '#ff5e3a' },
  ollama: { tag: 'OLLAMA', neon: '#d4d4d4' },
  'agent-zero': { tag: 'AGENT ZERO', neon: '#b6ff2e' },
  notrack: { tag: 'NOTRACK', neon: '#ff3b3b' },
  junie: { tag: 'JUNIE', neon: '#ff9f1c' },
  crush: { tag: 'CRUSH', neon: '#38bdf8' },
  t3: { tag: 'T3', neon: '#e8ecf1' },
};

export function buildLanes(config: LaneConfig | null | undefined): Lane[] {
  if (!config?.runtimes) return [];
  const r = config.runtimes;
  const lanes: Lane[] = [];
  for (const [i, m] of (r.hermes?.models || []).entries()) {
    lanes.push({ id: `hermes-${i}`, label: m.label, runtime: 'hermes', provider: m.provider, model: m.model });
  }
  for (const agentId of r.openclaw?.agents || []) {
    lanes.push({ id: `openclaw-${agentId}`, label: `OPENCLAW · ${agentId}`, runtime: 'openclaw', agentId });
  }
  for (const provider of r.pi?.providers || []) {
    for (const model of r.pi?.models?.[provider] || []) {
      lanes.push({ id: `pi-${provider}-${model}`, label: `PI · ${provider}/${model}`, runtime: 'pi', provider, model });
    }
  }
  for (const m of r.free?.models || []) {
    lanes.push({ id: `free-${m.id}`, label: m.label, runtime: 'free', model: m.id });
  }
  for (const tag of r.ollama?.models || []) {
    lanes.push({ id: `ollama-${tag}`, label: `OLLAMA · ${tag}`, runtime: 'ollama', model: tag });
  }
  lanes.push({ id: 'agent-zero', label: 'AGENT ZERO · active preset', runtime: 'agent-zero' });
  lanes.push({ id: 'junie', label: 'JUNIE · one-shot code agent', runtime: 'junie' });
  lanes.push({ id: 'crush', label: 'CRUSH · default model', runtime: 'crush' });
  if (r.t3) lanes.push({ id: 't3', label: 'T3 · desktop workspace', runtime: 't3', launchOnly: true });
  if (r.notrack?.configured) lanes.push({ id: 'notrack', label: `NOTRACK · ${r.notrack.note}`, runtime: 'notrack' });
  return lanes;
}
