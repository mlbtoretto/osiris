/** WMO weather interpretation codes used by Open-Meteo. */

export const WMO_LABEL: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain',
  85: 'Snow showers',
  86: 'Snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

export function wmoLabel(code: number | null | undefined): string {
  if (code == null || !Number.isFinite(code)) return 'Unknown';
  return WMO_LABEL[Math.round(code)] || 'Unknown';
}

export function parseCoord(value: string | null, min: number, max: number): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export type LocalWeather = {
  lat: number;
  lng: number;
  timezone: string;
  localTime: string;
  temperatureC: number | null;
  feelsLikeC: number | null;
  humidity: number | null;
  windKph: number | null;
  windDir: number | null;
  precipitationMm: number | null;
  weatherCode: number | null;
  condition: string;
  isDay: boolean;
  source: 'Open-Meteo';
  fetchedAt: string;
};
