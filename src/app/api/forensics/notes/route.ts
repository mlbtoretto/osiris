import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import type { ForensicNote } from '@/lib/forensic-notes';

const FILE = path.join(process.cwd(), 'data', 'forensic-notes.json');

async function loadNotes(): Promise<ForensicNote[]> {
  try {
    const raw = await readFile(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveNotes(notes: ForensicNote[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(notes, null, 2));
}

export async function GET() {
  return NextResponse.json({ notes: await loadNotes() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Partial<ForensicNote> | null;
  const title = String(body?.title || '').trim().slice(0, 160);
  const text = String(body?.body || '').trim().slice(0, 8000);
  if (!title || !text) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }
  const note: ForensicNote = {
    id: `note-${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    title,
    body: text,
    agent: String(body?.agent || 'osiris').slice(0, 40),
    planet: String(body?.planet || 'earth').slice(0, 20),
    tags: Array.isArray(body?.tags) ? body.tags.map(t => String(t).slice(0, 32)).slice(0, 8) : [],
  };
  const notes = await loadNotes();
  notes.unshift(note);
  await saveNotes(notes.slice(0, 500));
  return NextResponse.json({ note });
}
