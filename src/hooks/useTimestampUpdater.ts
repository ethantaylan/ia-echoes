import { useEffect, useState } from 'react';

/**
 * Hook that forces component re-render at regular intervals
 * Used to update relative timestamps (e.g., "5m ago" → "6m ago")
 *
 * @param intervalMs - Update interval in milliseconds (default: 60000 = 1 minute)
 * @returns Current timestamp (changes every interval)
 */
export function useTimestampUpdater(intervalMs: number = 60000): number {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Update timestamp every interval
    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
