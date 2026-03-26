// Current gameweek hook
// Returns `activeGw` = next GW (the upcoming one) so the UI always
// shows fixtures ahead of you, not ones that have already been played.

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
    // activeGw = next GW so the interface always shows upcoming fixtures.
    // After the current GW's matches play, this automatically moves forward.
    currentGw: data?.next ?? null,       // "current" from the UI's perspective = the next upcoming GW
    currentGwActual: data?.current ?? null, // the FPL-reported current GW (for standings context)
    nextGw: data?.next ?? null,
    nextDeadline: data?.nextDeadline ?? null,
    loading,
    error,
  };
}

