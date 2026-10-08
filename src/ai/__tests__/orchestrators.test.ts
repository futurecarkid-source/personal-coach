import { estimateAttributes } from '../../core/ovr';
import { createInitialState } from '../../context/reducer';
import { planDays } from '../../core/planner';
import type { AppState } from '../../types';
import { AiError } from '../client';
import { estimatesToAttributes, mergePainLevel, requestAiPlan } from '../orchestrators';
import { localCoachReply } from '../localCoach';
import { mergeAiPlan } from '../mergePlan';
import { toAiPlan } from '../planValidator';

function state(): AppState {
  const s = createInitialState();
  return {
    ...s,
    player: {
      id: 'p', nickname: 'X', number: 7, country: 'CO', position: 'EXT', secondaryPositions: [], level: 'amateur', foot: 'derecho', club: null, ageBand: 'adulto',
      attributes: estimateAttributes({ position: 'EXT', level: 'amateur' }), selfAssessment: { pac: 8 }, createdAt: '2026-10-08T00:00:00.000Z',
    },
    planPrefs: { ...s.planPrefs, daysPerWeek: 3, minutesPerSession: 40, equipment: ['ninguno'], discomfortZones: [], matchDates: [], goals: ['mejorar_fisico'] },
  };
}

const rulesWeek = (s: AppState, today: string) => planDays({ ...s.planPrefs, startDate: today, days: 7 });

function fetchReturning(output: unknown): typeof fetch {
  return (async () => ({ json: async () => ({ ok: true, task: 'weekly_plan', output, model: 'claude-opus-5-5', usage: { inputTokens: 1, outputTokens: 1 } }) })) as unknown as typeof fetch;
}

describe('requestAiPlan', () => {
  const today = '2026-10-05';

  it('accepts a valid AI plan', async () => {
    const s = state();
    const week = rulesWeek(s, today);
    const output = { rationale: 'ok', days: week.map((d) => ({ date: d.date, kind: d.kind, title: d.title, exerciseIds: [...d.exerciseIds], note: '' })) };
    const { plan } = await requestAiPlan({ baseUrl: 'https://g.example', accessCode: 'c', fetchImpl: fetchReturning(output) }, s, today, week[0], '2026-10-05T08:00:00.000Z');
    expect(plan.days).toHaveLength(7);
  });

  it('rejects a plan with invented exercises and keeps the rules plan', async () => {
    const s = state();
    const week = rulesWeek(s, today);
    const output = { rationale: 'ok', days: week.map((d) => ({ date: d.date, kind: d.kind, title: d.title, exerciseIds: d.kind === 'descanso' ? [] : ['inventado-1', 'inventado-2', 'inventado-3'], note: '' })) };
    await expect(requestAiPlan({ baseUrl: 'https://g.example', accessCode: 'c', fetchImpl: fetchReturning(output) }, s, today, week[0], 'x')).rejects.toMatchObject({ code: 'bad_output' });
  });
});

describe('merging and levels', () => {
  it('AI can only raise the pain caution level', () => {
    expect(mergePainLevel('ok', 'seguir')).toBe('seguir');
    expect(mergePainLevel('ok', 'descansar')).toBe('descansar');
    expect(mergePainLevel('consulta', 'seguir')).toBe('consultar');
    expect(mergePainLevel('urgencias', 'moderar')).toBe('consultar');
  });

  it('drops AI exercises that now load a painful zone and falls back to rules when too few remain', () => {
    const s = state();
    const today = '2026-10-05';
    const week = rulesWeek(s, today);
    const trainingIndex = week.findIndex((d) => d.kind !== 'descanso' && d.exerciseIds.includes('sentadilla-peso-corporal'));
    const aiDays = week.map((d, i) => (i === trainingIndex ? { ...d, exerciseIds: ['sentadilla-peso-corporal', 'zancada-alterna', 'plancha-frontal'] } : d));
    const plan = toAiPlan(aiDays, 'r', 'x');
    expect(trainingIndex).toBeGreaterThanOrEqual(0);
    const merged = mergeAiPlan(week, plan, ['rodilla'], false);
    // Con la rodilla bloqueada solo queda la plancha: menos de 3, se usa el plan por reglas de ese día.
    expect(merged[trainingIndex]).toEqual(week[trainingIndex]);
    expect(mergeAiPlan(week, null, [], false)).toEqual(week);
    const forced = mergeAiPlan(week, plan, [], true);
    expect(forced[0]).toEqual(week[0]);
  });

  it('turns AI estimates into bounded, valid, estimated attributes', () => {
    const attrs = estimatesToAttributes({ attributes: [{ key: 'pac', value: 99 }, { key: 'sho', value: 10 }, { key: 'inventada', value: 60 }, { key: 'dri', value: Number.NaN }], notes: '' }, ['pac', 'sho', 'dri']);
    expect(attrs.pac).toEqual({ value: 82, source: 'estimado' });
    expect(attrs.sho).toEqual({ value: 25, source: 'estimado' });
    expect(Object.keys(attrs).sort()).toEqual(['pac', 'sho']);
  });
});

describe('local coach', () => {
  const snapshot = { today: '2026-10-08', streak: 1, lastCheckIn: null, todaySession: { title: 'Fuerza y estabilidad', kind: 'fuerza' as const, exercises: ['Sentadilla', 'Puente', 'Plancha'] }, recentSessions: [], activePain: [] };
  it('routes pain to the pain flow and recommends a professional', () => {
    const r = localCoachReply('me duele la rodilla', snapshot);
    expect(r.action).toBe('reportar_dolor');
    expect(r.needsProfessional).toBe(true);
  });
  it('answers about today and about low energy', () => {
    expect(localCoachReply('¿qué hago?', snapshot).reply).toMatch(/Fuerza y estabilidad/);
    const tired = { ...snapshot, lastCheckIn: { mood: 2, energy: 2, soreness: 3, zones: [] } };
    expect(localCoachReply('hola', tired).reply).toMatch(/suave/);
    expect(localCoachReply('hola', { ...snapshot, todaySession: null }).action).toBe('ninguna');
  });
  it('AiError has a code', () => {
    expect(new AiError('offline', 'x').code).toBe('offline');
  });
});
