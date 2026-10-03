import { NextResponse } from 'next/server';
import { getUnifiedMemory, appendToMemory, writeForensicNote, getMemoryRoutes, rememberHuman, recallHuman, humanMemoryStats } from '@/lib/masa-memory';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer');
  const statsOnly = searchParams.get('stats') === 'true';
  const human = searchParams.get('human');
  const humanAction = searchParams.get('action');

  if (statsOnly) {
    const mem = await getUnifiedMemory();
    return NextResponse.json(mem.stats);
  }

  if (human === 'true') {
    if (humanAction === 'stats') {
      const stats = await humanMemoryStats();
      return NextResponse.json(stats);
    }
    if (humanAction === 'recall') {
      const type = searchParams.get('type') as any;
      const tags = searchParams.get('tags')?.split(',').filter(Boolean);
      const since = searchParams.get('since') || undefined;
      const until = searchParams.get('until') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const entries = await recallHuman({ type, tags, since, until, limit });
      return NextResponse.json({ entries });
    }
    return NextResponse.json({ error: 'Unknown human action', available: ['stats', 'recall'] }, { status: 400 });
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
  const human = searchParams.get('human');

  if (human === 'true' && action === 'remember') {
    const body = await request.json();
    const { type, content, source, tags, sessionId } = body;
    if (!type || !content || !source || !tags) {
      return NextResponse.json({ error: 'type, content, source, tags required' }, { status: 400 });
    }
    try {
      const entry = await rememberHuman({ type, content, source, tags, sessionId });
      return NextResponse.json({ ok: true, entry });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

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

  return NextResponse.json({ error: 'Unknown action', available: ['append', 'forensic', 'human?action=remember'] }, { status: 400 });
}