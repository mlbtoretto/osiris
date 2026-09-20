'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Track = {
  title: string;
  youtubeId?: string;
  youtubeQuery?: string;
  src?: string;
};

type Playlist = { rotate: boolean; tracks: Track[] };

function embedUrl(track: Track, autoplay: boolean) {
  const ap = autoplay ? '1' : '0';
  if (track.src) return '';
  if (track.youtubeId) {
    return `https://www.youtube.com/embed/${encodeURIComponent(track.youtubeId)}?autoplay=${ap}&rel=0`;
  }
  const q = track.youtubeQuery || track.title;
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(q)}&autoplay=${ap}`;
}

export default function ThemeSong() {
  const [list, setList] = useState<Track[]>([]);
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/theme/playlist.json', { cache: 'no-store' })
      .then(r => r.json())
      .then((p: Playlist) => setList(Array.isArray(p.tracks) ? p.tracks : []))
      .catch(() => setList([{ title: 'NBA YoungBoy', youtubeQuery: 'NBA YoungBoy official' }]));
  }, []);

  const track = list[i] || list[0];
  const next = useCallback(() => {
    if (list.length < 2) return;
    setI(n => (n + 1) % list.length);
  }, [list.length]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.onended = next;
  }, [next, track]);

  if (!track) return null;

  return (
    <div className="pointer-events-auto flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOn(v => !v)}
        className="masa-chip"
        title="Theme via YouTube. Add tracks in public/theme/playlist.json"
      >
        {on ? 'THEME' : 'THEME'}
        <span className="ml-1 opacity-70">{on ? '■' : '▶'}</span>
      </button>
      {on && list.length > 1 && (
        <button type="button" onClick={next} className="masa-chip" title="Next in rotation">SKIP</button>
      )}
      <span className="hidden sm:inline text-[8px] tracking-[0.14em] text-[var(--text-muted)] font-mono truncate max-w-[8rem]">
        {track.title}
      </span>
      {on && track.src && <audio ref={audioRef} autoPlay src={track.src} />}
      {on && !track.src && (
        <iframe
          title="MASA IA theme"
          className="absolute w-px h-px opacity-0 pointer-events-none"
          src={embedUrl(track, true)}
          allow="autoplay; encrypted-media"
        />
      )}
    </div>
  );
}
