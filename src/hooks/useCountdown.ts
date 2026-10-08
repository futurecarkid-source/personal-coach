import { useEffect, useRef } from 'react';
import { haptics } from '../theme';
import { useStopwatch } from './useStopwatch';

/**
 * Cuenta atrás que empieza al montar el componente (usa `key` para reiniciarla).
 * Avisa con háptica en los últimos 3 segundos y llama a `onDone` una sola vez.
 */
export function useCountdown(durationMs: number, onDone: () => void): { remainingMs: number; fraction: number } {
  const watch = useStopwatch(100);
  const { start } = watch;
  const doneRef = useRef(false);
  const lastTick = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    start();
  }, [start]);

  const remainingMs = Math.max(0, durationMs - watch.elapsedMs);
  const secondsLeft = Math.ceil(remainingMs / 1000);

  useEffect(() => {
    if (remainingMs <= 0 && !doneRef.current) {
      doneRef.current = true;
      onDoneRef.current();
      return;
    }
    if (secondsLeft >= 1 && secondsLeft <= 3 && lastTick.current !== secondsLeft) {
      lastTick.current = secondsLeft;
      haptics.rigid();
    }
  }, [remainingMs, secondsLeft]);

  return { remainingMs, fraction: durationMs > 0 ? Math.min(1, watch.elapsedMs / durationMs) : 1 };
}
