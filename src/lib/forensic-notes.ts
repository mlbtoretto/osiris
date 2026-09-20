export type ForensicNote = {
  id: string;
  ts: string;
  title: string;
  body: string;
  agent: string;
  planet: string;
  tags: string[];
};

export const FORENSIC_AGENTS = [
  'qruella-deval',
  'magic',
  'quantum',
  'void',
  'hermes',
  'osiris',
] as const;
