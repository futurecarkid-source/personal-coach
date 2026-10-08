import { EXERCISE_BY_ID } from '../content/exercises';
import { addDays } from '../core/dates';
import { estimateSessionMinutes } from '../core/planner';
import type { AiPlan, BodyZone, PlannedSession } from '../types';
import { clip } from './safety';
import type { WeeklyPlanOutput } from './contract';

export interface PlanValidationRules {
  startDate: string;
  days: number;
  /** Ids de ejercicio que la IA podía elegir (ya filtrados por equipo y molestias). */
  allowedIds: ReadonlySet<string>;
  discomfortZones: readonly BodyZone[];
  matchDates: readonly string[];
  daysPerWeek: number;
  minutesPerSession: number;
}

export type PlanValidation = { ok: true; sessions: PlannedSession[] } | { ok: false; reasons: string[] };

const MAX_EXERCISES_PER_DAY = 10;

/**
 * Capa de seguridad entre la IA y la persona. La IA solo puede elegir ejercicios que existen en el banco
 * y que la persona puede hacer; si algo no cumple, el plan se rechaza y se usa el plan por reglas.
 */
export function validateAiPlan(output: WeeklyPlanOutput, rules: PlanValidationRules): PlanValidation {
  const reasons: string[] = [];
  if (output.days.length !== rules.days) reasons.push(`Se esperaban ${rules.days} días y llegaron ${output.days.length}.`);

  const sessions: PlannedSession[] = [];
  let trainingDays = 0;

  output.days.forEach((day, index) => {
    const expectedDate = addDays(rules.startDate, index);
    if (day.date !== expectedDate) reasons.push(`El día ${index + 1} debía ser ${expectedDate} y llegó ${day.date}.`);

    const unique = [...new Set(day.exerciseIds)];
    if (unique.length !== day.exerciseIds.length) reasons.push(`${expectedDate}: ejercicios repetidos.`);
    if (unique.length > MAX_EXERCISES_PER_DAY) reasons.push(`${expectedDate}: demasiados ejercicios.`);

    for (const id of unique) {
      const exercise = EXERCISE_BY_ID.get(id);
      if (!exercise) {
        reasons.push(`${expectedDate}: ejercicio desconocido "${id}".`);
        continue;
      }
      if (!rules.allowedIds.has(id)) reasons.push(`${expectedDate}: "${id}" no estaba permitido (equipo o molestia).`);
      if (exercise.loadsZones.some((z) => rules.discomfortZones.includes(z))) reasons.push(`${expectedDate}: "${id}" carga una zona con molestia.`);
    }

    const exercises = unique.flatMap((id) => {
      const e = EXERCISE_BY_ID.get(id);
      return e ? [e] : [];
    });
    const minutes = estimateSessionMinutes(exercises);

    if (day.kind === 'descanso') {
      if (unique.length > 0) reasons.push(`${expectedDate}: un día de descanso no puede tener ejercicios.`);
    } else {
      trainingDays += 1;
      if (unique.length < 3) reasons.push(`${expectedDate}: una sesión necesita al menos 3 ejercicios.`);
      if (minutes > rules.minutesPerSession * 1.25 + 10) reasons.push(`${expectedDate}: la sesión dura demasiado (${minutes} min).`);
    }

    const isMatch = rules.matchDates.includes(expectedDate);
    const afterMatch = rules.matchDates.includes(addDays(expectedDate, -1));
    const beforeMatch = rules.matchDates.includes(addDays(expectedDate, 1));
    if (isMatch && day.kind !== 'descanso') reasons.push(`${expectedDate}: día de partido, debe ser descanso.`);
    if (afterMatch && day.kind !== 'recuperacion' && day.kind !== 'descanso') reasons.push(`${expectedDate}: el día después del partido debe ser recuperación o descanso.`);
    if (beforeMatch && (day.kind === 'fuerza' || day.kind === 'velocidad')) reasons.push(`${expectedDate}: no hay fuerza ni velocidad el día antes del partido.`);

    sessions.push({
      date: expectedDate,
      kind: day.kind,
      title: clip(day.title, 60) || 'Sesión',
      exerciseIds: unique.filter((id) => EXERCISE_BY_ID.has(id)),
      estimatedMinutes: day.kind === 'descanso' ? 0 : minutes,
    });
  });

  const weeks = Math.max(1, Math.ceil(rules.days / 7));
  if (trainingDays > (rules.daysPerWeek + 1) * weeks) reasons.push(`Demasiados días de entrenamiento (${trainingDays}).`);

  return reasons.length > 0 ? { ok: false, reasons } : { ok: true, sessions };
}

export function toAiPlan(sessions: readonly PlannedSession[], rationale: string, generatedAtISO: string): AiPlan {
  return {
    generatedAt: generatedAtISO,
    rationale: clip(rationale, 600),
    days: sessions.map((s) => ({ date: s.date, kind: s.kind, title: s.title, exerciseIds: [...s.exerciseIds], estimatedMinutes: s.estimatedMinutes })),
  };
}

/** Convierte el plan guardado en sesiones, descartando ids que ya no existan. */
export function aiPlanSessions(plan: AiPlan): PlannedSession[] {
  return plan.days.map((d) => ({
    date: d.date,
    kind: d.kind,
    title: d.title,
    exerciseIds: d.exerciseIds.filter((id) => EXERCISE_BY_ID.has(id)),
    estimatedMinutes: d.estimatedMinutes,
  }));
}

/** El plan guardado sirve para hoy si cubre la fecha. */
export function aiPlanCovers(plan: AiPlan | null, dateISO: string): boolean {
  return plan !== null && plan.days.some((d) => d.date === dateISO);
}
