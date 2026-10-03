import { NextRequest, NextResponse } from 'next/server';
import {
  createTraceSession,
  getTraceSession,
  traceEvent,
  endTraceEvent,
  closeTraceSession,
  getRecentTraces,
  getSessionTraces,
  createSandbox,
  executeInSandbox,
  destroySandbox,
  executeFUD,
  tracedWebRequest,
  getWebRequestTraces,
  getAllTraceRoutes,
} from '@/lib/langsmith-unified';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const sessionId = searchParams.get('sessionId');
  const eventId = searchParams.get('eventId');
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

  try {
    if (action === 'routes') {
      return NextResponse.json({ routes: getAllTraceRoutes() });
    }

    if (action === 'session' && sessionId) {
      const session = getTraceSession(sessionId);
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      return NextResponse.json({ session });
    }

    if (action === 'traces' && sessionId) {
      const traces = await getSessionTraces(sessionId);
      return NextResponse.json({ traces, count: traces.length });
    }

    if (action === 'recent') {
      const traces = await getRecentTraces(limit);
      return NextResponse.json({ traces, count: traces.length });
    }

    if (action === 'web-traces' && sessionId) {
      const traces = getWebRequestTraces(sessionId);
      return NextResponse.json({ traces, count: traces.length });
    }

    if (action === 'export' && sessionId) {
      const session = getTraceSession(sessionId);
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      return NextResponse.json({
        name: `masa-session-${sessionId}`,
        run_type: 'chain',
        inputs: { session_id: sessionId, agent: session.agent_id, planet: session.planet },
        outputs: { summary: session.summary },
        start_time: session.events[0]?.start_time,
        end_time: session.events[session.events.length - 1]?.end_time,
        events: session.events.map(e => ({
          id: e.id,
          name: e.name,
          run_type: e.run_type,
          inputs: e.inputs,
          outputs: e.outputs,
          start_time: e.start_time,
          end_time: e.end_time,
          extra: { metadata: e.metadata, tags: e.tags },
        })),
      });
    }

    return NextResponse.json({ routes: getAllTraceRoutes() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const sessionId = searchParams.get('sessionId');
  const eventId = searchParams.get('eventId');

  try {
    const body = await request.json().catch(() => ({})) as any;

    if (action === 'session-create') {
      const { agentId = 'masa', planet = 'earth' } = body;
      const sid = sessionId || `session-${Date.now().toString(36)}`;
      const session = await createTraceSession(sid, agentId, planet);
      return NextResponse.json({ ok: true, session });
    }

    if (action === 'session-close' && sessionId) {
      const session = await closeTraceSession(sessionId);
      return NextResponse.json({ ok: true, session });
    }

    if (action === 'trace' && sessionId) {
      const { type, name, run_type, inputs, metadata, tags, skillId, fudType, sandboxId } = body;
      const event = await traceEvent(sessionId, { type, name, run_type, inputs, metadata, tags, skill_id: skillId, fud_type: fudType, sandbox_id: sandboxId });
      return NextResponse.json({ ok: true, event });
    }

    if (action === 'trace-end' && sessionId && eventId) {
      const { outputs } = body;
      await endTraceEvent(sessionId, eventId, outputs || {});
      return NextResponse.json({ ok: true });
    }

    if (action === 'sandbox-create') {
      const sandbox = await createSandbox(body);
      return NextResponse.json({ ok: true, sandbox });
    }

    if (action === 'sandbox-execute' && sessionId) {
      const { sandboxId, command, args } = body;
      const result = await executeInSandbox(sandboxId, command, args || [], sessionId);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'sandbox-destroy') {
      const { sandboxId } = body;
      await destroySandbox(sandboxId);
      return NextResponse.json({ ok: true });
    }

    if (action === 'fud-execute' && sessionId) {
      const { type, payload, options } = body;
      const result = await executeFUD({ type, payload, options }, sessionId);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'web-request' && sessionId) {
      const { url, ...options } = body;
      const response = await tracedWebRequest(sessionId, url, options);
      return NextResponse.json({ ok: true, status: response.status });
    }

    return NextResponse.json({ error: 'Unknown action', available: getAllTraceRoutes().map(r => r.path) }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}