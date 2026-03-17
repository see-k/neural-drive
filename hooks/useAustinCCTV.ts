import { useState, useEffect, useCallback } from 'react';
import { fetchAustinCameras, AustinCamera } from '../services/austinCCTVService';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 min - images refresh every 5 min

export function useAustinCCTV(enabled = true) {
  const [cameras, setCameras] = useState<AustinCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAustinCameras();
      setCameras(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch cameras');
      setCameras([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { cameras, loading, error, refresh };
}
