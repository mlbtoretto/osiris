'use client';

import { useState, useEffect } from 'react';
import { Brain, Layers, FileText, Plus, Trash2, ChevronDown, ChevronUp, Sparkles, BookOpen, Save, Search, Filter, Download } from 'lucide-react';

export function MemoryConsole() {
  const [memory, setMemory] = useState<any>(null);
  const [humanMemory, setHumanMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [writing, setWriting] = useState<{ layerId: string; content: string } | null>(null);
  const [humanTab, setHumanTab] = useState<'stats' | 'recall' | 'remember'>('stats');
  const [recallQuery, setRecallQuery] = useState({ type: '', tags: '', since: '', until: '', limit: '50' });
  const [rememberForm, setRememberForm] = useState({ type: 'directive', content: '', source: 'operator', tags: '' });

  useEffect(() => {
    fetch('/api/masa/memory')
      .then(r => r.json())
      .then(data => { setMemory(data); setLoading(false); })
      .catch(() => setLoading(false));
    
    fetch('/api/masa/memory?human=true&action=stats')
      .then(r => r.json())
      .then(data => setHumanMemory(data))
      .catch(() => {});
  }, []);

  const handleWrite = async (layerId: string, content: string) => {
    try {
      await fetch('/api/masa/memory?action=append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layerId, content })
      });
      setWriting(null);
      const r = await fetch('/api/masa/memory');
      setMemory(await r.json());
    } catch (e) { console.error(e); }
  };

  const handleHumanRecall = async () => {
    const params = new URLSearchParams({ human: 'true', action: 'recall' });
    if (recallQuery.type) params.set('type', recallQuery.type);
    if (recallQuery.tags) params.set('tags', recallQuery.tags);
    if (recallQuery.since) params.set('since', recallQuery.since);
    if (recallQuery.until) params.set('until', recallQuery.until);
    if (recallQuery.limit) params.set('limit', recallQuery.limit);
    
    const r = await fetch(`/api/masa/memory?${params}`);
    const data = await r.json();
    setHumanMemory({ ...humanMemory, entries: data.entries });
  };

  const handleHumanRemember = async () => {
    const tags = rememberForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!rememberForm.content || !tags.length) return;
    
    try {
      await fetch('/api/masa/memory?human=true&action=remember', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rememberForm, tags })
      });
      setRememberForm({ type: 'directive', content: '', source: 'operator', tags: '' });
      // Refresh stats
      const r = await fetch('/api/masa/memory?human=true&action=stats');
      setHumanMemory(await r.json());
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-[var(--text-muted)] text-xs">Loading memory...</div>;
  if (!memory) return <div className="text-[var(--text-muted)] text-xs">Failed to load memory</div>;

  const layers = memory.layers || [];
  const present = layers.filter((l: any) => l.exists);

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
          <span>·</span>
          <span className="text-[var(--gold-primary)]">HUMAN: {humanMemory?.totalEntries || 0} entries</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-primary)] px-2 bg-[var(--bg-elevated)]/50">
        <button
          onClick={() => setHumanTab('stats')}
          className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 ${humanTab === 'stats' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
        >
          <BookOpen className="h-3 w-3 inline mr-1" /> STATS
        </button>
        <button
          onClick={() => setHumanTab('recall')}
          className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 ${humanTab === 'recall' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
        >
          <Search className="h-3 w-3 inline mr-1" /> RECALL
        </button>
        <button
          onClick={() => setHumanTab('remember')}
          className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 ${humanTab === 'remember' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
        >
          <Save className="h-3 w-3 inline mr-1" /> REMEMBER
        </button>
        <button
          onClick={() => setHumanTab('layers')}
          className={`px-3 py-1.5 text-xs font-mono transition-colors border-b-2 ml-auto ${humanTab === 'layers' ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
        >
          <Layers className="h-3 w-3 inline mr-1" /> LAYERS
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* HUMAN MEMORY - STATS */}
        {humanTab === 'stats' && humanMemory && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">HUMAN MEMORY LOG</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Permanent · Append-only · Never forgotten</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[var(--bg-void)] p-2 rounded">
                  <div className="text-[var(--text-muted)]">Total Entries</div>
                  <div className="font-mono text-[var(--gold-primary)] text-xl">{humanMemory.totalEntries || 0}</div>
                </div>
                <div className="bg-[var(--bg-void)] p-2 rounded">
                  <div className="text-[var(--text-muted)]">Log Size</div>
                  <div className="font-mono text-[var(--gold-primary)]">{Math.round((humanMemory.logSize || 0) / 1024)}KB</div>
                </div>
                <div className="bg-[var(--bg-void)] p-2 rounded">
                  <div className="text-[var(--text-muted)]">Oldest</div>
                  <div className="font-mono text-[var(--text-secondary)]">{humanMemory.oldest ? new Date(humanMemory.oldest).toLocaleDateString() : '—'}</div>
                </div>
                <div className="bg-[var(--bg-void)] p-2 rounded">
                  <div className="text-[var(--text-muted)]">Newest</div>
                  <div className="font-mono text-[var(--text-secondary)]">{humanMemory.newest ? new Date(humanMemory.newest).toLocaleDateString() : '—'}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[var(--text-muted)] text-xs mb-2">By Type</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(humanMemory.byType || {}).map(([type, count]) => (
                    <span key={type} className="px-2 py-1 bg-[var(--bg-void)] border border-[var(--border-primary)] rounded text-xs font-mono">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[var(--text-muted)] text-xs mb-2">By Source</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(humanMemory.bySource || {}).map(([source, count]) => (
                    <span key={source} className="px-2 py-1 bg-[var(--bg-void)] border border-[var(--border-primary)] rounded text-xs font-mono">
                      {source}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HUMAN MEMORY - RECALL */}
        {humanTab === 'recall' && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">QUERY HUMAN MEMORY</span>
                <button onClick={handleHumanRecall} className="px-3 py-1 text-xs font-mono bg-[var(--cyan-primary)] text-black rounded hover:opacity-90 flex items-center gap-1">
                  <Search className="h-3 w-3" /> RECALL
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Type</label>
                  <select value={recallQuery.type} onChange={e => setRecallQuery({ ...recallQuery, type: e.target.value })} className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]">
                    <option value="">All types</option>
                    <option value="directive">directive</option>
                    <option value="observation">observation</option>
                    <option value="decision">decision</option>
                    <option value="refusal">refusal</option>
                    <option value="preference">preference</option>
                    <option value="correction">correction</option>
                    <option value="fact">fact</option>
                    <option value="workflow">workflow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Tags (comma-separated)</label>
                  <input value={recallQuery.tags} onChange={e => setRecallQuery({ ...recallQuery, tags: e.target.value })} placeholder="tag1,tag2" className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]" />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Since (ISO date)</label>
                  <input value={recallQuery.since} onChange={e => setRecallQuery({ ...recallQuery, since: e.target.value })} type="date" className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]" />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Until (ISO date)</label>
                  <input value={recallQuery.until} onChange={e => setRecallQuery({ ...recallQuery, until: e.target.value })} type="date" className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]" />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Limit</label>
                  <input value={recallQuery.limit} onChange={e => setRecallQuery({ ...recallQuery, limit: e.target.value })} type="number" className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]" />
                </div>
              </div>
              
              {humanMemory.entries && humanMemory.entries.length > 0 && (
                <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
                  {humanMemory.entries.map((entry: any, i: number) => (
                    <div key={entry.id || i} className="bg-[var(--bg-void)] border border-[var(--border-primary)] rounded p-3 text-xs">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[var(--cyan-primary)]/20 text-[var(--cyan-primary)] rounded text-[9px] font-mono">{entry.type}</span>
                        <span className="px-1.5 py-0.5 bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] rounded text-[9px] font-mono">{entry.source}</span>
                        <span className="text-[var(--text-muted)] font-mono">{new Date(entry.ts).toLocaleString()}</span>
                      </div>
                      <div className="font-mono text-[var(--text-secondary)] whitespace-pre-wrap">{entry.content}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.tags.map((tag: string) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-[var(--bg-panel)] border border-[var(--border-primary)] rounded text-[9px] font-mono text-[var(--text-muted)]">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {humanMemory.entries && humanMemory.entries.length === 0 && (
                <div className="text-center text-[var(--text-muted)] text-xs py-8">No entries match query</div>
              )}
            </div>
          </div>
        )}

        {/* HUMAN MEMORY - REMEMBER */}
        {humanTab === 'remember' && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">IMPLANT HUMAN MEMORY</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Permanent · Immutable · Swarm-visible</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Type</label>
                  <select value={rememberForm.type} onChange={e => setRememberForm({ ...rememberForm, type: e.target.value })} className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]">
                    <option value="directive">directive</option>
                    <option value="observation">observation</option>
                    <option value="decision">decision</option>
                    <option value="refusal">refusal</option>
                    <option value="preference">preference</option>
                    <option value="correction">correction</option>
                    <option value="fact">fact</option>
                    <option value="workflow">workflow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Source</label>
                  <select value={rememberForm.source} onChange={e => setRememberForm({ ...rememberForm, source: e.target.value })} className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]">
                    <option value="operator">operator</option>
                    <option value="agent">agent</option>
                    <option value="system">system</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Tags (comma-separated)</label>
                  <input value={rememberForm.tags} onChange={e => setRememberForm({ ...rememberForm, tags: e.target.value })} placeholder="masa,architecture,decision" className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]" />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Content</label>
                  <textarea value={rememberForm.content} onChange={e => setRememberForm({ ...rememberForm, content: e.target.value })} placeholder="What must never be forgotten..." className="w-full min-h-[100px] bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-y" />
                </div>
                <button onClick={handleHumanRemember} disabled={!rememberForm.content || !rememberForm.tags} className="w-full px-4 py-2 text-xs font-mono bg-[var(--gold-primary)] text-black rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> IMPLANT PERMANENTLY
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LAYERS */}
        {humanTab === 'layers' && (
          <div className="space-y-2">
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
                    {layer.kind === 'human-memory' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--gold-primary)]/20 text-[var(--gold-primary)]">PERMANENT</span>
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
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-[var(--border-primary)] px-4 py-2 bg-[var(--bg-panel)]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
          <span>Shared brain: {layers.find((l: any) => l.id === 'shared-brain')?.exists ? 'LIVE' : 'MISSING'}</span>
          <span>Hermes: {layers.find((l: any) => l.id === 'hermes-memory')?.exists ? 'LIVE' : 'MISSING'}</span>
          <span>OpenClaw: {layers.find((l: any) => l.id === 'openclaw-memory')?.exists ? 'LIVE' : 'MISSING'}</span>
          <span>Forensic: {layers.find((l: any) => l.id === 'forensic-notes')?.exists ? 'LIVE' : 'MISSING'}</span>
          <span className="text-[var(--gold-primary)]">Human: {humanMemory?.totalEntries || 0} implanted</span>
        </div>
      </div>
    </div>
  );
}