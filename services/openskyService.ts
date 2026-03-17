/**
 * OpenSky Network API - Live aircraft positions
 * https://openskynetwork.github.io/opensky-api/rest.html
 *
 * Anonymous rate limit: ~10s cache, daily quota ~400 credits (4 per /states/all call).
 * No in-request retries -- the hook handles backoff at the poll level.
 */

export interface OpenSkyState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export interface OpenSkyResponse {
  time: number;
  states: (string | number | null)[][] | null;
}

const OPENSKY_BASE = 'https://opensky-network.org/api';

export class RateLimitError extends Error {
  constructor() {
    super('OpenSky rate limited (429)');
    this.name = 'RateLimitError';
  }
}

export async function fetchAircraftStates(bbox?: {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}): Promise<OpenSkyState[]> {
  const params = new URLSearchParams();
  if (bbox) {
    params.set('lamin', String(bbox.lamin));
    params.set('lomin', String(bbox.lomin));
    params.set('lamax', String(bbox.lamax));
    params.set('lomax', String(bbox.lomax));
  }
  const url = `${OPENSKY_BASE}/states/all${params.toString() ? '?' + params.toString() : ''}`;
  console.log('[OpenSky] Request:', { bbox: bbox ?? 'all', url });

  const res = await fetch(url);
  console.log('[OpenSky] Response:', res.status, res.statusText);

  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error(`OpenSky API error: ${res.status}`);
  const data = (await res.json()) as OpenSkyResponse;
  const rawCount = data.states?.length ?? 0;
  const states = parseStates(data.states);
  console.log('[OpenSky] Parsed:', { rawRows: rawCount, aircraftWithPosition: states.length, sample: states.slice(0, 2) });
  return states;
}

const STATE_KEYS: (keyof OpenSkyState)[] = [
  'icao24', 'callsign', 'origin_country', 'time_position', 'last_contact',
  'longitude', 'latitude', 'baro_altitude', 'on_ground', 'velocity',
  'true_track', 'vertical_rate', 'sensors', 'geo_altitude', 'squawk', 'spi', 'position_source'
];

function parseStates(rows: (string | number | null)[][] | null): OpenSkyState[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    STATE_KEYS.forEach((key, i) => {
      obj[key] = row[i] ?? null;
    });
    return obj as OpenSkyState;
  }).filter((s) => s.latitude != null && s.longitude != null);
}
