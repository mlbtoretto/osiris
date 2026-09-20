import { NextRequest, NextResponse } from 'next/server';
import { parseCoord, wmoLabel, type LocalWeather } from '@/lib/local-weather';

/**
 * Real-time conditions at a point. Open-Meteo is keyless and global.
 * Used by the globe HUD so the operator sees THEIR weather, not a generic feed.
 */
export async function GET(request: NextRequest) {
  const lat = parseCoord(request.nextUrl.searchParams.get('lat'), -90, 90);
  const lng = parseCoord(request.nextUrl.searchParams.get('lng'), -180, 180);
  if (lat == null || lng == null) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('current', [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'weather_code',
    'wind_speed_10m',
    'wind_direction_10m',
    'precipitation',
    'is_day',
  ].join(','));
  url.searchParams.set('timezone', 'auto');

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
      headers: { Accept: 'application/json', 'User-Agent': 'OSIRIS/local-weather' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'weather upstream failed' }, { status: 502 });
    }
    const data = await res.json() as {
      timezone?: string;
      current?: {
        time?: string;
        temperature_2m?: number;
        apparent_temperature?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        wind_direction_10m?: number;
        precipitation?: number;
        is_day?: number;
      };
    };
    const cur = data.current || {};
    const body: LocalWeather = {
      lat,
      lng,
      timezone: data.timezone || 'UTC',
      localTime: cur.time || new Date().toISOString(),
      temperatureC: cur.temperature_2m ?? null,
      feelsLikeC: cur.apparent_temperature ?? null,
      humidity: cur.relative_humidity_2m ?? null,
      windKph: cur.wind_speed_10m ?? null,
      windDir: cur.wind_direction_10m ?? null,
      precipitationMm: cur.precipitation ?? null,
      weatherCode: cur.weather_code ?? null,
      condition: wmoLabel(cur.weather_code),
      isDay: cur.is_day === 1,
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'weather fetch failed' }, { status: 502 });
  }
}
