import { EXERCISE_BY_ID } from '../content/exercises';
import { estimateSessionMinutes } from '../core/planner';
import type { AiPlan, BodyZone, PlannedSession } from '../types';
import { aiPlanSessions } from './planValidator';

/**
 * Combina el plan por reglas con el plan de la IA guardado.
 * - Solo se usan los días de la IA que coinciden con las fechas del plan por reglas.
 * - Si desde que se generó apareció una molestia nueva, se quitan los ejercicios que cargan esa zona;
 *   si la sesión queda con menos de 3 ejercicios, se usa la sesión por reglas de ese día.
 * - Si hoy la persona no está bien, se usa siempre la sesión por reglas (ya baja a recuperación).
 */
export function mergeAiPlan(rulesWeek: readonly PlannedSession[], aiPlan: AiPlan | null, discomfortZones: readonly BodyZone[], useRulesToday: boolean): PlannedSession[] {
  if (!aiPlan) return [...rulesWeek];
  const aiByDate = new Map(aiPlanSessions(aiPlan).map((s) => [s.date, s]));
  return rulesWeek.map((rules, index) => {
    if (index === 0 && useRulesToday) return rules;
    const ai = aiByDate.get(rules.date);
    if (!ai) return rules;
    if (ai.kind === 'descanso') return ai;
    const safeIds = ai.exerciseIds.filter((id) => {
      const e = EXERCISE_BY_ID.get(id);
      return e !== undefined && !e.loadsZones.some((z) => discomfortZones.includes(z));
    });
    if (safeIds.length < 3) return rules;
    const exercises = safeIds.flatMap((id) => {
      const e = EXERCISE_BY_ID.get(id);
      return e ? [e] : [];
    });
    return { ...ai, exerciseIds: safeIds, estimatedMinutes: estimateSessionMinutes(exercises) };
  });
}
