/** Operator cells across states — every inventory file is wired at least once. */

import {
  ALL_FILES,
  allFileIds,
  filesByIds,
  type InventoryFile,
} from './file-inventory';

export type OperatorKind = 'corp' | 'farm' | 'agent' | 'archive' | 'storm';

export type OperatorFile = {
  name: string;
  path: string;
  id?: string;
  href?: string;
  kind?: InventoryFile['kind'];
};

export type OperatorSite = {
  id: string;
  name: string;
  kind: OperatorKind;
  city: string;
  /** US state abbr when in the States; country region otherwise. */
  state: string;
  country: string;
  lat: number;
  lng: number;
  cover: string;
  files: OperatorFile[];
};

function pack(ids: string[]): OperatorFile[] {
  return filesByIds(ids).map(f => ({
    id: f.id,
    name: f.name,
    path: f.path,
    href: f.href,
    kind: f.kind,
  }));
}

/** Every site. Archive vault holds literally ALL_FILES so nothing is orphaned. */
export const OPERATOR_SITES: OperatorSite[] = [
  {
    id: 'corp-iraq',
    name: 'MASA IA CORP',
    kind: 'corp',
    city: 'Baghdad',
    state: 'IQ-BG',
    country: 'Iraq',
    lat: 33.315241,
    lng: 44.366067,
    cover: 'Main corporation. Globe core and agent command.',
    files: pack([
      'proj-osiris', 'vend-earth', 'vend-gev', 'vend-skills', 'vend-signal',
      'data-forensic', 'data-unified', 'data-patterns', 'url-masa',
    ]),
  },
  {
    id: 'storm-seattle',
    name: 'T3MP3ST STORM',
    kind: 'storm',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    lat: 47.6062,
    lng: -122.3321,
    cover: 'Real T3MP3ST War Room. Authorized red-team only. Port 3333.',
    files: pack(['proj-t3mp3st', 'url-t3-warroom', 'vend-mitre', 'proj-hexstrike']),
  },
  {
    id: 'farm-nyc',
    name: 'CRYPTO FARM',
    kind: 'farm',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    lat: 40.7484,
    lng: -73.9857,
    cover: 'Hash barn. Markets and opsec playbooks.',
    files: pack(['vend-crypto', 'vend-spacex', 'zip-crypto', 'zip-spacex']),
  },
  {
    id: 'agent-qruella',
    name: 'QRUELLA',
    kind: 'agent',
    city: 'Baghdad',
    state: 'IQ-BG',
    country: 'Iraq',
    lat: 33.3128,
    lng: 44.3615,
    cover: 'OpenClaw command cell.',
    files: pack(['home-openclaw', 'home-openclaw-ws', 'home-agents']),
  },
  {
    id: 'agent-magic',
    name: 'MAGIC',
    kind: 'agent',
    city: 'Basra',
    state: 'IQ-BA',
    country: 'Iraq',
    lat: 30.5081,
    lng: 47.7835,
    cover: 'OSINT cell.',
    files: pack(['vend-phone', 'vend-skip', 'zip-phone', 'zip-skip']),
  },
  {
    id: 'agent-quantum',
    name: 'QUANTUM',
    kind: 'agent',
    city: 'Erbil',
    state: 'IQ-AR',
    country: 'Iraq',
    lat: 36.1911,
    lng: 44.0092,
    cover: 'Red-team cell.',
    files: pack(['vend-mitre', 'proj-hexstrike', 'zip-mitre']),
  },
  {
    id: 'agent-void',
    name: 'VOID',
    kind: 'agent',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    lat: 40.706,
    lng: -74.011,
    cover: 'Ops cell on the farm.',
    files: pack(['proj-agent-zero', 'vend-cs50', 'zip-cs50']),
  },
  {
    id: 'agent-hermes',
    name: 'HERMES',
    kind: 'agent',
    city: 'Baghdad',
    state: 'IQ-BG',
    country: 'Iraq',
    lat: 33.325,
    lng: 44.38,
    cover: 'Hermes 4 node.',
    files: pack(['home-hermes', 'home-grok', 'home-claude']),
  },
  {
    id: 'lab-sf',
    name: 'LAB · CALIFORNIA',
    kind: 'archive',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    lat: 37.7749,
    lng: -122.4194,
    cover: 'Lab root + vendor skills / art generators.',
    files: pack([
      'proj-lab', 'proj-lab-src', 'proj-lab-config', 'proj-lab-readme',
      'vend-skills', 'vend-sparrow', 'zip-skills', 'zip-sparrow',
    ]),
  },
  {
    id: 'cell-austin',
    name: 'TOOL-X · TEXAS',
    kind: 'archive',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    lat: 30.2672,
    lng: -97.7431,
    cover: 'Tool-X + Earth Enterprise dump.',
    files: pack(['vend-toolx', 'vend-earth', 'zip-toolx', 'zip-earth']),
  },
  {
    id: 'cell-miami',
    name: 'DARKNET MCP · FLORIDA',
    kind: 'archive',
    city: 'Miami',
    state: 'FL',
    country: 'United States',
    lat: 25.7617,
    lng: -80.1918,
    cover: 'Darknet MCP + Robin observe lane.',
    files: pack(['vend-darknet', 'proj-robin', 'zip-darknet']),
  },
  {
    id: 'cell-chicago',
    name: 'HACKGPT · ILLINOIS',
    kind: 'archive',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    lat: 41.8781,
    lng: -87.6298,
    cover: 'HackGpt rack.',
    files: pack(['vend-hackgpt', 'zip-hackgpt']),
  },
  {
    id: 'cell-denver',
    name: 'SPACEX · COLORADO',
    kind: 'farm',
    city: 'Denver',
    state: 'CO',
    country: 'United States',
    lat: 39.7392,
    lng: -104.9903,
    cover: 'SpaceX API + orbital desk.',
    files: pack(['vend-spacex', 'zip-spacex', 'vend-gev', 'zip-gev']),
  },
  {
    id: 'cell-atlanta',
    name: 'THGTOA · GEORGIA',
    kind: 'archive',
    city: 'Atlanta',
    state: 'GA',
    country: 'United States',
    lat: 33.749,
    lng: -84.388,
    cover: 'THGTOA handbook archive.',
    files: pack(['vend-thgtoa', 'zip-thgtoa']),
  },
  {
    id: 'cell-phoenix',
    name: 'OMEGA · ARIZONA',
    kind: 'archive',
    city: 'Phoenix',
    state: 'AZ',
    country: 'United States',
    lat: 33.4484,
    lng: -112.074,
    cover: 'Omegacode CLI rack.',
    files: pack(['vend-omega', 'zip-omega']),
  },
  {
    id: 'cell-vegas',
    name: 'PROMPTS · NEVADA',
    kind: 'archive',
    city: 'Las Vegas',
    state: 'NV',
    country: 'United States',
    lat: 36.1699,
    lng: -115.1398,
    cover: 'System prompt archives + Fable clean.',
    files: pack(['vend-prompts', 'vend-fable', 'zip-prompts', 'zip-fable']),
  },
  {
    id: 'cell-boston',
    name: 'CS50 · MASSACHUSETTS',
    kind: 'archive',
    city: 'Boston',
    state: 'MA',
    country: 'United States',
    lat: 42.3601,
    lng: -71.0589,
    cover: 'CS50 curriculum dump.',
    files: pack(['vend-cs50', 'zip-cs50']),
  },
  {
    id: 'cell-dc',
    name: 'BLS · DISTRICT',
    kind: 'archive',
    city: 'Washington',
    state: 'DC',
    country: 'United States',
    lat: 38.9072,
    lng: -77.0369,
    cover: 'BLS Bible development.',
    files: pack(['vend-bls', 'zip-bls']),
  },
  {
    id: 'cell-portland',
    name: 'PENLIGENT · OREGON',
    kind: 'agent',
    city: 'Portland',
    state: 'OR',
    country: 'United States',
    lat: 45.5152,
    lng: -122.6784,
    cover: 'Penligent project cell.',
    files: pack(['proj-penligent']),
  },
  {
    id: 'cell-raleigh',
    name: 'MCP HYDRA · NORTH CAROLINA',
    kind: 'agent',
    city: 'Raleigh',
    state: 'NC',
    country: 'United States',
    lat: 35.7796,
    lng: -78.6382,
    cover: 'MCP Hydra project cell.',
    files: pack(['proj-mcp-hydra']),
  },
  {
    id: 'cell-detroit',
    name: 'SIGNAL · MICHIGAN',
    kind: 'archive',
    city: 'Detroit',
    state: 'MI',
    country: 'United States',
    lat: 42.3314,
    lng: -83.0458,
    cover: 'signal-cli messaging desk.',
    files: pack(['vend-signal', 'zip-signal']),
  },
  {
    id: 'vault-home',
    name: 'HOME VAULT',
    kind: 'archive',
    city: 'Omarchy',
    state: 'LOCAL',
    country: 'United States',
    lat: 34.0522,
    lng: -118.2437,
    cover: 'Work · Documents · Downloads · agent homes.',
    files: pack([
      'home-work', 'home-docs', 'home-downloads',
      'home-openclaw', 'home-hermes', 'home-grok', 'home-claude', 'home-agents',
    ]),
  },
  {
    id: 'vault-all',
    name: 'ALL FILES',
    kind: 'archive',
    city: 'Global',
    state: 'ALL',
    country: 'United States',
    lat: 39.8283,
    lng: -98.5795,
    cover: 'Literally every inventoried path on this machine.',
    files: ALL_FILES.map(f => ({
      id: f.id,
      name: f.name,
      path: f.path,
      href: f.href,
      kind: f.kind,
    })),
  },
];

export const KIND_COLOR: Record<OperatorKind, string> = {
  corp: '#d4af37',
  farm: '#14F195',
  agent: '#00e5ff',
  archive: '#b388ff',
  storm: '#ff6b35',
};

/** Flatten unique files across sites (vault-all already has every id). */
export function allWiredFiles(): OperatorFile[] {
  const seen = new Set<string>();
  const out: OperatorFile[] = [];
  for (const site of OPERATOR_SITES) {
    for (const f of site.files) {
      const key = f.id || f.path;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
    }
  }
  return out;
}

/** True when every inventory id appears on at least one site. */
export function inventoryCoverage(): { total: number; wired: number; missing: string[] } {
  const wired = new Set<string>();
  for (const site of OPERATOR_SITES) {
    for (const f of site.files) {
      if (f.id) wired.add(f.id);
    }
  }
  const missing = allFileIds().filter(id => !wired.has(id));
  return { total: ALL_FILES.length, wired: wired.size, missing };
}

export function sitesToGeoJSON() {
  return {
    type: 'FeatureCollection' as const,
    features: OPERATOR_SITES.map(site => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [site.lng, site.lat] },
      properties: {
        id: site.id,
        name: site.name,
        kind: site.kind,
        city: site.city,
        state: site.state,
        country: site.country,
        cover: site.cover,
        color: KIND_COLOR[site.kind],
        fileCount: site.files.length,
        files: site.files.map(f => f.name).join(' · '),
      },
    })),
  };
}
