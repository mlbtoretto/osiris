'use client';

import { useState, useEffect } from 'react';
import {
  Bug, Terminal, Play, Stop, Square, FileCode, Shield, Globe, Download, Upload,
  ChevronDown, ChevronUp, Search, Filter, Trash2, Sparkles, Brain, Cpu, Zap
} from 'lucide-react';

export function LangSmithConsole() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'sessions' | 'live' | 'sandbox' | 'fud' | 'web' | 'export'>('sessions');
  const [newSession, setNewSession] = useState({ agentId: 'masa', planet: 'earth' });
  const [sandboxForm, setSandboxForm] = useState({ command: '', args: '', timeout: 30000 });
  const [fudForm, setFudForm] = useState({ type: 'encode', payload: '', options: '' });
  const [webForm, setWebForm] = useState({ url: '', method: 'GET', headers: '', body: '' });
  const [filter, setFilter] = useState({ type: '', search: '' });

  useEffect(() => {
    loadSessions();
    loadRecentTraces();
  }, []);

  const loadSessions = async () => {
    try {
      const r = await fetch('/api/langsmith?action=recent&limit=20');
      const data = await r.json();
      setSessions(data.traces || []);
    } catch (e) { console.error(e); }
  };

  const loadRecentTraces = async () => {
    try {
      const r = await fetch('/api/langsmith?action=recent&limit=50');
      const data = await r.json();
      setTraces(data.traces || []);
    } catch (e) { console.error(e); }
  };

  const createSession = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/langsmith?action=session-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
      const data = await r.json();
      if (data.ok) {
        setCurrentSession(data.session);
        setTab('live');
        loadSessions();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadSession = async (sessionId: string) => {
    try {
      const r = await fetch(`/api/langsmith?action=session&sessionId=${sessionId}`);
      const data = await r.json();
      if (data.session) {
        setCurrentSession(data.session);
        setTab('live');
        const tr = await fetch(`/api/langsmith?action=traces&sessionId=${sessionId}`);
        const trData = await tr.json();
        setTraces(trData.traces || []);
      }
    } catch (e) { console.error(e); }
  };

  const closeSession = async () => {
    if (!currentSession) return;
    try {
      await fetch(`/api/langsmith?action=session-close&sessionId=${currentSession.session_id}`, {
        method: 'POST'
      });
      setCurrentSession(null);
      setTraces([]);
      loadSessions();
    } catch (e) { console.error(e); }
  };

  const addTrace = async (event: any) => {
    if (!currentSession) return;
    try {
      const r = await fetch(`/api/langsmith?action=trace&sessionId=${currentSession.session_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      const data = await r.json();
      if (data.ok) {
        setTraces(prev => [...prev, data.event]);
        return data.event;
      }
    } catch (e) { console.error(e); }
  };

  const endTrace = async (eventId: string, outputs: any) => {
    if (!currentSession) return;
    try {
      await fetch(`/api/langsmith?action=trace-end&sessionId=${currentSession.session_id}&eventId=${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputs })
      });
      setTraces(prev => prev.map(t => t.id === eventId ? { ...t, outputs, end_time: new Date().toISOString() } : t));
    } catch (e) { console.error(e); }
  };

  const createSandbox = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/langsmith?action=sandbox-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeout_ms: sandboxForm.timeout })
      });
      const data = await r.json();
      if (data.ok) {
        addTrace({
          type: 'sandbox',
          name: `sandbox:create`,
          run_type: 'tool',
          inputs: { sandbox_id: data.sandbox.id, config: data.sandbox },
          metadata: { sandbox: true },
          tags: ['sandbox', 'create'],
          sandbox_id: data.sandbox.id,
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const executeSandbox = async () => {
    if (!currentSession || !sandboxForm.command) return;
    setLoading(true);
    try {
      const traceEvent = await addTrace({
        type: 'sandbox',
        name: `sandbox:${sandboxForm.command}`,
        run_type: 'tool',
        inputs: { command: sandboxForm.command, args: sandboxForm.args.split(' ').filter(Boolean) },
        metadata: { sandbox: true },
        tags: ['sandbox', 'execution'],
      });

      const r = await fetch('/api/langsmith?action=sandbox-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId: traceEvent.id,
          command: sandboxForm.command,
          args: sandboxForm.args.split(' ').filter(Boolean)
        })
      });
      const data = await r.json();
      if (data.ok) {
        await endTrace(traceEvent.id, data.result);
        setTraces(prev => prev.map(t => t.id === traceEvent.id ? { ...t, outputs: data.result, end_time: new Date().toISOString() } : t));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const executeFUD = async () => {
    if (!currentSession || !fudForm.payload) return;
    setLoading(true);
    try {
      const traceEvent = await addTrace({
        type: 'fud',
        name: `fud:${fudForm.type}`,
        run_type: 'tool',
        inputs: { type: fudForm.type, payload_hash: fudForm.payload.slice(0, 50) },
        metadata: { fud: true },
        tags: ['fud', fudForm.type],
        fud_type: fudForm.type,
      });

      const r = await fetch('/api/langsmith?action=fud-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: fudForm.type,
          payload: fudForm.payload,
          options: fudForm.options ? JSON.parse(fudForm.options) : {}
        })
      });
      const data = await r.json();
      if (data.ok) {
        await endTrace(traceEvent.id, data.result);
        setTraces(prev => prev.map(t => t.id === traceEvent.id ? { ...t, outputs: data.result, end_time: new Date().toISOString() } : t));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const executeWebRequest = async () => {
    if (!currentSession || !webForm.url) return;
    setLoading(true);
    try {
      const traceEvent = await addTrace({
        type: 'web',
        name: `web:${webForm.method} ${new URL(webForm.url).hostname}`,
        run_type: 'tool',
        inputs: { url: webForm.url, method: webForm.method },
        metadata: { web: true },
        tags: ['web', 'http', new URL(webForm.url).hostname],
      });

      const r = await fetch('/api/langsmith?action=web-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webForm.url,
          method: webForm.method,
          headers: webForm.headers ? JSON.parse(webForm.headers) : {},
          body: webForm.body,
          trace: true
        })
      });
      const data = await r.json();
      if (data.ok) {
        await endTrace(traceEvent.id, { status: data.status });
        setTraces(prev => prev.map(t => t.id === traceEvent.id ? { ...t, outputs: { status: data.status }, end_time: new Date().toISOString() } : t));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportSession = async () => {
    if (!currentSession) return;
    try {
      const r = await fetch(`/api/langsmith?action=export&sessionId=${currentSession.session_id}`);
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `langsmith-session-${currentSession.session_id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const filteredTraces = traces.filter(t => {
    if (filter.type && t.type !== filter.type) return false;
    if (filter.search && !JSON.stringify(t).toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const typeColors: Record<string, string> = {
    agent: 'var(--cyan-primary)',
    tool: 'var(--gold-primary)',
    llm: 'var(--green-primary)',
    chain: 'var(--purple-primary)',
    reasoning: 'var(--pink-primary)',
    code: 'var(--orange-primary)',
    fud: 'var(--red-primary)',
    web: 'var(--blue-primary)',
    sandbox: 'var(--yellow-primary)',
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-3 bg-[var(--bg-panel)]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--gold-primary)]" />
          <span className="font-mono text-xs tracking-[0.1em] text-[var(--text-primary)]">LANGSMITH UNIFIED TRACING</span>
          <span className="px-1.5 py-0.5 bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] text-[9px] font-mono rounded">
            FUSED AGENTIC REASONING
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{traces.length} traces</span>
          <span>·</span>
          <span>{currentSession ? `Session: ${currentSession.session_id.slice(0, 20)}...` : 'No session'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-primary)] px-2 bg-[var(--bg-elevated)]/50 overflow-x-auto">
        {[
          { id: 'sessions', label: 'SESSIONS', icon: Brain },
          { id: 'live', label: 'LIVE TRACE', icon: Zap },
          { id: 'sandbox', label: 'SANDBOX', icon: Terminal },
          { id: 'fud', label: 'FUD ENGINE', icon: Shield },
          { id: 'web', label: 'WEB REQ', icon: Globe },
          { id: 'export', label: 'EXPORT', icon: Download },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-mono transition-colors border-b-2 whitespace-nowrap ${
              tab === t.id ? 'border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <t.icon className="h-3 w-3" /> {t.label}
          </button>
        ))}
        {currentSession && (
          <button
            onClick={closeSession}
            className="ml-auto px-3 py-1.5 text-xs font-mono text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded border border-[var(--danger)]/30"
          >
            <Square className="h-3 w-3 mr-1" /> CLOSE SESSION
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* SESSIONS TAB */}
        {tab === 'sessions' && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">CREATE TRACE SESSION</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Agent ID</label>
                  <input
                    value={newSession.agentId}
                    onChange={e => setNewSession({ ...newSession, agentId: e.target.value })}
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                    placeholder="masa"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Planet</label>
                  <select
                    value={newSession.planet}
                    onChange={e => setNewSession({ ...newSession, planet: e.target.value })}
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                  >
                    <option value="earth">earth</option>
                    <option value="ares">ares</option>
                    <option value="styx">styx</option>
                    <option value="iris">iris</option>
                    <option value="nemesis">nemesis</option>
                  </select>
                </div>
              </div>
              <button onClick={createSession} disabled={loading} className="w-full px-4 py-2 text-xs font-mono bg-[var(--cyan-primary)] text-black rounded hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                <Play className="h-4 w-4" /> START SESSION
              </button>
            </div>

            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">RECENT SESSIONS ({sessions.length})</span>
                <button onClick={loadSessions} className="text-[var(--text-muted)] hover:text-white text-xs">REFRESH</button>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-center text-[var(--text-muted)] text-xs py-8">No sessions yet</div>
                ) : (
                  sessions.map((trace: any) => (
                    <button
                      key={trace.id}
                      onClick={() => loadSession(trace.session_id || trace.id)}
                      className="w-full text-left p-3 bg-[var(--bg-void)] border border-[var(--border-primary)] rounded hover:border-[var(--gold-primary)]/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-[var(--cyan-primary)]/20 text-[var(--cyan-primary)] rounded text-[9px] font-mono">
                            {trace.agent_id || trace.agent || 'masa'}
                          </span>
                          <span className="px-1.5 py-0.5 bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] rounded text-[9px] font-mono">
                            {trace.planet || 'earth'}
                          </span>
                        </div>
                        <span className="text-[var(--text-muted)] font-mono text-[10px]">
                          {new Date(trace.ts || trace.start_time).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1 truncate">
                        {trace.name || trace.inputs?.text?.slice(0, 80) || 'trace event'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* LIVE TRACE TAB */}
        {tab === 'live' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">LIVE EVENT STREAM</span>
                {currentSession && (
                  <span className="px-1.5 py-0.5 bg-[var(--green-primary)]/20 text-[var(--green-primary)] rounded text-[9px] font-mono animate-pulse">
                    RECORDING
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportSession} className="px-2 py-1 text-xs font-mono bg-[var(--bg-void)] border border-[var(--border-primary)] rounded hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1">
                  <Download className="h-3 w-3" /> EXPORT
                </button>
                <button onClick={loadRecentTraces} className="px-2 py-1 text-xs font-mono bg-[var(--bg-void)] border border-[var(--border-primary)] rounded hover:border-[var(--gold-primary)] transition-colors flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> REFRESH
                </button>
              </div>
            </div>

            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-3 mb-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={filter.type}
                  onChange={e => setFilter({ ...filter, type: e.target.value })}
                  className="bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                >
                  <option value="">All types</option>
                  <option value="agent">agent</option>
                  <option value="tool">tool</option>
                  <option value="llm">llm</option>
                  <option value="chain">chain</option>
                  <option value="reasoning">reasoning</option>
                  <option value="code">code</option>
                  <option value="fud">fud</option>
                  <option value="web">web</option>
                  <option value="sandbox">sandbox</option>
                </select>
                <input
                  value={filter.search}
                  onChange={e => setFilter({ ...filter, search: e.target.value })}
                  placeholder="Search traces..."
                  className="flex-1 min-w-[150px] bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {filteredTraces.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] text-xs py-8">No traces in current session</div>
              ) : (
                filteredTraces.map((trace: any, i: number) => (
                  <div
                    key={trace.id || i}
                    className="bg-[var(--bg-void)] border border-[var(--border-primary)] rounded p-3 text-xs"
                    style={{ borderLeftColor: typeColors[trace.type] || 'transparent', borderLeftWidth: '3px' }}
                  >
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ backgroundColor: `${typeColors[trace.type] || 'var(--text-muted)'}20`, color: typeColors[trace.type] || 'var(--text-muted)' }}>
                        {trace.type?.toUpperCase() || 'UNKNOWN'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] rounded text-[9px] font-mono">
                        {trace.run_type || 'chain'}
                      </span>
                      <span className="text-[var(--text-muted)] font-mono">{new Date(trace.ts || trace.start_time).toLocaleTimeString()}</span>
                      <span className="text-[var(--text-muted)] font-mono ml-auto">{trace.duration_ms ? `${trace.duration_ms}ms` : ''}</span>
                    </div>
                    <div className="font-mono text-[var(--text-secondary)] mb-1">{trace.name}</div>
                    <div className="text-[9px] text-[var(--text-muted)] font-mono mb-1">
                      {trace.tags && trace.tags.length > 0 && trace.tags.map((t: string) => `#${t}`).join(' ')}
                    </div>
                    <details className="text-[9px] text-[var(--text-muted)]">
                      <summary className="cursor-pointer">inputs</summary>
                      <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(trace.inputs, null, 2).slice(0, 500)}</pre>
                    </details>
                    {trace.outputs && (
                      <details className="text-[9px] text-[var(--success)] mt-1">
                        <summary className="cursor-pointer">outputs</summary>
                        <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(trace.outputs, null, 2).slice(0, 500)}</pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SANDBOX TAB */}
        {tab === 'sandbox' && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">SANDBOX EXECUTION</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Isolated · Resource-limited · Traced</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Command</label>
                  <input
                    value={sandboxForm.command}
                    onChange={e => setSandboxForm({ ...sandboxForm, command: e.target.value })}
                    placeholder="python3, node, bash, gcc, cargo, go, npx, deno, bun..."
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Args (space-separated)</label>
                  <input
                    value={sandboxForm.args}
                    onChange={e => setSandboxForm({ ...sandboxForm, args: e.target.value })}
                    placeholder="script.py arg1 arg2"
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    value={sandboxForm.timeout}
                    onChange={e => setSandboxForm({ ...sandboxForm, timeout: parseInt(e.target.value) })}
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                  />
                </div>
                <button onClick={executeSandbox} disabled={loading || !currentSession || !sandboxForm.command} className="w-full px-4 py-2 text-xs font-mono bg-[var(--cyan-primary)] text-black rounded hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Terminal className="h-4 w-4" /> EXECUTE IN SANDBOX
                </button>
              </div>
            </div>

            {currentSession && (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
                <span className="font-mono text-xs text-[var(--gold-primary)] mb-3 block">SANDBOX TRACES</span>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {traces.filter(t => t.type === 'sandbox').map((trace: any, i: number) => (
                    <div key={trace.id || i} className="bg-[var(--bg-void)] border border-[var(--border-primary)] rounded p-3 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[var(--yellow-primary)]/20 text-[var(--yellow-primary)] rounded text-[9px] font-mono">SANDBOX</span>
                        <span className="text-[var(--text-muted)] font-mono">{new Date(trace.ts).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-mono text-[var(--text-secondary)]">{trace.name}</div>
                      <details className="text-[9px] text-[var(--text-muted)] mt-1">
                        <summary className="cursor-pointer">result</summary>
                        <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(trace.outputs, null, 2).slice(0, 1000)}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FUD TAB */}
        {tab === 'fud' && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">FUD ENGINE</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Encode · Obfuscate · Pack · Encrypt · Evade</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Operation Type</label>
                  <select
                    value={fudForm.type}
                    onChange={e => setFudForm({ ...fudForm, type: e.target.value })}
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                  >
                    <option value="encode">encode (base64, rot13, xor)</option>
                    <option value="obfuscate">obfuscate (js string splitting, var rename)</option>
                    <option value="pack">pack (upx-style loader)</option>
                    <option value="encrypt">encrypt (aes-gcm, chacha20)</option>
                    <option value="anti_vm">anti-vm (cpuid, timing, mac checks)</option>
                    <option value="anti_debug">anti-debug (ptrace, int3, hw bp)</option>
                    <option value="process_inject">process inject (createremotethread, etc)</option>
                    <option value="shellcode">shellcode (pic, api hashing, syscalls)</option>
                    <option value="dropper">dropper (staged download, memory exec)</option>
                    <option value="persistence">persistence (registry, task, wmi, service)</option>
                    <option value="evasion">evasion (syscall unhook, etw, amsi, wd)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Payload</label>
                  <textarea
                    value={fudForm.payload}
                    onChange={e => setFudForm({ ...fudForm, payload: e.target.value })}
                    placeholder="Code, shellcode, binary data, or script to transform..."
                    className="w-full min-h-[80px] bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Options (JSON)</label>
                  <textarea
                    value={fudForm.options}
                    onChange={e => setFudForm({ ...fudForm, options: e.target.value })}
                    placeholder='{"xor_key": "key", "rot13": true, "arch": "x64", "technique": "createremotethread"}'
                    className="w-full min-h-[50px] bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-y"
                  />
                </div>
                <button onClick={executeFUD} disabled={loading || !currentSession || !fudForm.payload} className="w-full px-4 py-2 text-xs font-mono bg-[var(--red-primary)] text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" /> EXECUTE FUD
                </button>
              </div>
            </div>

            {currentSession && (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
                <span className="font-mono text-xs text-[var(--gold-primary)] mb-3 block">FUD TRACES</span>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {traces.filter(t => t.type === 'fud').map((trace: any, i: number) => (
                    <div key={trace.id || i} className="bg-[var(--bg-void)] border border-[var(--border-primary)] rounded p-3 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[var(--red-primary)]/20 text-[var(--red-primary)] rounded text-[9px] font-mono">FUD</span>
                        <span className="px-1.5 py-0.5 bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] rounded text-[9px] font-mono">{trace.fud_type}</span>
                        <span className="text-[var(--text-muted)] font-mono">{new Date(trace.ts).toLocaleTimeString()}</span>
                      </div>
                      <details className="text-[9px] text-[var(--text-muted)] mt-1">
                        <summary className="cursor-pointer">result</summary>
                        <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(trace.outputs, null, 2).slice(0, 1000)}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WEB REQUEST TAB */}
        {tab === 'web' && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">TRACED WEB REQUEST</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Full request/response capture · LangSmith sync</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">URL</label>
                  <input
                    value={webForm.url}
                    onChange={e => setWebForm({ ...webForm, url: e.target.value })}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-muted)] mb-1">Method</label>
                    <select
                      value={webForm.method}
                      onChange={e => setWebForm({ ...webForm, method: e.target.value })}
                      className="w-full bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)]"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Headers (JSON)</label>
                  <textarea
                    value={webForm.headers}
                    onChange={e => setWebForm({ ...webForm, headers: e.target.value })}
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    className="w-full min-h-[50px] bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Body</label>
                  <textarea
                    value={webForm.body}
                    onChange={e => setWebForm({ ...webForm, body: e.target.value })}
                    placeholder='{"key": "value"}'
                    className="w-full min-h-[50px] bg-[var(--bg-void)] border border-[var(--border-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-y"
                  />
                </div>
                <button onClick={executeWebRequest} disabled={loading || !currentSession || !webForm.url} className="w-full px-4 py-2 text-xs font-mono bg-[var(--blue-primary)] text-white rounded hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Globe className="h-4 w-4" /> SEND TRACED REQUEST
                </button>
              </div>
            </div>

            {currentSession && (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
                <span className="font-mono text-xs text-[var(--gold-primary)] mb-3 block">WEB REQUEST TRACES</span>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {traces.filter(t => t.type === 'web').map((trace: any, i: number) => (
                    <div key={trace.id || i} className="bg-[var(--bg-void)] border border-[var(--border-primary)] rounded p-3 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 bg-[var(--blue-primary)]/20 text-[var(--blue-primary)] rounded text-[9px] font-mono">WEB</span>
                        <span className="px-1.5 py-0.5 bg-[var(--cyan-primary)]/20 text-[var(--cyan-primary)] rounded text-[9px] font-mono">{trace.inputs?.method}</span>
                        <span className="text-[var(--text-muted)] font-mono truncate">{trace.inputs?.url}</span>
                        <span className="text-[var(--text-muted)] font-mono ml-auto">{new Date(trace.ts).toLocaleTimeString()}</span>
                      </div>
                      {trace.outputs?.status && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${trace.outputs.status >= 200 && trace.outputs.status < 300 ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--danger)]/20 text-[var(--danger)]'}`}>
                          {trace.outputs.status}
                        </span>
                      )}
                      <details className="text-[9px] text-[var(--text-muted)] mt-1">
                        <summary className="cursor-pointer">response</summary>
                        <pre className="mt-1 whitespace-pre-wrap overflow-x-auto">{JSON.stringify(trace.outputs, null, 2).slice(0, 1000)}</pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPORT TAB */}
        {tab === 'export' && currentSession && (
          <div className="space-y-3">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-[var(--gold-primary)]">EXPORT SESSION</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">LangSmith-compatible JSON</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mb-4">
                Session: <span className="font-mono text-[var(--text-primary)]">{currentSession.session_id}</span> · Agent: <span className="font-mono text-[var(--text-primary)]">{currentSession.agent_id}</span> · Planet: <span className="font-mono text-[var(--text-primary)]">{currentSession.planet}</span> · Events: <span className="font-mono text-[var(--text-primary)]">{currentSession.events.length}</span>
              </div>
              <button onClick={exportSession} className="w-full px-4 py-2 text-xs font-mono bg-[var(--gold-primary)] text-black rounded hover:opacity-90 flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> DOWNLOAD LANGSMITH JSON
              </button>
              <div className="mt-4 p-3 bg-[var(--bg-void)] border border-[var(--border-primary)] rounded text-[9px] font-mono text-[var(--text-muted)]">
                Includes: all events, inputs/outputs, metadata, tags, session summary, timing, token usage, tool calls, FUD ops, web requests, sandbox executions.
              </div>
            </div>
          </div>
        )}

        {tab === 'export' && !currentSession && (
          <div className="text-center text-[var(--text-muted)] text-xs py-8">
            Create or select a session first
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border-primary)] px-4 py-2 bg-[var(--bg-panel)]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
          <span>Local: data/langsmith-local.jsonl</span>
          <span>Remote: {process.env.LANGSMITH_API_KEY ? 'CONNECTED' : 'NOT CONFIGURED'}</span>
          <span>Sandbox: /tmp/masa-langsmith-sandbox/</span>
        </div>
      </div>
    </div>
  );
}