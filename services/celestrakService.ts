/**
 * Satellite TLE data + SGP4 propagation for satellite positions.
 * Primary: tle.ivanstanojevic.me (free, no auth, CORS-friendly)
 * Fallback: CelesTrak (may be geo-blocked)
 */

import { propagate, twoline2satrec, eciToGeodetic, gstime } from 'satellite.js';

export interface SatelliteOrbit {
  name: string;
  noradId: string;
  line1: string;
  line2: string;
  currentPos: { lat: number; lng: number; alt: number };
  orbitPath: { lat: number; lng: number; alt: number }[];
}

export type SatellitePosition = { lat: number; lng: number; alt: number };

const TLE_API_BASE = 'https://tle.ivanstanojevic.me/api/tle';
const TLE_PAGE_SIZE = 20;
const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements';

interface TleApiResponse {
  totalItems: number;
  member: { satelliteId: number; name: string; line1: string; line2: string }[];
}

/**
 * Fetch TLEs from the primary API (tle.ivanstanojevic.me).
 * Fetches multiple pages in parallel to get enough satellites.
 */
async function fetchTLEFromApi(totalDesired: number): Promise<{ name: string; line1: string; line2: string }[]> {
  const numPages = Math.ceil(totalDesired / TLE_PAGE_SIZE);
  const pagePromises = Array.from({ length: numPages }, (_, i) =>
    fetch(`${TLE_API_BASE}/?page_size=${TLE_PAGE_SIZE}&page=${i + 1}`)
      .then(async (res) => {
        if (!res.ok) return [];
        const data = (await res.json()) as TleApiResponse;
        return data.member.map((m) => ({ name: m.name, line1: m.line1, line2: m.line2 }));
      })
      .catch(() => [] as { name: string; line1: string; line2: string }[])
  );
  const pages = await Promise.all(pagePromises);
  return pages.flat().slice(0, totalDesired);
}

/**
 * Fetch TLE data from CelesTrak (fallback). Returns 3LE format.
 */
async function fetchTLEFromCelesTrak(group: string): Promise<{ name: string; line1: string; line2: string }[]> {
  const url = `${CELESTRAK_BASE}/gp.php?GROUP=${group}&FORMAT=3LE`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CelesTrak error: ${res.status}`);
  const text = await res.text();
  return parse3LE(text);
}

/**
 * Fetch TLE data, trying the primary API first, falling back to CelesTrak.
 */
export async function fetchTLE(group: string = 'active', count: number = 200): Promise<{ name: string; line1: string; line2: string }[]> {
  console.info('[satellites] Fetching TLE data', { group, count });
  try {
    const results = await fetchTLEFromApi(count);
    if (results.length > 0) {
      console.log('[satellites] TLE API response', {
        source: 'tle.ivanstanojevic.me',
        count: results.length,
        sample: results.slice(0, 5).map((satellite) => satellite.name),
        results,
      });
      return results;
    }
    console.warn('[satellites] Primary TLE API returned no results, falling back to CelesTrak', {
      group,
      count,
    });
  } catch (error) {
    console.warn('[satellites] Primary TLE API failed, falling back to CelesTrak', {
      group,
      count,
      error,
    });
  }

  const fallbackResults = await fetchTLEFromCelesTrak(group);
  console.log('[satellites] CelesTrak response', {
    source: 'celestrak.org',
    count: fallbackResults.length,
    sample: fallbackResults.slice(0, 5).map((satellite) => satellite.name),
    results: fallbackResults,
  });
  return fallbackResults;
}

function parse3LE(text: string): { name: string; line1: string; line2: string }[] {
  const lines = text.trim().split(/\r?\n/);
  const result: { name: string; line1: string; line2: string }[] = [];
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const name = lines[i].trim();
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      if (line1 && line2 && line1.length >= 69 && line2.length >= 69) {
        result.push({ name, line1, line2 });
      }
    }
  }
  return result;
}

function toGeodetic(
  position: { x: number; y: number; z: number },
  date: Date
): { lat: number; lng: number; alt: number } {
  const gmst = gstime(date);
  const gd = eciToGeodetic(position, gmst);
  const latDeg = (gd.latitude * 180) / Math.PI;
  const lngDeg = (gd.longitude * 180) / Math.PI;
  const altKm = gd.height;
  return { lat: latDeg, lng: lngDeg, alt: altKm };
}

/**
 * Propagate a satellite and compute current position + orbit path (sampled over ~90 min).
 */
export function computeOrbit(
  line1: string,
  line2: string,
  numSamples: number = 36
): { currentPos: { lat: number; lng: number; alt: number }; orbitPath: { lat: number; lng: number; alt: number }[] } {
  const satrec = twoline2satrec(line1, line2);
  const now = new Date();
  const positionAndVelocity = propagate(satrec, now);
  if (positionAndVelocity.position === false || positionAndVelocity.velocity === false) {
    return { currentPos: { lat: 0, lng: 0, alt: 0 }, orbitPath: [] };
  }
  const currentPos = toGeodetic(positionAndVelocity.position as { x: number; y: number; z: number }, now);

  const orbitPath: { lat: number; lng: number; alt: number }[] = [];
  const periodMin = 90;
  for (let i = 0; i <= numSamples; i++) {
    const t = new Date(now.getTime() + (i / numSamples) * periodMin * 60 * 1000);
    const pv = propagate(satrec, t);
    if (pv.position && pv.position !== false) {
      const pt = toGeodetic(pv.position as { x: number; y: number; z: number }, t);
      // Skip degenerate points that would corrupt Cesium's arc subdivision
      if (isFinite(pt.lat) && isFinite(pt.lng) && isFinite(pt.alt)) {
        orbitPath.push(pt);
      }
    }
  }
  return { currentPos, orbitPath };
}
