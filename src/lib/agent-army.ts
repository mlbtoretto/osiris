/**
 * Agent army — high-context multi-model fan-in for HORUS-1.
 *
 * Raises completion ceilings on *your* local / keyed endpoints.
 * Does not bypass provider quotas, rate limits, or billing.
 */

import { MODEL_BENCH, TEAM_FREE, type ModelLane } from './free-models';
import { COMPANIES, SWARM_SIZE, swarmRoster } from './swarm';

/** Default completion budget. Override with MASA_MAX_TOKENS / OLLAMA_MAX_TOKENS. */
export const ARMY_MAX_TOKENS = clampTokens(
  Number(process.env.MASA_MAX_TOKENS || process.env.OLLAMA_MAX_TOKENS || 128_000),
);

/** Soft context target for desk / swarm cells (chars ≈ tokens×4 rough). */
export const ARMY_CTX_HINT = clampTokens(
  Number(process.env.MASA_CTX_TOKENS || 200_000),
);

function clampTokens(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 128_000;
  return Math.min(Math.floor(n), 1_000_000);
}

export type ArmyStatus = {
  size: number;
  maxTokens: number;
  ctxHint: number;
  freeLanes: number;
  allLanes: number;
  companies: typeof COMPANIES;
  models: ModelLane[];
  sample: ReturnType<typeof swarmRoster>;
  note: string;
};

export function agentArmyStatus(sample = 24): ArmyStatus {
  return {
    size: SWARM_SIZE,
    maxTokens: ARMY_MAX_TOKENS,
    ctxHint: ARMY_CTX_HINT,
    freeLanes: TEAM_FREE.length,
    allLanes: MODEL_BENCH.length,
    companies: COMPANIES,
    models: MODEL_BENCH,
    sample: swarmRoster(sample),
    note: 'High max_tokens on local/keyed models only — no provider quota bypass.',
  };
}
