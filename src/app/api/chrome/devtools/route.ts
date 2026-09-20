import { spawn } from 'node:child_process';
import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';

const CDP = 'http://127.0.0.1:9222';
const BIN = process.env.OSIRIS_CHROME || '/usr/bin/chromium';

async function cdp(path: string, init?: RequestInit) {
  const res = await fetch(`${CDP}${path}`, { ...init, signal: AbortSignal.timeout(4000) });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, json: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, json: text }; }
}

function sendCdp(wsUrl: string, method: string, params: Record<string, unknown> = {}) {
  return new Promise<unknown>((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const id = 1;
    const timer = setTimeout(() => { ws.close(); reject(new Error('cdp timeout')); }, 8000);
    ws.on('open', () => ws.send(JSON.stringify({ id, method, params })));
    ws.on('message', raw => {
      const msg = JSON.parse(String(raw));
      if (msg.id === id) {
        clearTimeout(timer);
        ws.close();
        if (msg.error) reject(new Error(msg.error.message || 'cdp error'));
        else resolve(msg.result);
      }
    });
    ws.on('error', err => { clearTimeout(timer); reject(err); });
  });
}

export async function GET() {
  try {
    const version = await cdp('/json/version');
    const tabs = await cdp('/json/list');
    return NextResponse.json({
      attached: version.ok,
      version: version.json,
      tabs: tabs.json,
      endpoint: CDP,
      access: 'local-full',
    });
  } catch {
    return NextResponse.json({ attached: false, endpoint: CDP, hint: 'POST { action: "launch" }' });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    action?: string;
    url?: string;
    expression?: string;
    ws?: string;
  } | null;
  const action = body?.action || 'status';

  if (action === 'launch') {
    spawn(BIN, [
      '--remote-debugging-port=9222',
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${process.env.HOME}/.osiris-chrome`,
      '--no-first-run',
      '--disable-sync',
      'about:blank',
    ], { detached: true, stdio: 'ignore' }).unref();
    await new Promise(r => setTimeout(r, 1200));
    return GET();
  }

  if (action === 'new') {
    const url = String(body?.url || 'about:blank');
    if (!/^https?:/i.test(url) && url !== 'about:blank') {
      return NextResponse.json({ error: 'http(s) or about:blank only' }, { status: 400 });
    }
    const opened = await cdp(`/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    return NextResponse.json(opened);
  }

  const tabs = await cdp('/json/list');
  const list = Array.isArray(tabs.json) ? tabs.json : [];
  const page = list.find((t: { type?: string; webSocketDebuggerUrl?: string }) => t.type === 'page' && t.webSocketDebuggerUrl)
    || list.find((t: { webSocketDebuggerUrl?: string }) => t.webSocketDebuggerUrl);
  const ws = body?.ws || page?.webSocketDebuggerUrl;
  if (!ws) return NextResponse.json({ error: 'no page websocket — launch Chrome' }, { status: 409 });

  try {
    if (action === 'navigate') {
      const url = String(body?.url || '');
      if (!/^https?:/i.test(url)) return NextResponse.json({ error: 'https only' }, { status: 400 });
      const result = await sendCdp(ws, 'Page.navigate', { url });
      return NextResponse.json({ result });
    }
    if (action === 'eval') {
      const expression = String(body?.expression || '').slice(0, 8000);
      const result = await sendCdp(ws, 'Runtime.evaluate', { expression, returnByValue: true });
      return NextResponse.json({ result });
    }
    if (action === 'screenshot') {
      await sendCdp(ws, 'Page.enable');
      const result = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' }) as { data?: string };
      return NextResponse.json({ png: result.data ? `data:image/png;base64,${result.data}` : null });
    }
    if (action === 'dom') {
      await sendCdp(ws, 'DOM.enable');
      const result = await sendCdp(ws, 'DOM.getDocument', { depth: 2 });
      return NextResponse.json({ result });
    }
    if (action === 'console') {
      await sendCdp(ws, 'Runtime.enable');
      await sendCdp(ws, 'Console.enable');
      return NextResponse.json({ ok: true, note: 'console enabled on this target' });
    }
    if (action === 'network') {
      await sendCdp(ws, 'Network.enable');
      return NextResponse.json({ ok: true, note: 'network domain enabled' });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'cdp failed' }, { status: 502 });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
