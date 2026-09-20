import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { UNIFIED_TOOLS } from '@/lib/correlation';

function which(bin: string) {
  if (!bin) return null;
  const r = spawnSync('which', [bin], { encoding: 'utf8' });
  return r.status === 0 ? { present: true, path: (r.stdout || '').trim() } : { present: false, path: '' };
}

/** Local project/vendor tools ship as a checkout, not a $PATH binary. */
function local(href: string) {
  if (!href.startsWith('/')) return null;
  try {
    return { present: existsSync(href) && statSync(href).isDirectory(), path: href };
  } catch {
    return { present: false, path: href };
  }
}

export async function GET() {
  const tools = UNIFIED_TOOLS.map(tool => {
    const found = which(tool.bin || '') ?? local(tool.href) ?? { present: false, path: '' };
    return { ...tool, ...found };
  });
  return NextResponse.json({
    tools,
    langsmith: Boolean(process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY),
    shodan: '/api/osint/shodan',
  });
}
