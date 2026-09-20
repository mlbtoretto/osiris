import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import type { Enrolled } from '@/lib/vision-scene';

const FILE = path.join(process.cwd(), 'data', 'vision-enroll.json');

async function load(): Promise<Enrolled[]> {
  try {
    const parsed = JSON.parse(await readFile(FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  return NextResponse.json({ enrolled: await load() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Partial<Enrolled> | null;
  const name = String(body?.name || '').trim().slice(0, 80);
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const row: Enrolled = {
    id: `enr-${Date.now().toString(36)}`,
    name,
    kind: body?.kind === 'person' ? 'person' : 'object',
    note: String(body?.note || '').slice(0, 400),
    ts: new Date().toISOString(),
  };
  const all = await load();
  all.unshift(row);
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(all.slice(0, 200), null, 2));
  return NextResponse.json({ enrolled: all.slice(0, 200), row });
}
