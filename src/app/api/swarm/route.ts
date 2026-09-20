import { NextResponse } from 'next/server';
import { agentArmyStatus } from '@/lib/agent-army';
import { INSCRIPTION } from '@/lib/inscription';
import { COMPANIES, SWARM_SIZE, swarmRoster } from '@/lib/swarm';

export async function GET() {
  const roster = swarmRoster();
  const army = agentArmyStatus(32);
  return NextResponse.json({
    inscription: INSCRIPTION,
    size: SWARM_SIZE,
    voice: 1,
    vision: 1,
    army: {
      maxTokens: army.maxTokens,
      ctxHint: army.ctxHint,
      freeLanes: army.freeLanes,
      allLanes: army.allLanes,
      models: army.models.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        cost: m.cost,
        model: m.model,
        maxTokens: m.maxTokens ?? army.maxTokens,
        envKey: m.envKey,
      })),
      note: army.note,
    },
    companies: COMPANIES.map(c => ({
      ...c,
      cells: roster.filter(cell => cell.company === c.id).length,
    })),
    sample: roster.filter((_, i) => i % 125 === 0),
  });
}
