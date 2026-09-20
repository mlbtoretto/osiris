import { OPERATOR_SITES, type OperatorSite } from './operator-sites';

export type PlanetId = 'earth' | 'ares' | 'styx' | 'iris' | 'nemesis';

export type Vault = {
  id: string;
  name: string;
  desk: string;
  x: number;
  y: number;
  files: { name: string; path: string }[];
};

export type Planet = {
  id: PlanetId;
  name: string;
  subtitle: string;
  holds: string;
  accent: string;
  atmosphere: string;
  background: string;
  tiles?: string;
};

export const PLANETS: Planet[] = [
  {
    id: 'earth',
    name: 'EARTH',
    subtitle: 'Public globe',
    holds: 'CCTV, ADS-B, weather, corp, farm, agents',
    accent: '#d4af37',
    atmosphere: 'rgba(0, 180, 255, 0.35)',
    background: 'radial-gradient(ellipse at 50% 40%, #123 0%, #04040a 70%)',
  },
  {
    id: 'ares',
    name: 'ARES',
    subtitle: 'Threat tracking',
    holds: 'Live threat desks and ATT&CK racks',
    accent: '#ff6b3d',
    atmosphere: 'rgba(255, 80, 40, 0.4)',
    background: 'radial-gradient(ellipse at 50% 40%, #3a1508 0%, #090304 70%)',
    tiles: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
  },
  {
    id: 'styx',
    name: 'STYX',
    subtitle: 'Dark-web watch',
    holds: 'Robin and darknet MCP vaults — observe only',
    accent: '#7c4dff',
    atmosphere: 'rgba(90, 40, 180, 0.45)',
    background: 'radial-gradient(ellipse at 50% 40%, #1a0a2a 0%, #03010a 70%)',
  },
  {
    id: 'iris',
    name: 'IRIS',
    subtitle: 'Telegram watch',
    holds: 'OpenClaw channel desk',
    accent: '#4fc3f7',
    atmosphere: 'rgba(80, 180, 255, 0.4)',
    background: 'radial-gradient(ellipse at 50% 40%, #082030 0%, #04040a 70%)',
  },
  {
    id: 'nemesis',
    name: 'NEMESIS',
    subtitle: 'Exploit-point racks',
    holds: 'Tool inventories only — no payloads',
    accent: '#ff3d3d',
    atmosphere: 'rgba(180, 20, 40, 0.4)',
    background: 'radial-gradient(ellipse at 50% 40%, #2a0608 0%, #050102 70%)',
  },
];

const V = '/home/kingmlb/Projects/lab/vendor';

export const PLANET_VAULTS: Record<Exclude<PlanetId, 'earth'>, Vault[]> = {
  ares: [
    {
      id: 'threat-core',
      name: 'THREAT CORE',
      desk: 'Tracking desk',
      x: 42,
      y: 38,
      files: [
        { name: 'MITRE ATT&CK', path: `${V}/mitreattack-python-main` },
        { name: 'HexStrike', path: '/home/kingmlb/Projects/hexstrike-ai' },
        { name: 'Maltego', path: 'https://www.maltego.com/' },
        { name: 'SpiderFoot', path: 'https://github.com/smicallef/spiderfoot' },
        { name: 'Shodan', path: 'https://www.shodan.io/' },
      ],
    },
    {
      id: 'bls',
      name: 'FIELD BIBLE',
      desk: 'Reference',
      x: 62,
      y: 55,
      files: [{ name: 'bls-bible', path: `${V}/bls-bible-development` }],
    },
  ],
  styx: [
    {
      id: 'robin',
      name: 'ROBIN',
      desk: 'Dark-web watch',
      x: 48,
      y: 44,
      files: [
        { name: 'Robin', path: '/home/kingmlb/Projects/robin' },
        { name: 'Robin engines', path: '/home/kingmlb/Projects/robin/search.py' },
        { name: 'darknet-mcp', path: `${V}/darknet-mcp-server-main` },
        { name: 'ShadowDragon', path: 'https://shadowdragon.io/' },
      ],
    },
  ],
  iris: [
    {
      id: 'telegram-desk',
      name: 'TELEGRAM DESK',
      desk: 'OpenClaw channel watch',
      x: 50,
      y: 46,
      files: [
        { name: 'OpenClaw telegram', path: '/home/kingmlb/.openclaw/openclaw.json' },
        { name: 'OSINT Industries', path: 'https://osint.industries/' },
      ],
    },
  ],
  nemesis: [
    {
      id: 'racks',
      name: 'TOOL RACKS',
      desk: 'Exploit-point inventory',
      x: 46,
      y: 40,
      files: [
        { name: 'HexStrike', path: '/home/kingmlb/Projects/hexstrike-ai' },
        { name: 'Hydra MCP', path: '/home/kingmlb/Projects/mcp-hydra' },
        { name: 'MITRE ATT&CK', path: `${V}/mitreattack-python-main` },
        { name: 'ExifTool', path: 'exiftool' },
      ],
    },
  ],
};

export function planetById(id: PlanetId): Planet {
  return PLANETS.find(p => p.id === id) || PLANETS[0];
}

export function nextPlanet(id: PlanetId, dir: 1 | -1): PlanetId {
  const i = PLANETS.findIndex(p => p.id === id);
  const n = (i + dir + PLANETS.length) % PLANETS.length;
  return PLANETS[n].id;
}

export function earthPortals(): OperatorSite[] {
  return OPERATOR_SITES;
}
