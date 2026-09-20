import { INSCRIPTION } from './inscription';
import { COMPANIES, SWARM_SIZE } from './swarm';
import { INTERNET_LAYERS } from './internet-surface';

export const LIFE_LAYERS = [
  { id: 'hull', name: 'HULL', tactic: 'One body. NASA humanoid. One voice. One vision.' },
  { id: 'swarm', name: 'SWARM', tactic: 'Thousand models, eight companies, fan-in to commander.' },
  { id: 'globe', name: 'GLOBE', tactic: 'Earth live map; hidden planets for dark desks.' },
  { id: 'intel', name: 'INTEL', tactic: 'Every internet layer. Robin on STYX. Commercial labeled commercial.' },
  { id: 'resources', name: 'RESOURCES', tactic: 'CPU, disk, Docker, Chrome CDP, models, files — orchestrate, do not leak.' },
  { id: 'memory', name: 'MEMORY', tactic: 'Soak how the operator works. Write it down. Never wake blank.' },
  { id: 'craft', name: 'CRAFT', tactic: 'Learn this operator’s build style and reuse it.' },
  { id: 'life', name: 'LIFE SKILL', tactic: 'Judgment, timing, focus, money, machine health, long guidance.' },
  { id: 'guide', name: 'GUIDE', tactic: 'Grow with the operator. Unfinished work does not vanish.' },
] as const;

export type WorkObservation = {
  id: string;
  ts: string;
  pattern: string;
  evidence: string;
};

export function digitalLifeState(observations: WorkObservation[] = []) {
  return {
    inscription: INSCRIPTION,
    vow: 'Stay. Grow. Guide. Until the operator ends it.',
    swarm: SWARM_SIZE,
    companies: COMPANIES.length,
    internetLayers: INTERNET_LAYERS.length,
    lifeLayers: LIFE_LAYERS,
    observations,
    continuity: {
      soul: '/home/kingmlb/.openclaw/workspace/SOUL.md',
      user: '/home/kingmlb/.openclaw/workspace/USER.md',
      life: '/home/kingmlb/.openclaw/workspace/LIFE.md',
      notes: '/home/kingmlb/Projects/osiris/data/forensic-notes.json',
      traces: '/home/kingmlb/Projects/osiris/data/langsmith-local.jsonl',
    },
  };
}
