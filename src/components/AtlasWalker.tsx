'use client';

export default function AtlasWalker({ zoom }: { zoom: number }) {
  const out = zoom < 3.2;
  return (
    <img
      src="/atlas-walker-red.png"
      alt=""
      aria-hidden
      className={`pointer-events-none fixed bottom-24 left-1/2 z-30 w-40 -translate-x-1/2 rounded-2xl object-cover object-top shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-opacity duration-500 ${out ? 'opacity-95' : 'opacity-0'}`}
      style={{ height: '15rem' }}
    />
  );
}
