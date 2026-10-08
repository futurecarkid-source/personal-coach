import { EXERCISE_BY_ID } from '../../content/exercises';
import { planDays } from '../planner';

const base = {
  startDate: '2026-10-05', // lunes
  days: 14,
  daysPerWeek: 3,
  minutesPerSession: 40,
  equipment: ['ninguno'] as const,
  discomfortZones: [] as const,
  matchDates: [] as const,
};

describe('planner', () => {
  it('creates one entry per day with the requested training days', () => {
    const plan = planDays(base);
    expect(plan).toHaveLength(14);
    expect(plan.filter((s) => s.kind !== 'descanso')).toHaveLength(6);
  });

  it('only uses known exercises and respects equipment', () => {
    const plan = planDays(base);
    for (const s of plan) {
      for (const id of s.exerciseIds) {
        const ex = EXERCISE_BY_ID.get(id);
        expect(ex).toBeDefined();
        expect(ex?.equipment.every((e) => e === 'ninguno')).toBe(true);
      }
    }
  });

  it('excludes exercises that load a zone with discomfort', () => {
    const plan = planDays({ ...base, discomfortZones: ['rodilla'] });
    for (const s of plan) {
      for (const id of s.exerciseIds) {
        expect(EXERCISE_BY_ID.get(id)?.loadsZones).not.toContain('rodilla');
      }
    }
  });

  it('protects the days around a match', () => {
    const plan = planDays({ ...base, daysPerWeek: 5, matchDates: ['2026-10-10'] });
    const day = (d: string) => plan.find((s) => s.date === d);
    expect(day('2026-10-10')?.kind).toBe('descanso');
    expect(day('2026-10-09')?.kind).toBe('prevencion');
    expect(day('2026-10-11')?.kind).toBe('recuperacion');
  });

  it('downgrades today when the check-in is bad', () => {
    const plan = planDays({
      ...base,
      latestCheckIn: { id: 'c', date: '2026-10-05', mood: 2, energy: 5, soreness: 5, zones: [] },
    });
    expect(plan[0]?.kind).toBe('recuperacion');
  });

  it('keeps sessions short enough', () => {
    const plan = planDays({ ...base, minutesPerSession: 25 });
    for (const s of plan) expect(s.estimatedMinutes).toBeLessThanOrEqual(40);
  });
});
