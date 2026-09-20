import { access, constants, stat } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { ALL_FILES } from '@/lib/file-inventory';
import { inventoryCoverage, OPERATOR_SITES } from '@/lib/operator-sites';

async function probe(path: string) {
  try {
    await access(path, constants.F_OK);
    const s = await stat(path);
    return {
      present: true,
      type: s.isDirectory() ? 'dir' as const : 'file' as const,
      bytes: s.isFile() ? s.size : null,
    };
  } catch {
    return { present: false, type: null, bytes: null };
  }
}

export async function GET() {
  const files = await Promise.all(
    ALL_FILES.map(async f => ({
      ...f,
      ...(await probe(f.path)),
    })),
  );
  const present = files.filter(f => f.present).length;
  const coverage = inventoryCoverage();
  return NextResponse.json({
    total: files.length,
    present,
    missing: files.filter(f => !f.present).map(f => f.id),
    coverage,
    sites: OPERATOR_SITES.map(s => ({
      id: s.id,
      name: s.name,
      state: s.state,
      city: s.city,
      kind: s.kind,
      fileCount: s.files.length,
    })),
    files,
  });
}
