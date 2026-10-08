export interface IntervalPlan {
  prepSeconds: number;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
}

export type IntervalPhase = 'prep' | 'work' | 'rest' | 'done';

export interface IntervalState {
  phase: IntervalPhase;
  /** Ronda actual (1 a rounds); 0 durante la preparación. */
  round: number;
  phaseDurationMs: number;
  phaseElapsedMs: number;
  phaseRemainingMs: number;
  totalDurationMs: number;
  totalRemainingMs: number;
  finished: boolean;
}

export function totalDurationMs(plan: IntervalPlan): number {
  const { prepSeconds, workSeconds, restSeconds, rounds } = plan;
  return (prepSeconds + rounds * workSeconds + Math.max(0, rounds - 1) * restSeconds) * 1000;
}

/**
 * Estado del temporizador de intervalos a partir del tiempo transcurrido.
 * Es una función pura: la pantalla solo guarda la hora de inicio y calcula el resto contra un reloj monótono.
 * Después de la última ronda no hay descanso.
 */
export function computeIntervalState(plan: IntervalPlan, elapsedMs: number): IntervalState {
  const total = totalDurationMs(plan);
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed >= total) {
    return {
      phase: 'done',
      round: plan.rounds,
      phaseDurationMs: 0,
      phaseElapsedMs: 0,
      phaseRemainingMs: 0,
      totalDurationMs: total,
      totalRemainingMs: 0,
      finished: true,
    };
  }
  const make = (phase: IntervalPhase, round: number, start: number, duration: number): IntervalState => ({
    phase,
    round,
    phaseDurationMs: duration,
    phaseElapsedMs: elapsed - start,
    phaseRemainingMs: start + duration - elapsed,
    totalDurationMs: total,
    totalRemainingMs: total - elapsed,
    finished: false,
  });
  let cursor = 0;
  const prep = plan.prepSeconds * 1000;
  if (elapsed < prep) return make('prep', 0, 0, prep);
  cursor += prep;
  const work = plan.workSeconds * 1000;
  const rest = plan.restSeconds * 1000;
  for (let round = 1; round <= plan.rounds; round += 1) {
    if (elapsed < cursor + work) return make('work', round, cursor, work);
    cursor += work;
    if (round < plan.rounds && rest > 0) {
      if (elapsed < cursor + rest) return make('rest', round, cursor, rest);
      cursor += rest;
    }
  }
  // No debería llegar aquí; por seguridad se considera terminado.
  return computeIntervalState(plan, total);
}

export const BUILT_IN_PRESETS: readonly { id: string; name: string; plan: IntervalPlan }[] = [
  { id: 'tabata', name: 'Tabata', plan: { prepSeconds: 10, workSeconds: 20, restSeconds: 10, rounds: 8 } },
  { id: 'hiit', name: 'HIIT 40/20', plan: { prepSeconds: 10, workSeconds: 40, restSeconds: 20, rounds: 10 } },
  { id: 'emom', name: 'EMOM 10', plan: { prepSeconds: 10, workSeconds: 60, restSeconds: 0, rounds: 10 } },
  { id: 'sprints', name: 'Sprints 10/50', plan: { prepSeconds: 10, workSeconds: 10, restSeconds: 50, rounds: 8 } },
];

/** Formato mm:ss (o h:mm:ss) para cronómetros; los décimos son opcionales. */
export function formatClock(ms: number, withTenths = false): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number): string => n.toString().padStart(2, '0');
  const tenths = withTenths ? `.${Math.floor((safe % 1000) / 100)}` : '';
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}${tenths}` : `${pad(minutes)}:${pad(seconds)}${tenths}`;
}
