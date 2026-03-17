import { useState, useEffect, useCallback } from 'react';
import { fetchTLE, computeOrbit, SatelliteOrbit } from '../services/celestrakService';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SATELLITES = 200;

export function useCelesTrakOrbits(group = 'active', enabled = true) {
  const [orbits, setOrbits] = useState<SatelliteOrbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const tles = await fetchTLE(group, MAX_SATELLITES);
      const computed: SatelliteOrbit[] = [];
      const seen = new Map<string, number>();
      let skippedCount = 0;
      for (const { name, line1, line2 } of tles) {
        try {
          const { currentPos, orbitPath } = computeOrbit(line1, line2);
          if (currentPos.lat === 0 && currentPos.lng === 0 && currentPos.alt === 0) {
            skippedCount += 1;
            continue;
          }
          let noradId = line2.slice(2, 7).trim();
          if (seen.has(noradId)) noradId = `${noradId}-${seen.get(noradId)! + 1}`;
          seen.set(noradId, (seen.get(noradId) ?? 0) + 1);
          computed.push({ name, noradId, line1, line2, currentPos, orbitPath });
        } catch {
          // Skip satellites with stale/malformed TLEs
          skippedCount += 1;
        }
      }
      setOrbits(computed);
      setLastUpdated(new Date().toISOString());
      console.log('[satellites] Computed orbit payload', {
        group,
        requested: MAX_SATELLITES,
        received: tles.length,
        displayed: computed.length,
        skipped: skippedCount,
        sample: computed.slice(0, 5).map((satellite) => ({
          name: satellite.name,
          noradId: satellite.noradId,
          currentPos: satellite.currentPos,
        })),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch satellites';
      console.warn('[useCelesTrakOrbits]', msg);
      setError(msg);
      // Keep previous data on error
    } finally {
      setLoading(false);
    }
  }, [enabled, group]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { orbits, loading, error, lastUpdated, refresh };
}
