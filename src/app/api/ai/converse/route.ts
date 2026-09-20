import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { COMMANDER_PROMPT, INSCRIPTION } from '@/lib/inscription';
import { SWARM_SIZE } from '@/lib/swarm';
import { ARMY_MAX_TOKENS } from '@/lib/agent-army';
import { parseScene, type Enrolled } from '@/lib/vision-scene';
import { ollamaChat } from '@/lib/ollama';

const TRACE = path.join(process.cwd(), 'data', 'langsmith-local.jsonl');

function firstKey() {
  for (const name of ['GEMINI_API_KEY', 'GEMINI_API_KEY_1', 'GOOGLE_API_KEY']) {
    const v = process.env[name]?.trim();
    if (v) return v;
  }
  return '';
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    text?: string;
    image?: string;
    agent?: string;
    planet?: string;
  } | null;
  const text = String(body?.text || '').trim().slice(0, 4000);
  if (!text && !body?.image) {
    return NextResponse.json({ error: 'speech or frame required' }, { status: 400 });
  }

  const agent = String(body?.agent || 'osiris');
  const planet = String(body?.planet || 'earth');
  let enrolled: Enrolled[] = [];
  try {
    const raw = JSON.parse(await readFile(path.join(process.cwd(), 'data', 'vision-enroll.json'), 'utf8'));
    enrolled = Array.isArray(raw) ? raw : [];
  } catch { /* none yet */ }
  const roster = enrolled.map(e => `${e.kind}:${e.name}`).join(', ') || 'none';
  const system = `${COMMANDER_PROMPT}
Swarm size ${SWARM_SIZE}. Callsign ${INSCRIPTION.callsign}. One voice, one vision.
Realtime conversation. Identify objects in the frame. If a person is visible, say so.
Only name a person if they match an enrolled label the operator taught. Otherwise label them "unknown person". Do not invent identities. Do not build a stranger watchlist.
Enrolled (operator-taught): ${roster}
Respond with JSON only:
{"reply":"spoken answer under 80 words","objects":["..."],"persons":[{"label":"unknown|enrolled-name","confidence":"low|med|high"}]}`;

  let reply = `Heard. ${text || 'Visual only.'} Correlated on ${planet} via ${agent}.`;
  let usage = { prompt: 0, completion: 0, total: 0, model: 'local' };
  const userTurn = text || '(no speech)';
  try {
    const local = await ollamaChat(system, userTurn, body?.image);
    if (local.text) {
      reply = local.text;
      usage = local.usage;
    }
  } catch {
    /* fall through to Gemini */
  }
  const key = firstKey();
  if (usage.model === 'local' && key) {
    try {
      const model = new GoogleGenerativeAI(key).getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { maxOutputTokens: Math.min(ARMY_MAX_TOKENS, 8192) },
      });
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: `${system}\n\nOperator: ${text || '(no speech)'}` },
      ];
      if (body?.image?.startsWith('data:image')) {
        const [, meta, data] = body.image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/) || [];
        if (meta && data && data.length < 2_500_000) {
          parts.push({ inlineData: { mimeType: meta, data } });
        }
      }
      const result = await model.generateContent(parts);
      reply = result.response.text() || reply;
      const meta = result.response.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined;
      usage = {
        prompt: meta?.promptTokenCount || 0,
        completion: meta?.candidatesTokenCount || 0,
        total: meta?.totalTokenCount || 0,
        model: 'gemini-2.0-flash',
      };
    } catch (err) {
      reply = `${reply} (model unavailable: ${err instanceof Error ? err.message : 'error'})`;
    }
  }

  const trace = {
    id: `run-${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    agent,
    planet,
    tool: 'voice-vision',
    input: text,
    output: reply.slice(0, 2000),
    usage,
  };
  try {
    await mkdir(path.dirname(TRACE), { recursive: true });
    await appendFile(TRACE, `${JSON.stringify(trace)}\n`);
  } catch { /* local trace is best-effort */ }

  const smith = process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY;
  if (smith) {
    fetch('https://api.smith.langchain.com/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': smith },
      body: JSON.stringify({
        id: trace.id,
        name: 'osiris-converse',
        run_type: 'chain',
        inputs: { text, planet, agent },
        outputs: { reply },
        start_time: trace.ts,
        end_time: trace.ts,
      }),
    }).catch(() => {});
  }

  const scene = parseScene(reply, reply);
  return NextResponse.json({ reply: scene.reply, scene, trace, usage, enrolled: enrolled.slice(0, 20) });
}
