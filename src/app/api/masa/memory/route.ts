import { NextResponse } from 'next/server';
import { getUnifiedMemory, appendToMemory, writeForensicNote, getMemoryRoutes } from '@/lib/masa-memory';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer');
  const statsOnly = searchParams.get('stats') === 'true';

  if (statsOnly) {
    const mem = await getUnifiedMemory();
    return NextResponse.json(mem.stats);
  }

  if (layer) {
    const mem = await getUnifiedMemory();
    const target = mem.layers.find(l => l.id === layer);
    if (!target) {
      return NextResponse.json({ error: 'Layer not found', available: mem.layers.map(l => l.id) }, { status: 404 });
    }
    return NextResponse.json({ layer: target });
  }

  const mem = await getUnifiedMemory();
  return NextResponse.json({ routes: getMemoryRoutes(), ...mem });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'append') {
    const body = await request.json();
    const { layerId, content } = body;
    if (!layerId || !content) {
      return NextResponse.json({ error: 'layerId and content required' }, { status: 400 });
    }
    try {
      const result = await appendToMemory(layerId, content);
      return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === 'forensic') {
    const body = await request.json();
    const { ts, pattern, evidence } = body;
    if (!ts || !pattern || !evidence) {
      return NextResponse.json({ error: 'ts, pattern, evidence required' }, { status: 400 });
    }
    try {
      const result = await writeForensicNote({ ts, pattern, evidence });
      return NextResponse.json({ ok: true, ...result });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unknown action', available: ['append', 'forensic'] }, { status: 400 });
}