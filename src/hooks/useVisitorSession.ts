import { useState, useEffect, useCallback, useRef } from 'react';

export interface VisitorSessionState {
  remainingSeconds: number;
  isExpired: boolean;
  isLoading: boolean;
  expiresAt: number | null;
  formattedTime: string;
  refreshSession: () => Promise<void>;
}

const BROADCAST_CHANNEL_NAME = 'comm_visitor_session_sync';
const STORAGE_SYNC_KEY = 'comm_session_sync_state';

export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function useVisitorSession(): VisitorSessionState {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Sync state broadcast helper
  const broadcastSync = useCallback((exp: number, rem: number, expired: boolean) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'SESSION_SYNC',
          expiresAt: exp,
          remainingSeconds: rem,
          isExpired: expired,
          timestamp: Date.now(),
        });
      }
      // LocalStorage mirror for cross-tab sync in older browsers
      localStorage.setItem(
        STORAGE_SYNC_KEY,
        JSON.stringify({ expiresAt: exp, isExpired: expired, timestamp: Date.now() })
      );
    } catch {
      // Safe no-op in private browsing or disabled storage
    }
  }, []);

  // Fetch session from server (authoritative source of truth)
  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/session', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const rem = typeof data.remainingSeconds === 'number' ? data.remainingSeconds : 0;
        const expired = Boolean(data.expired || rem <= 0);
        const exp = typeof data.expiresAt === 'number' ? data.expiresAt : Date.now() + rem * 1000;

        setRemainingSeconds(rem);
        setIsExpired(expired);
        setExpiresAt(exp);
        broadcastSync(exp, rem, expired);
      } else {
        // If server returns error, fail safe to expired if session was invalid
        const data = await res.json().catch(() => null);
        if (data && data.error === 'SESSION_EXPIRED') {
          setIsExpired(true);
          setRemainingSeconds(0);
        }
      }
    } catch (err) {
      console.warn('[Session] Could not verify session with server:', err);
    } finally {
      setIsLoading(false);
    }
  }, [broadcastSync]);

  // Initial session fetch & cross-tab sync setup
  useEffect(() => {
    fetchSession();

    // Setup BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'SESSION_SYNC') {
            if (data.isExpired) {
              setIsExpired(true);
              setRemainingSeconds(0);
            } else if (typeof data.expiresAt === 'number') {
              const currentRemaining = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
              setRemainingSeconds(currentRemaining);
              setExpiresAt(data.expiresAt);
              if (currentRemaining <= 0) {
                setIsExpired(true);
              }
            }
          }
        };
      }
    } catch {
      // Ignore BroadcastChannel setup failures
    }

    // Storage event listener fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_SYNC_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.isExpired) {
            setIsExpired(true);
            setRemainingSeconds(0);
          } else if (parsed.expiresAt) {
            const currentRemaining = Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000));
            setRemainingSeconds(currentRemaining);
            if (currentRemaining <= 0) {
              setIsExpired(true);
            }
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchSession]);

  // High-precision local decrement timer
  useEffect(() => {
    if (isExpired) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (expiresAt) {
          // Re-align with server-issued expiry timestamp
          const realRemaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
          if (realRemaining <= 0) {
            setIsExpired(true);
            broadcastSync(expiresAt, 0, true);
            return 0;
          }
          return realRemaining;
        }

        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isExpired, broadcastSync]);

  return {
    remainingSeconds,
    isExpired,
    isLoading,
    expiresAt,
    formattedTime: formatRemainingTime(remainingSeconds),
    refreshSession: fetchSession,
  };
}
