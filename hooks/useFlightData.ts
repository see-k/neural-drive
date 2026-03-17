import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFlightsViaAI } from '../services/geminiFlightService';
import { fetchAircraftStates, OpenSkyState, RateLimitError } from '../services/openskyService';

export type FlightDataSource = 'ai' | 'api';

const AI_POLL_INTERVAL_MS = 60_000;
const API_BASE_INTERVAL_MS = 30_000;
const API_MAX_INTERVAL_MS = 5 * 60_000;

function bboxAround(lat: number, lng: number, radius = 10) {
  return {
    lamin: Math.max(-90, lat - radius),
    lomin: Math.max(-180, lng - radius * 2),
    lamax: Math.min(90, lat + radius),
    lomax: Math.min(180, lng + radius * 2),
  };
}

export function useFlightData(
  location: { lat: number; lng: number },
  source: FlightDataSource,
  enabled = true
) {
  const [states, setStates] = useState<OpenSkyState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const locationRef = useRef(location);
  locationRef.current = location;

  const apiIntervalRef = useRef(API_BASE_INTERVAL_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const poll = useCallback(async (cancelled: { current: boolean }) => {
    if (cancelled.current) return;
    const { lat, lng } = locationRef.current;
    setLoading(true);
    setError(null);
    console.log('[useFlightData] Polling:', { source, lat, lng });

    try {
      let data: OpenSkyState[];
      if (source === 'ai') {
        data = await fetchFlightsViaAI(lat, lng);
      } else {
        const bbox = bboxAround(lat, lng);
        data = await fetchAircraftStates(bbox);
        apiIntervalRef.current = API_BASE_INTERVAL_MS;
      }

      if (cancelled.current) return;
      console.log(`[useFlightData] ${source} result: ${data.length} flights`);
      setStates(data);
      setLastUpdated(Date.now());
    } catch (e) {
      if (cancelled.current) return;
      console.error('[useFlightData] Error:', e);
      if (e instanceof RateLimitError) {
        apiIntervalRef.current = Math.min(apiIntervalRef.current * 2, API_MAX_INTERVAL_MS);
        setError(`Rate limited. Retrying in ${Math.round(apiIntervalRef.current / 1000)}s…`);
      } else {
        const msg = e instanceof Error ? e.message : 'Failed to fetch aircraft';
        setError(msg);
      }
    } finally {
      if (!cancelled.current) {
        setLoading(false);
        const interval = source === 'ai' ? AI_POLL_INTERVAL_MS : apiIntervalRef.current;
        timerRef.current = setTimeout(() => poll(cancelled), interval);
      }
    }
  }, [source]);

  useEffect(() => {
    if (!enabled) return;
    const cancelled = { current: false };
    setStates([]);
    setLastUpdated(null);
    poll(cancelled);
    return () => {
      cancelled.current = true;
      clearTimeout(timerRef.current);
    };
  }, [enabled, source, location.lat, location.lng, poll]);

  return { states, loading, error, source, lastUpdated };
}
