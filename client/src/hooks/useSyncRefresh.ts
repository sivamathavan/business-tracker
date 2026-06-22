import { useEffect, useRef } from 'react';
import { onDataSync } from '../api/apiClient';

const VISIBILITY_STALE_MS = 60_000; // refresh if tab was hidden for > 60s

/**
 * Triggers `onRefresh` in two scenarios:
 * 1. Another tab in the same browser makes a mutation (BroadcastChannel)
 * 2. User returns to this tab after it was hidden for >60s (Page Visibility API)
 *
 * Usage: useSyncRefresh(fetchData);
 */
export const useSyncRefresh = (onRefresh: () => void) => {
  const lastHiddenAt = useRef<number | null>(null);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh; // always call latest version without re-subscribing

  // Cross-tab sync via BroadcastChannel
  useEffect(() => {
    const unsub = onDataSync(() => refreshRef.current());
    return unsub;
  }, []);

  // Refresh on tab visibility change (user comes back to tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenAt.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const hiddenFor = lastHiddenAt.current
          ? Date.now() - lastHiddenAt.current
          : Infinity;
        if (hiddenFor > VISIBILITY_STALE_MS) {
          refreshRef.current();
        }
        lastHiddenAt.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
};
