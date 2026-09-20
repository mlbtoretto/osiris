import { ARMY_MAX_TOKENS } from './agent-army';

export const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'horus';

export async function ollamaChat(system: string, user: string, imageDataUrl?: string) {
  const content: Array<Record<string, unknown>> = [{ type: 'text', text: user }];
  if (imageDataUrl?.startsWith('data:image')) {
    const b64 = imageDataUrl.split(',')[1];
    if (b64 && b64.length < 2_500_000) content.push({ type: 'image_url', image_url: { url: imageDataUrl } });
  }
  const maxTokens = ARMY_MAX_TOKENS;
  const res = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(180000),
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const json = await res.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } };
  return {
    text: json.choices?.[0]?.message?.content || '',
    usage: {
      prompt: json.usage?.prompt_tokens || 0,
      completion: json.usage?.completion_tokens || 0,
      total: json.usage?.total_tokens || 0,
      model: `ollama/${OLLAMA_MODEL}`,
      maxTokens,
    },
  };
}
