export type Enrolled = {
  id: string;
  name: string;
  kind: 'person' | 'object';
  note: string;
  ts: string;
};

export type Scene = {
  reply: string;
  objects: string[];
  persons: { label: string; confidence: string }[];
};

export function parseScene(raw: string, fallback: string): Scene {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const d = JSON.parse(jsonMatch[0]) as Partial<Scene>;
      return {
        reply: String(d.reply || fallback).slice(0, 2000),
        objects: Array.isArray(d.objects) ? d.objects.map(String).slice(0, 24) : [],
        persons: Array.isArray(d.persons)
          ? d.persons.map(p => ({
            label: String((p as { label?: string }).label || 'unknown').slice(0, 80),
            confidence: String((p as { confidence?: string }).confidence || 'low').slice(0, 16),
          })).slice(0, 8)
          : [],
      };
    } catch { /* fall through */ }
  }
  return { reply: fallback || raw, objects: [], persons: [] };
}

export function enrollFromSpeech(text: string): { name: string; kind: 'person' | 'object' } | null {
  const m = text.match(/^(?:this is|that's|that is|meet|call this)\s+(.+)$/i);
  if (!m) return null;
  const name = m[1].replace(/[.!?]+$/, '').trim().slice(0, 80);
  if (!name) return null;
  const kind = /\b(person|man|woman|kid|operator|me|i am)\b/i.test(text) ? 'person' : 'object';
  return { name, kind };
}
