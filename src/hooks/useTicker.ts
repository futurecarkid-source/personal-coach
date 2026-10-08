import { useEffect, useState } from 'react';

/** Reloj monótono en milisegundos (no se ve afectado por cambios de hora del sistema). */
export function monotonicNow(): number {
  return performance.now();
}

/**
 * Devuelve la hora monótona, refrescada cada `intervalMs` mientras `active` sea verdadero.
 * Los temporizadores calculan siempre contra la hora de inicio, así no acumulan deriva
 * y siguen siendo correctos si la app pasa a segundo plano.
 */
export function useTicker(active: boolean, intervalMs = 100): number {
  const [now, setNow] = useState<number>(() => monotonicNow());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(monotonicNow()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
