import { useState, useEffect, useRef } from 'react';
import { fetchAircraftStates, OpenSkyState, RateLimitError } from '../services/openskyService';

const BASE_INTERVAL_MS = 30_000;
const MAX_INTERVAL_MS = 5 * 60_000; // Cap backoff at 5 minutes

export function useOpenSkyStates(bbox?: { lamin: number; lomin: number; lamax: number; lomax: number }, enabled = true) {
  const [states, setStates] = useState<OpenSkyState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef(BASE_INTERVAL_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const bboxRef = useRef(bbox);
  bboxRef.current = bbox;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const data = await fetchAircraftStates(bboxRef.current);
        if (cancelled) return;
        setStates(data);
        setError(null);
        intervalRef.current = BASE_INTERVAL_MS;
      } catch (e) {
        if (cancelled) return;
        if (e instanceof RateLimitError) {
          intervalRef.current = Math.min(intervalRef.current * 2, MAX_INTERVAL_MS);
          console.warn(`[OpenSky] Rate limited. Backing off to ${Math.round(intervalRef.current / 1000)}s.`);
          setError(`Rate limited. Retrying in ${Math.round(intervalRef.current / 1000)}s...`);
        } else {
          console.warn('[OpenSky]', e instanceof Error ? e.message : e);
          setError(e instanceof Error ? e.message : 'Failed to fetch aircraft');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          timerRef.current = setTimeout(poll, intervalRef.current);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [enabled, bbox?.lamin, bbox?.lomin, bbox?.lamax, bbox?.lomax]);

  return { states, loading, error };
}
