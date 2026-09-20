import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { digitalLifeState, type WorkObservation } from '@/lib/digital-life';

const FILE = path.join(process.cwd(), 'data', 'work-patterns.json');

async function load(): Promise<WorkObservation[]> {
  try {
    const raw = await readFile(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const observations = await load();
  return NextResponse.json(digitalLifeState(observations));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Partial<WorkObservation> | null;
  const pattern = String(body?.pattern || '').trim().slice(0, 240);
  const evidence = String(body?.evidence || '').trim().slice(0, 2000);
  if (!pattern) return NextResponse.json({ error: 'pattern required' }, { status: 400 });
  const obs: WorkObservation = {
    id: `obs-${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    pattern,
    evidence,
  };
  const all = await load();
  all.unshift(obs);
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(all.slice(0, 400), null, 2));
  return NextResponse.json(digitalLifeState(all.slice(0, 400)));
}
