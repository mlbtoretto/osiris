'use client';

import { useEffect, useState } from 'react';
import { MODEL_BENCH } from '@/lib/free-models';
import { MASA_SOCIAL_LINKS } from '@/lib/masa-social-links';

type ProviderRow = { id: string; name: string; website?: string; docs?: string; models?: string[]; free?: boolean; configured?: boolean };
type AgentRow = { id: string; name: string; role: string; status: string; interface: string };
type McpRow = { name: string; transport?: string; status?: string; href?: string };
type IntegrationRow = { id: string; name: string; kind: string; source: string; status: string };

const APPS = ['x', 'youtube', 'reddit', 'facebook'] as const;

const MCP_LINKS: McpRow[] = [
  { name: 'GitHub', href: 'https://github.com/github/github-mcp-server', status: 'link' },
  { name: 'Hugging Face', href: 'https://huggingface.co/docs', status: 'link' },
  { name: 'NASA', href: 'https://api.nasa.gov', status: 'link' },
  { name: 'xAI docs', href: 'https://docs.x.ai', status: 'link' },
  { name: 'MCP servers', href: 'https://github.com/modelcontextprotocol/servers', status: 'link' },
];

const glow = 'border border-[#39FF14]/80 shadow-[0_0_0_1px_rgba(57,255,20,0.85),0_0_8px_rgba(57,255,20,0.45)]';

function LinkOut({ href, children }: { href?: string; children: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-mono text-[8px] tracking-wider text-[#7dffe0] underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

type Hub = {
  computer?: { name: string; online: boolean };
  phone?: { name: string; online: boolean };
  files?: { total: number; present: number };
  bluetooth?: { mac: string; name: string }[];
  models?: { name: string; live: boolean }[];
  agents?: { id: string; name: string; role: string }[];
};

export default function LaneDesk() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [mcp, setMcp] = useState<McpRow[]>(MCP_LINKS);
  const [hub, setHub] = useState<Hub | null>(null);
  const apps = MASA_SOCIAL_LINKS.filter(link => (APPS as readonly string[]).includes(link.id));
  const twitter = MASA_SOCIAL_LINKS.find(link => link.id === 'x');

  useEffect(() => {
    fetch('/api/masa/agents').then(r => r.json()).then(d => setAgents(d.agents || [])).catch(() => {});
    fetch('/api/masa/providers').then(r => r.json()).then(d => setProviders(d.providers || [])).catch(() => {});
    fetch('/api/masa/integrations').then(r => r.json()).then(d => {
      const rows = ((d.integrations || []) as IntegrationRow[])
        .filter(item => item.kind === 'mcp')
        .map(item => ({ name: item.name, status: item.status, href: item.source.startsWith('http') ? item.source : undefined }));
      setMcp(prev => [...rows, ...prev.filter(row => !rows.some(item => item.name === row.name))]);
    }).catch(() => {});
    fetch('/api/masa/mcp-live').then(r => r.json()).then(d => {
      const live = (d.servers || []) as McpRow[];
      if (live.length) setMcp(prev => [...live, ...prev]);
    }).catch(() => {});
    const pullHub = () => fetch('/api/hub').then(r => r.json()).then(setHub).catch(() => {});
    pullHub();
    const timer = setInterval(pullHub, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-panel flex max-h-[70vh] w-80 flex-col overflow-hidden pointer-events-auto">
      <div className="border-b border-white/10 px-3 py-2">
        <div className="font-mono text-[10px] tracking-[0.22em] text-[var(--gold-primary)]">LANE</div>
        <div className="mt-1 font-mono text-[8px] leading-relaxed text-white/45">You sign in on the real site. This desk only opens the login.</div>
      </div>
      <div className="styled-scrollbar flex-1 space-y-3 overflow-y-auto px-2 py-2">
        <section>
          <div className="mb-1 font-mono text-[8px] tracking-[0.2em] text-white/40">LIVE</div>
          <div className="space-y-1">
            <div className={`rounded-md px-2 py-1 font-mono text-[10px] text-white/85 ${glow}`}>COMPUTER · {hub?.computer?.name || '…'}</div>
            <div className={`rounded-md px-2 py-1 font-mono text-[10px] text-white/85 ${hub?.phone?.online ? glow : 'border border-white/10'}`}>PHONE · {hub?.phone?.name || 'iphone'} · {hub?.phone?.online ? 'ONLINE' : 'OFFLINE'}</div>
            <div className={`rounded-md px-2 py-1 font-mono text-[10px] text-white/85 ${glow}`}>FILES · {hub?.files ? `${hub.files.present}/${hub.files.total} ON DISK` : '…'}</div>
            {(hub?.bluetooth || []).map(device => (
              <div key={device.mac} className={`rounded-md px-2 py-1 font-mono text-[10px] text-white/85 ${glow}`}>BT · {device.name}</div>
            ))}
            {(hub?.models || []).map(model => (
              <div key={model.name} className={`rounded-md px-2 py-1 font-mono text-[10px] text-white/85 ${model.live ? glow : 'border border-white/10'}`}>{model.name} · {model.live ? 'LIVE' : 'DOWN'}</div>
            ))}
            <div className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-white/70">AGENTS LIVE · {hub?.agents?.length ?? 0}</div>
          </div>
        </section>

        <section>
          <div className="mb-1 font-mono text-[8px] tracking-[0.2em] text-white/40">APPS</div>
          <div className="flex flex-wrap gap-1">
            {twitter && <a href={twitter.login} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/15 px-2 py-1 font-mono text-[9px] text-white/80 hover:bg-white/10">TWITTER</a>}
            {apps.map(app => (
              <a key={app.id} href={app.login} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/15 px-2 py-1 font-mono text-[9px] text-white/80 hover:bg-white/10">
                {app.name.toUpperCase()}
              </a>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-1 font-mono text-[8px] tracking-[0.2em] text-white/40">AGENTS</div>
          {agents.map(agent => (
            <div key={agent.id} className="mb-1 rounded-md border border-white/10 px-2 py-1">
              <div className="font-mono text-[10px] text-white/85">{agent.name}</div>
              <div className="font-mono text-[8px] text-white/40">{agent.role} · {agent.interface} · {agent.status}</div>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-1 font-mono text-[8px] tracking-[0.2em] text-white/40">MODELS</div>
          {MODEL_BENCH.map(model => (
            <div key={model.id} className={`mb-1 rounded-md px-2 py-1 ${model.cost === 'free' ? glow : 'border border-white/10'}`}>
              <div className="font-mono text-[10px] text-white/85">{model.name}</div>
              <div className="font-mono text-[8px] text-white/40">{model.provider} · {model.model} · {model.cost}</div>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-1 font-mono text-[8px] tracking-[0.2em] text-white/40">PROVIDERS</div>
          {providers.map(provider => (
            <div key={provider.id} className={`mb-1 rounded-md px-2 py-1 ${provider.free ? glow : 'border border-white/10'}`}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/85">{provider.name}</span>
                {provider.free && <span className="font-mono text-[8px] text-[#39FF14]">FREE</span>}
              </div>
              <div className="mt-0.5 flex gap-2">
                <LinkOut href={provider.website}>SITE</LinkOut>
                <LinkOut href={provider.docs}>DOCS</LinkOut>
              </div>
              {!!provider.models?.length && <div className="font-mono text-[8px] text-white/35">{provider.models.slice(0, 3).join(' · ')}</div>}
            </div>
          ))}
        </section>

        <section>
          <div className="mb-1 font-mono text-[8px] tracking-[0.2em] text-white/40">MCP</div>
          {mcp.map(row => (
            <div key={`${row.name}-${row.transport || row.href || ''}`} className="mb-1 rounded-md border border-white/10 px-2 py-1">
              <div className="font-mono text-[10px] text-white/85">{row.name}</div>
              <div className="flex gap-2 font-mono text-[8px] text-white/40">
                <span>{row.transport || row.status || 'mcp'}</span>
                <LinkOut href={row.href}>LINK</LinkOut>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
