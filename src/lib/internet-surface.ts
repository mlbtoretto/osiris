/** Full-internet OSINT surface. Raw racks, commercial called commercial. */

export type UseClass = 'oss' | 'commercial' | 'hybrid' | 'public-api';

export type NetLayer =
  | 'surface'
  | 'dns'
  | 'identity'
  | 'social'
  | 'code'
  | 'iot'
  | 'dark'
  | 'archive'
  | 'geo'
  | 'crypto'
  | 'msg'
  | 'threat'
  | 'link'
  | 'media';

export type SurfaceTool = {
  id: string;
  name: string;
  desk: string;
  layer: NetLayer;
  use: UseClass;
  href: string;
  bin?: string;
  osirisTab?: string;
  planet: 'earth' | 'ares' | 'styx' | 'iris' | 'nemesis';
};

export const ROBIN_ENGINES = [
  'Ahmia', 'OnionLand', 'Torgle', 'Amnesia', 'Kaizer', 'Anima',
  'Tornado', 'TorNet', 'Torland', 'Find Tor', 'Excavator',
  'Onionway', 'Tor66', 'OSS', 'Torgol', 'The Deep Searches',
] as const;

export const INTERNET_LAYERS: { id: NetLayer; name: string; holds: string }[] = [
  { id: 'surface', name: 'SURFACE WEB', holds: 'Live sites, headers, stack, subdomains' },
  { id: 'dns', name: 'DNS / PKI', holds: 'WHOIS, DNS, certs, TLS' },
  { id: 'identity', name: 'IDENTITY', holds: 'Phone, email, username, OSINT Industries' },
  { id: 'social', name: 'SOCIAL', holds: 'ShadowDragon SocialNet, handles' },
  { id: 'code', name: 'CODE', holds: 'GitHub recon' },
  { id: 'iot', name: 'EXPOSED / IoT', holds: 'Shodan, Censys, InternetDB' },
  { id: 'dark', name: 'DARK WEB', holds: 'Robin + 16 onion engines — observe only' },
  { id: 'archive', name: 'ARCHIVE', holds: 'Wayback, cached copies' },
  { id: 'geo', name: 'GEO', holds: 'Globe, Earth Enterprise, CCTV, ADS-B' },
  { id: 'crypto', name: 'CHAIN', holds: 'Wallets, OFAC, markets' },
  { id: 'msg', name: 'MESSAGING', holds: 'Telegram desk, signal-cli' },
  { id: 'threat', name: 'THREAT', holds: 'Leaks, ATT&CK, reputation' },
  { id: 'link', name: 'LINK ANALYSIS', holds: 'Maltego, SpiderFoot' },
  { id: 'media', name: 'MEDIA', holds: 'ExifTool image forensics' },
];

export const SURFACE_TOOLS: SurfaceTool[] = [
  { id: 'osiris-recon', name: 'MASA RECON', desk: 'Built-in surface recon', layer: 'surface', use: 'oss', href: '/', osirisTab: 'scanner', planet: 'earth' },
  { id: 'headers', name: 'HEADERS', desk: 'Security headers', layer: 'surface', use: 'public-api', href: '/', osirisTab: 'headers', planet: 'earth' },
  { id: 'tech', name: 'TECH DETECT', desk: 'Stack fingerprint', layer: 'surface', use: 'public-api', href: '/', osirisTab: 'tech', planet: 'earth' },
  { id: 'subdomains', name: 'SUBDOMAINS', desk: 'Attack surface enum', layer: 'surface', use: 'public-api', href: '/', osirisTab: 'subdomains', planet: 'earth' },
  { id: 'dns', name: 'DNS', desk: 'All record types', layer: 'dns', use: 'public-api', href: '/', osirisTab: 'dns', planet: 'earth' },
  { id: 'whois', name: 'WHOIS', desk: 'Registrar / ownership', layer: 'dns', use: 'public-api', href: '/', osirisTab: 'whois', planet: 'earth' },
  { id: 'certs', name: 'CERTS', desk: 'Certificate transparency', layer: 'dns', use: 'public-api', href: 'https://crt.sh/', osirisTab: 'certs', planet: 'earth' },
  { id: 'ssl', name: 'TLS', desk: 'Cipher and cert health', layer: 'dns', use: 'public-api', href: '/', osirisTab: 'ssl', planet: 'earth' },
  { id: 'phoneintel', name: 'PHONEINTEL', desk: 'Carrier / line type', layer: 'identity', use: 'oss', href: '/home/kingmlb/Projects/lab/vendor/phoneintel-main', osirisTab: 'phone', planet: 'earth' },
  { id: 'skip-trace', name: 'SKIP-TRACE', desk: 'Identity pivot (authorized only)', layer: 'identity', use: 'oss', href: '/home/kingmlb/Projects/lab/vendor/skip-trace-main', planet: 'earth' },
  { id: 'osint-industries', name: 'OSINT INDUSTRIES', desk: 'Commercial identity lookup', layer: 'identity', use: 'commercial', href: 'https://osint.industries/', planet: 'iris' },
  { id: 'username', name: 'USERNAME', desk: 'Handle hunt', layer: 'social', use: 'public-api', href: '/', osirisTab: 'username', planet: 'iris' },
  { id: 'shadowdragon', name: 'SHADOWDRAGON', desk: 'SocialNet commercial', layer: 'social', use: 'commercial', href: 'https://shadowdragon.io/', planet: 'styx' },
  { id: 'github', name: 'GITHUB', desk: 'Code recon', layer: 'code', use: 'public-api', href: 'https://github.com/', osirisTab: 'github', planet: 'earth' },
  { id: 'shodan', name: 'SHODAN', desk: 'Exposed devices', layer: 'iot', use: 'hybrid', href: 'https://www.shodan.io/', bin: 'shodan', osirisTab: 'shodan', planet: 'ares' },
  { id: 'censys', name: 'CENSYS', desk: 'Internet-wide scan data', layer: 'iot', use: 'commercial', href: 'https://search.censys.io/', planet: 'ares' },
  { id: 'robin', name: 'ROBIN', desk: 'Dark-web OSINT (Tor)', layer: 'dark', use: 'oss', href: '/home/kingmlb/Projects/robin', planet: 'styx' },
  { id: 'wayback', name: 'WAYBACK', desk: 'Internet Archive', layer: 'archive', use: 'public-api', href: 'https://web.archive.org/', planet: 'earth' },
  { id: 'earth-ent', name: 'EARTH ENTERPRISE', desk: 'Photoreal globe', layer: 'geo', use: 'oss', href: '/home/kingmlb/Projects/lab/vendor/earthenterprise-master', planet: 'earth' },
  { id: 'gev', name: "GOD'S EYE VIEW", desk: 'Cesium real globe', layer: 'geo', use: 'oss', href: '/home/kingmlb/Projects/lab/vendor/gods-eye-view-main', planet: 'earth' },
  { id: 'crypto', name: 'CHAIN INTEL', desk: 'Wallet / OFAC', layer: 'crypto', use: 'public-api', href: '/', osirisTab: 'crypto', planet: 'earth' },
  { id: 'signal-cli', name: 'SIGNAL-CLI', desk: 'Signal desk', layer: 'msg', use: 'oss', href: '/home/kingmlb/Projects/lab/vendor/signal-cli-master', planet: 'iris' },
  { id: 'telegram', name: 'TELEGRAM DESK', desk: 'OpenClaw channel watch', layer: 'msg', use: 'hybrid', href: '/home/kingmlb/.openclaw/openclaw.json', planet: 'iris' },
  { id: 't3mp3st', name: 'T3MP3ST', desk: 'War Room — authorized red-team only', layer: 'threat', use: 'oss', href: 'http://127.0.0.1:3333/ui/', planet: 'ares' },
  { id: 'hexstrike', name: 'HEXSTRIKE', desk: 'HexStrike AI project', layer: 'threat', use: 'oss', href: '/home/kingmlb/Projects/hexstrike-ai', planet: 'ares' },
  { id: 'agent-zero', name: 'AGENT ZERO', desk: 'Agent Zero project', layer: 'code', use: 'oss', href: '/home/kingmlb/Projects/agent-zero', planet: 'earth' },
  { id: 'penligent', name: 'PENLIGENT', desk: 'Penligent project', layer: 'threat', use: 'oss', href: '/home/kingmlb/Projects/penligent', planet: 'ares' },
  { id: 'mcp-hydra', name: 'MCP HYDRA', desk: 'MCP Hydra project', layer: 'code', use: 'oss', href: '/home/kingmlb/Projects/mcp-hydra', planet: 'earth' },
  { id: 'threats', name: 'THREATS', desk: 'Reputation feeds', layer: 'threat', use: 'public-api', href: '/', osirisTab: 'threats', planet: 'ares' },
  { id: 'leaks', name: 'LEAKS', desk: 'Breach exposure', layer: 'threat', use: 'hybrid', href: '/', osirisTab: 'leaks', planet: 'ares' },
  { id: 'mitre', name: 'MITRE ATT&CK', desk: 'Adversary catalog', layer: 'threat', use: 'oss', href: '/home/kingmlb/Projects/lab/vendor/mitreattack-python-main', planet: 'ares' },
  { id: 'maltego', name: 'MALTEGO', desk: 'Link analysis', layer: 'link', use: 'commercial', href: 'https://www.maltego.com/', bin: 'maltego', planet: 'ares' },
  { id: 'spiderfoot', name: 'SPIDERFOOT', desk: 'OSINT CLI graph', layer: 'link', use: 'hybrid', href: 'https://github.com/smicallef/spiderfoot', bin: 'sf', planet: 'ares' },
  { id: 'exiftool', name: 'EXIFTOOL', desk: 'Image forensics', layer: 'media', use: 'oss', href: 'https://exiftool.org/', bin: 'exiftool', planet: 'nemesis' },
];

export const UNIFIED_TOOLS = SURFACE_TOOLS;
