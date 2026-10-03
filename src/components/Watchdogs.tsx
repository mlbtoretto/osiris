'use client';

import { useEffect, useState } from 'react';

type Check = { name: string; ok: boolean; detail: string };

export default function Watchdogs() {
  const [checks, setChecks] = useState<Check[]>([]);
  useEffect(() => {
    const pull = () => fetch('/api/watchdogs').then(r => r.json()).then(d => setChecks(d.checks || [])).catch(() => {});
    pull();
    const timer = setInterval(pull, 15000);
    return () => clearInterval(timer);
  }, []);
  const up = checks.filter(check => check.ok).length;
  const bad = checks.filter(check => !check.ok);
  return (
    <span className="pointer-events-auto inline-flex items-center gap-1" title={bad.map(check => `${check.name} ${check.detail}`).join(' · ') || 'watchdogs'}>
      <span className={up === checks.length && checks.length ? 'text-[var(--alert-green)]' : 'text-[var(--alert-red)]'}>DOGS {checks.length ? `${up}/${checks.length}` : '…'}</span>
    </span>
  );
}
