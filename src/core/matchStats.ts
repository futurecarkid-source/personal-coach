import { buildHeatmap, type Heatmap } from './heatmap';
import { expectedGoals } from './xg';
import type { MatchEvent, PitchPoint } from '../types';

export interface MatchSummary {
  goals: number;
  shots: number;
  shotsOnTarget: number;
  /** xG acumulado de los tiros propios con posición y contexto. */
  xg: number;
  passesCompleted: number;
  passesFailed: number;
  /** Porcentaje de acierto de pase (0 a 100), o null si no hay pases. */
  passAccuracy: number | null;
  duelsWon: number;
  duelsLost: number;
  recoveries: number;
  losses: number;
  /** Tras un fallo: veces que presionó / veces que se frenó. */
  reactionPress: number;
  reactionStall: number;
  /** Porcentaje de reacciones positivas tras un fallo ("sangre fría"), o null si no hay datos. */
  coldBlood: number | null;
  /** Posiciones de las acciones propias, para el mapa de calor. */
  positions: PitchPoint[];
}

const SHOT_TYPES = new Set(['gol', 'tiroPuerta', 'tiroFuera', 'tiroBloqueado']);

/** Resume los eventos propios de un partido. Función pura. */
export function summarizeMatch(events: readonly MatchEvent[]): MatchSummary {
  const own = events.filter((e) => e.side === 'propio');
  const count = (type: MatchEvent['type']): number => own.filter((e) => e.type === type).length;

  let xg = 0;
  let shots = 0;
  let onTarget = 0;
  for (const e of own) {
    if (!SHOT_TYPES.has(e.type)) continue;
    shots += 1;
    if (e.type === 'gol' || e.type === 'tiroPuerta') onTarget += 1;
    if (e.pos && e.shot) xg += expectedGoals(e.pos, e.shot);
  }

  const passesCompleted = count('paseCompletado');
  const passesFailed = count('paseFallido');
  const passTotal = passesCompleted + passesFailed;
  const reactionPress = count('reaccionFalloPresiona');
  const reactionStall = count('reaccionFalloSeFrena');
  const reactionTotal = reactionPress + reactionStall;

  return {
    goals: count('gol'),
    shots,
    shotsOnTarget: onTarget,
    xg: Math.round(xg * 100) / 100,
    passesCompleted,
    passesFailed,
    passAccuracy: passTotal === 0 ? null : Math.round((passesCompleted / passTotal) * 100),
    duelsWon: count('dueloGanado') + count('entradaGanada'),
    duelsLost: count('dueloPerdido') + count('entradaPerdida'),
    recoveries: count('recuperacion'),
    losses: count('perdida'),
    reactionPress,
    reactionStall,
    coldBlood: reactionTotal === 0 ? null : Math.round((reactionPress / reactionTotal) * 100),
    positions: own.flatMap((e) => (e.pos ? [e.pos] : [])),
  };
}

export function matchHeatmap(events: readonly MatchEvent[]): Heatmap {
  return buildHeatmap(summarizeMatch(events).positions);
}
