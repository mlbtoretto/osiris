import { NextRequest, NextResponse } from 'next/server';

/** Simultaneous graphical redesign: DeepSeek + Kimi. Does not rewrite the globe. */

async function chat(url: string, key: string, model: string, prompt: string) {
  const res = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are a HUD designer for MASA IA, a gold-on-black intelligence globe. Propose CSS/layout only. Do not replace the map engine. 120 words max.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}`);
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { brief?: string } | null;
  const brief = String(body?.brief || 'Beautiful frame around the live globe. NASA humanoid, gold corners, never hide the map.');
  const ds = process.env.DEEPSEEK_API_KEY;
  const km = process.env.MOONSHOT_API_KEY;
  const out: Record<string, string> = {};
  try {
    if (ds) out.deepseek = await chat('https://api.deepseek.com', ds, 'deepseek-flash', brief);
  } catch (e) { out.deepseek = e instanceof Error ? e.message : 'deepseek failed'; }
  try {
    if (km) out.kimi = await chat('https://api.moonshot.ai/v1', km, 'kimi-k3', brief);
  } catch (e) { out.kimi = e instanceof Error ? e.message : 'kimi failed'; }
  if (!ds && !km) {
    out.note = 'Set DEEPSEEK_API_KEY and MOONSHOT_API_KEY for dual redesign. Frame CSS is already live without them.';
  }
  return NextResponse.json({ pair: ['deepseek-flash', 'kimi-k3'], out });
}
