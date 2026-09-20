import { spawnSync } from 'node:child_process';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'image file required' }, { status: 400 });
  }
  if (file.size > 8_000_000) {
    return NextResponse.json({ error: 'file too large' }, { status: 413 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const probe = spawnSync('exiftool', ['-j', '-'], { input: buf, encoding: 'utf8', maxBuffer: 2_000_000 });
  if (probe.status === 0 && probe.stdout) {
    try {
      const json = JSON.parse(probe.stdout);
      return NextResponse.json({ tool: 'exiftool', meta: json[0] || json });
    } catch {
      return NextResponse.json({ tool: 'exiftool', raw: probe.stdout.slice(0, 4000) });
    }
  }
  return NextResponse.json({
    tool: 'none',
    error: 'exiftool not installed',
    hint: 'pacman -S perl-image-exiftool',
    name: file.name,
    size: file.size,
    type: file.type,
  }, { status: 501 });
}
