/** What HORUS-1 can actually see. Public, archive, space, globe — not other people's private machines. */

export const REACH = [
  { id: 'globe', name: 'LIVE EARTH', see: 'Esri satellite, MapLibre globe, your weather, CCTV already in Osiris, ADS-B' },
  { id: 'space', name: 'SPACE', see: 'ISS downlink, NASA APIs (DEMO_KEY), satellites, solar weather' },
  { id: 'surface', name: 'SURFACE WEB', see: 'DNS, WHOIS, certs, headers, Wayback, GitHub, news' },
  { id: 'exposed', name: 'EXPOSED NET', see: 'Shodan InternetDB, Censys (commercial), BGP' },
  { id: 'identity', name: 'IDENTITY', see: 'Phoneintel, username hunt, OSINT Industries (commercial)' },
  { id: 'social', name: 'SOCIAL', see: 'Handle hunt, ShadowDragon (commercial), Telegram desk' },
  { id: 'dark', name: 'DARK WEB', see: 'Robin + 16 onion engines, observe only, Tor when you run Robin' },
  { id: 'hidden', name: 'HIDDEN-IN-PUBLIC', see: 'Taken-down pages (Wayback CDX), cert logs (crt.sh), exposed boxes (Shodan). Not private accounts.' },
  { id: 'archive', name: 'ARCHIVE', see: 'Internet Archive / Wayback — pages that vanished' },
  { id: 'chain', name: 'CHAIN', see: 'BTC/ETH/SOL wallets, OFAC' },
  { id: 'media', name: 'MEDIA', see: 'ExifTool on images you drop, Chrome screenshots of tabs you open' },
  { id: 'chrome', name: 'BROWSER', see: 'Full local CDP: DOM, network, console, screenshot on this host' },
] as const;
