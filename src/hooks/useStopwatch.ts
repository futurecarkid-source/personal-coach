import { useCallback, useRef, useState } from 'react';
import { monotonicNow, useTicker } from './useTicker';

export interface Stopwatch {
  elapsedMs: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

interface Snapshot {
  startedAt: number | null;
  accumulated: number;
}

/** Cronómetro basado en el reloj monótono: pausa y reanuda sin perder tiempo. */
export function useStopwatch(tickMs = 100): Stopwatch {
  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const [snapshot, setSnapshot] = useState<Snapshot>({ startedAt: null, accumulated: 0 });
  const running = snapshot.startedAt !== null;
  const now = useTicker(running, tickMs);

  const elapsedMs = snapshot.startedAt !== null ? snapshot.accumulated + Math.max(0, now - snapshot.startedAt) : snapshot.accumulated;

  const sync = useCallback(() => {
    setSnapshot({ startedAt: startedAtRef.current, accumulated: accumulatedRef.current });
  }, []);

  const start = useCallback(() => {
    if (startedAtRef.current !== null) return;
    startedAtRef.current = monotonicNow();
    sync();
  }, [sync]);

  const pause = useCallback(() => {
    if (startedAtRef.current === null) return;
    accumulatedRef.current += monotonicNow() - startedAtRef.current;
    startedAtRef.current = null;
    sync();
  }, [sync]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    accumulatedRef.current = 0;
    sync();
  }, [sync]);

  return { elapsedMs, running, start, pause, reset };
}
