'use client';

import { useState, useEffect } from 'react';
import { Brain, Layers, FileText, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export function MemoryConsole() {
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [writing, setWriting] = useState<{ layerId: string; content: string } | null>(null);

  useEffect(() => {
    fetch('/api/masa/memory')
      .then(r => r.json())
      .then(data => { setMemory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-[var(--text-muted)] text-xs">Loading memory...</div>;
  if (!memory) return <div className="text-[var(--text-muted)] text-xs">Failed to load memory</div>;

  const layers = memory.layers || [];
  const present = layers.filter((l: any) => l.exists);

  const handleWrite = async (layerId: string, content: string) => {
    try {
      await fetch('/api/masa/memory?action=append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layerId, content })
      });
      setWriting(null);
      // Refresh
      const r = await fetch('/api/masa/memory');
      setMemory(await r.json());
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-3 bg-[var(--bg-panel)]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--gold-primary)]" />
          <span className="font-mono text-xs tracking-[0.1em] text-[var(--text-primary)]">MASA MEMORY CONSOLE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{memory.stats?.presentLayers || 0}/{memory.stats?.totalLayers || 0} layers</span>
          <span>·</span>
          <span>{Math.round((memory.stats?.totalChars || 0) / 1024)}KB</span>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {layers.map((layer: any) => (
          <div key={layer.id} className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === layer.id ? null : layer.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--bg-panel)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-2 w-2 rounded-full ${layer.exists ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                <div>
                  <div className="font-mono text-xs tracking-[0.05em] text-[var(--text-primary)]">{layer.name}</div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)]">{layer.path}</div>
                </div>
                {layer.exists && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-void)] text-[var(--text-muted)]">
                    {Math.round((layer.size || 0) / 1024)}KB
                  </span>
                )}
              </div>
              {layer.exists && (
                <div className="flex items-center gap-1">
                  <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${expanded === layer.id ? 'rotate-180' : ''}`} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setWriting({ layerId: layer.id, content: '' }); }}
                    className="p-1 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-white"
                    title="Append to this layer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </button>

            {expanded === layer.id && layer.exists && (
              <div className="border-t border-[var(--border-primary)] p-3 bg-[var(--bg-void)]/50">
                <pre className="font-mono text-[10px] text-[var(--text-secondary)] whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {layer.content}
                </pre>
              </div>
            )}

            {writing?.layerId === layer.id && (
              <div className="border-t border-[var(--border-primary)] p-3 bg-[var(--bg-void)]/50 flex flex-col gap-2">
                <textarea
                  value={writing.content}
                  onChange={(e) => setWriting({ ...writing!, content: e.target.value })}
                  placeholder="Write memory entry..."
                  className="min-h-[80px] bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-3 py-2 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--cyan-primary)] resize-y"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setWriting(null)}
                    className="px-3 py-1 text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleWrite(layer.id, writing.content)}
                    className="px-3 py-1 text-xs font-mono bg-[var(--cyan-primary)] text-black rounded hover:opacity-90 transition-opacity"
                  >
                    Write
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-[var(--border-primary)] px-4 py-2 bg-[var(--bg-panel)]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
          <span>Shared brain: {layers.find((l: any) => l.id === 'shared-brain')?.exists ? 'LIVE' : 'MISSING'}</span>
          <span>Hermes: {layers.find((l: any) => l.id === 'hermes-memory')?.exists ? 'LIVE' : 'MISSING'}</span>
          <span>OpenClaw: {layers.find((l: any) => l.id === 'openclaw-memory')?.exists ? 'LIVE' : 'MISSING'}</span>
          <span>Forensic: {layers.find((l: any) => l.id === 'forensic-notes')?.exists ? 'LIVE' : 'MISSING'}</span>
        </div>
      </div>
    </div>
  );
}