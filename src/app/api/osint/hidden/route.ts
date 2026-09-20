import { NextRequest, NextResponse } from 'next/server';

/** Public "what they took down" — Wayback CDX only. Not private systems. */

function hostFrom(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  if (!/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return null;
  if (s.endsWith('.local') || s.endsWith('.internal')) return null;
  return s;
}

export async function GET(request: NextRequest) {
  const host = hostFrom(request.nextUrl.searchParams.get('q') || '');
  if (!host) return NextResponse.json({ error: 'public hostname required' }, { status: 400 });

  const cdx = new URL('https://web.archive.org/cdx/search/cdx');
  cdx.searchParams.set('url', `${host}/*`);
  cdx.searchParams.set('output', 'json');
  cdx.searchParams.set('fl', 'timestamp,original,statuscode,mimetype');
  cdx.searchParams.set('limit', '30');
  cdx.searchParams.set('collapse', 'digest');

  try {
    const res = await fetch(cdx, {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'OSIRIS/hidden-reach' },
    });
    if (!res.ok) return NextResponse.json({ error: 'archive upstream failed' }, { status: 502 });
    const rows = await res.json() as string[][];
    const [header, ...body] = Array.isArray(rows) ? rows : [];
    const captures = body.slice(0, 30).map(r => ({
      time: r[0],
      url: r[1],
      status: r[2],
      type: r[3],
      open: `https://web.archive.org/web/${r[0]}/${r[1]}`,
    }));
    return NextResponse.json({
      host,
      source: 'Internet Archive CDX',
      count: captures.length,
      captures,
      crt: `https://crt.sh/?q=${encodeURIComponent(host)}`,
      wayback: `https://web.archive.org/web/*/${host}`,
      fields: header || ['timestamp', 'original', 'statuscode', 'mimetype'],
    });
  } catch {
    return NextResponse.json({ error: 'archive fetch failed' }, { status: 502 });
  }
}
