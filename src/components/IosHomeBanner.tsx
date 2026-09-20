'use client';

import { useEffect, useState } from 'react';

/** iPhone Safari → Add to Home Screen coach. Hidden once installed as standalone. */
export default function IosHomeBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone =
      ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
      || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = sessionStorage.getItem('masa-ios-home-dismiss') === '1';
    setShow(isIos && !standalone && !dismissed);
  }, []);

  if (!show) return null;

  return (
    <div
      className="pointer-events-auto fixed left-3 right-3 z-[600] rounded border border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-2 font-mono text-[10px] tracking-[0.08em] text-[var(--text-secondary)]"
      style={{ bottom: 'calc(58px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[var(--gold-primary)] tracking-[0.2em]">IPHONE · MASA IA</div>
          <p className="mt-1 leading-snug">
            Share → <span className="text-[var(--text-heading)]">Add to Home Screen</span>.
            Tailscale on. Open from the icon for full-screen + live location.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 px-2 py-1 text-[var(--text-muted)]"
          onClick={() => {
            sessionStorage.setItem('masa-ios-home-dismiss', '1');
            setShow(false);
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
