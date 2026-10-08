import { EXERCISES } from '../../content/exercises';
import { planDays } from '../../core/planner';
import { buildLibrary } from '../context';
import type { WeeklyPlanOutput } from '../contract';
import { aiPlanCovers, aiPlanSessions, toAiPlan, validateAiPlan, type PlanValidationRules } from '../planValidator';

const base = {
  startDate: '2026-10-05',
  days: 7,
  daysPerWeek: 3,
  minutesPerSession: 40,
  equipment: ['ninguno'] as const,
  discomfortZones: [] as const,
  matchDates: [] as const,
};

const rulesFor = (patch: Partial<PlanValidationRules> = {}): PlanValidationRules => ({
  ...base,
  allowedIds: new Set(buildLibrary(['ninguno'], []).map((e) => e.id)),
  ...patch,
});

/** Un plan de IA válido: se toma el plan por reglas y se convierte al formato de salida. */
function validOutput(): WeeklyPlanOutput {
  const sessions = planDays({ ...base, equipment: ['ninguno'], discomfortZones: [] });
  return {
    rationale: 'Plan equilibrado.',
    days: sessions.map((s) => ({ date: s.date, kind: s.kind, title: s.title, exerciseIds: [...s.exerciseIds], note: '' })),
  };
}

describe('validateAiPlan', () => {
  it('accepts a plan built from allowed exercises', () => {
    const r = validateAiPlan(validOutput(), rulesFor());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sessions).toHaveLength(7);
  });

  it('rejects invented exercises', () => {
    const out = validOutput();
    const day = out.days.find((d) => d.kind !== 'descanso');
    if (!day) throw new Error('no training day');
    day.exerciseIds = [...day.exerciseIds, 'ejercicio-inventado'];
    const r = validateAiPlan(out, rulesFor());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join(' ')).toMatch(/desconocido/);
  });

  it('rejects exercises that load a zone with discomfort', () => {
    const squat = EXERCISES.find((e) => e.id === 'sentadilla-peso-corporal');
    expect(squat).toBeDefined();
    const out = validOutput();
    const day = out.days.find((d) => d.kind === 'fuerza');
    if (!day) throw new Error('no strength day');
    day.exerciseIds = ['sentadilla-peso-corporal', ...day.exerciseIds.filter((id) => id !== 'sentadilla-peso-corporal')];
    const r = validateAiPlan(out, rulesFor({ discomfortZones: ['rodilla'] }));
    expect(r.ok).toBe(false);
  });

  it('rejects wrong dates, wrong count and rest days with exercises', () => {
    const out = validOutput();
    expect(validateAiPlan({ ...out, days: out.days.slice(0, 5) }, rulesFor()).ok).toBe(false);
    const shifted = { ...out, days: out.days.map((d, i) => (i === 0 ? { ...d, date: '2026-01-01' } : d)) };
    expect(validateAiPlan(shifted, rulesFor()).ok).toBe(false);
    const rest = out.days.find((d) => d.kind === 'descanso');
    if (!rest) throw new Error('no rest day');
    rest.exerciseIds = ['plancha-frontal'];
    expect(validateAiPlan(out, rulesFor()).ok).toBe(false);
  });

  it('protects match days and the day before', () => {
    const out = validOutput();
    const training = out.days.find((d) => d.kind !== 'descanso');
    if (!training) throw new Error('no training day');
    // Un partido el mismo día que una sesión de entrenamiento: se rechaza.
    expect(validateAiPlan(out, rulesFor({ matchDates: [training.date] })).ok).toBe(false);

    // Fuerza el día antes del partido: se rechaza.
    const strengthIndex = out.days.findIndex((d) => d.kind === 'fuerza');
    expect(strengthIndex).toBeGreaterThanOrEqual(0);
    const next = out.days[strengthIndex + 1];
    if (!next) throw new Error('no next day');
    const r = validateAiPlan(out, rulesFor({ matchDates: [next.date] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons.join(' ')).toMatch(/antes del partido/);
  });

  it('serialises and restores a plan', () => {
    const r = validateAiPlan(validOutput(), rulesFor());
    if (!r.ok) throw new Error('invalid');
    const plan = toAiPlan(r.sessions, 'Racional', '2026-10-05T10:00:00.000Z');
    expect(aiPlanSessions(plan)).toEqual(r.sessions);
    expect(aiPlanCovers(plan, '2026-10-06')).toBe(true);
    expect(aiPlanCovers(plan, '2026-12-01')).toBe(false);
    expect(aiPlanCovers(null, '2026-10-06')).toBe(false);
  });
});
