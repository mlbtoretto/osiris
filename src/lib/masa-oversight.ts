import path from 'node:path';

export type OversightStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type OversightRisk = 'low' | 'medium' | 'high' | 'critical';

export type OversightRequest = {
  id: string;
  title: string;
  objective: string;
  proposedAction: string;
  agent: string;
  risk: OversightRisk;
  status: OversightStatus;
  rationale?: string;
  reviewer?: string;
  decisionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export const OVERSIGHT_FILE = path.join(process.cwd(), 'data', 'masa-oversight.json');

export function normalizeOversight(input: Partial<OversightRequest>): OversightRequest {
  const title = input.title?.trim();
  const objective = input.objective?.trim();
  const proposedAction = input.proposedAction?.trim();
  if (!title || title.length > 160) throw new Error('A title up to 160 characters is required');
  if (!objective || objective.length > 2000) throw new Error('An objective up to 2000 characters is required');
  if (!proposedAction || proposedAction.length > 3000) throw new Error('A proposed action up to 3000 characters is required');
  if (!['low', 'medium', 'high', 'critical'].includes(input.risk || '')) throw new Error('A valid risk level is required');
  const now = new Date().toISOString();
  return {
    id: input.id || `oversight-${crypto.randomUUID()}`,
    title,
    objective,
    proposedAction,
    agent: input.agent?.trim().slice(0, 120) || 'masa-reasoning',
    risk: input.risk as OversightRisk,
    status: 'pending',
    rationale: input.rationale?.trim().slice(0, 2000),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}
