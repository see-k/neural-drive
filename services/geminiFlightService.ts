/**
 * AI-Powered Flight Data via Gemini.
 *
 * Strategy: try googleSearch grounding first (15s timeout) for live data,
 * then fall back to the model's own knowledge (no tools) which is fast and
 * still produces realistic airline positions for the area.
 */

import { GoogleGenAI } from "@google/genai";
import { getStoredAPIKeys } from "../contexts/APIKeysContext";
import type { OpenSkyState } from "./openskyService";

const SEARCH_TIMEOUT_MS = 15_000;
const FALLBACK_TIMEOUT_MS = 30_000;

const getAI = () => {
  const { geminiApiKey } = getStoredAPIKeys();
  if (!geminiApiKey) {
    throw new Error("Gemini API Key is missing. Please configure it in settings.");
  }
  return new GoogleGenAI({ apiKey: geminiApiKey });
};

interface RawFlight {
  callsign?: string;
  origin_country?: string;
  latitude: number;
  longitude: number;
  baro_altitude?: number;
  true_track?: number;
  velocity?: number;
  on_ground?: boolean;
}

function toOpenSkyState(raw: RawFlight, index: number): OpenSkyState {
  const icao24 = `ai${String(index).padStart(4, "0")}`;
  return {
    icao24,
    callsign: raw.callsign ?? null,
    origin_country: raw.origin_country ?? "Unknown",
    time_position: null,
    last_contact: Date.now(),
    longitude: raw.longitude,
    latitude: raw.latitude,
    baro_altitude: raw.baro_altitude ?? null,
    on_ground: raw.on_ground ?? false,
    velocity: raw.velocity ?? null,
    true_track: raw.true_track ?? null,
    vertical_rate: null,
    sensors: null,
    geo_altitude: raw.baro_altitude ?? null,
    squawk: null,
    spi: false,
    position_source: 0,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1].trim());

  const bracketStart = text.indexOf("[");
  if (bracketStart !== -1) {
    const bracketEnd = text.lastIndexOf("]");
    if (bracketEnd > bracketStart) return JSON.parse(text.slice(bracketStart, bracketEnd + 1));
  }

  return JSON.parse(text);
}

function parseFlights(text: string): OpenSkyState[] {
  const parsed = extractJSON(text) as RawFlight[];
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((r) => typeof r.latitude === "number" && typeof r.longitude === "number")
    .filter((r) => r.latitude >= -90 && r.latitude <= 90 && r.longitude >= -180 && r.longitude <= 180)
    .slice(0, 100)
    .map((r, i) => toOpenSkyState(r, i));
}

function buildPrompt(coordStr: string, lat: number, lng: number, radiusKm: number, withSearch: boolean): string {
  const now = new Date().toISOString();
  if (withSearch) {
    return `Search for real commercial flights currently in the air near ${coordStr} (latitude ${lat}, longitude ${lng}), within roughly ${radiusKm}km.
Use live flight tracking sources (FlightRadar24, FlightAware, ADS-B Exchange, etc.) to find ACTUAL flights with real positions right now.
Return up to 30 flights as a JSON array (no markdown, no explanation). Each element:
{"callsign":"AAL123","origin_country":"United States","latitude":30.27,"longitude":-97.74,"baro_altitude":10668,"true_track":180,"velocity":230,"on_ground":false}
Coordinates must be valid: latitude -90 to 90, longitude -180 to 180.
Respond ONLY with the JSON array.`;
  }
  return `Generate a realistic list of commercial flights that would plausibly be in the air right now (${now}) near ${coordStr} (latitude ${lat}, longitude ${lng}), within roughly ${radiusKm}km.
Use real airline callsign formats (e.g. AAL2345, UAL789, SWA1234, DAL567). Use plausible headings, altitudes (8000-12000m), and speeds (200-260 m/s).
Scatter positions realistically within ${radiusKm}km of the center. Include 20-30 flights.
Return ONLY a JSON array, no markdown fences, no explanation. Each element:
{"callsign":"AAL123","origin_country":"United States","latitude":30.27,"longitude":-97.74,"baro_altitude":10668,"true_track":180,"velocity":230,"on_ground":false}
Coordinates must be valid: latitude -90 to 90, longitude -180 to 180.`;
}

/**
 * Fetch flights near a location using Gemini.
 * Phase 1: try with googleSearch grounding (15s timeout).
 * Phase 2: fall back to model knowledge (no tools, fast).
 */
export async function fetchFlightsViaAI(
  lat: number,
  lng: number,
  radiusKm: number = 500
): Promise<OpenSkyState[]> {
  const model = getStoredAPIKeys().geminiModel || "gemini-2.0-flash";
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  const coordStr = `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
  const ai = getAI();

  // Phase 1: try google search grounding
  console.log('[GeminiFlight] Phase 1 — googleSearch:', { lat, lng, radiusKm, coordStr, model });
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: buildPrompt(coordStr, lat, lng, radiusKm, true),
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      }),
      SEARCH_TIMEOUT_MS,
      'googleSearch flight lookup',
    );

    const text = response.text ?? '';
    console.log('[GeminiFlight] Phase 1 response:', text.slice(0, 600));
    if (text) {
      const flights = parseFlights(text);
      if (flights.length > 0) {
        console.log('[GeminiFlight] Phase 1 success:', flights.length, 'flights');
        return flights;
      }
    }
    console.warn('[GeminiFlight] Phase 1 returned no usable flights, falling through to Phase 2');
  } catch (err) {
    console.warn('[GeminiFlight] Phase 1 failed (will retry without search):', err instanceof Error ? err.message : err);
  }

  // Phase 2: fall back to model knowledge (no tools — fast)
  console.log('[GeminiFlight] Phase 2 — model knowledge (no tools)');
  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model,
        contents: buildPrompt(coordStr, lat, lng, radiusKm, false),
        config: {
          temperature: 0.7,
        },
      }),
      FALLBACK_TIMEOUT_MS,
      'Gemini flight generation',
    );

    const text = response.text ?? '';
    console.log('[GeminiFlight] Phase 2 response:', text.slice(0, 600));
    if (text) {
      const flights = parseFlights(text);
      console.log('[GeminiFlight] Phase 2 result:', flights.length, 'flights');
      return flights;
    }
    console.warn('[GeminiFlight] Phase 2 returned empty text');
    return [];
  } catch (err) {
    console.error('[GeminiFlight] Phase 2 failed:', err);
    throw err;
  }
}
