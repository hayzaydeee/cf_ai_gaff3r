// Current gameweek hook

import { useState, useEffect } from 'react';
import { getGameweek, type GameweekData } from '../services/api';

export function useGameweek() {
  const [data, setData] = useState<GameweekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const gw = await getGameweek();
        if (!cancelled) {
          setData(gw);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load gameweek');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    currentGw: data?.current ?? null,
    nextGw: data?.next ?? null,
    nextDeadline: data?.nextDeadline ?? null,
    loading,
    error,
  };
}
