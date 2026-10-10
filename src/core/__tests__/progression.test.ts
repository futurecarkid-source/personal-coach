import { achievementStatuses, dailyQuests, newlyMet, nextRank, rankFor, weeklyChallenge } from '../progression';
import { appReducer, createInitialState } from '../../context/reducer';
import type { AppState } from '../../types';

const log = (date: string) => ({ id: `l-${date}`, date, title: 'x', durationSeconds: 1800, rpe: 6, exerciseIds: [] });

describe('ranks', () => {
  it('maps levels to ranks and finds the next one', () => {
    expect(rankFor(1).name).toBe('Cantera');
    expect(rankFor(5).name).toBe('Titular');
    expect(rankFor(30).name).toBe('Leyenda');
    expect(nextRank(5)?.name).toBe('Crack');
    expect(nextRank(30)).toBeNull();
  });
});

describe('daily quests', () => {
  const date = '2026-10-09';
  it('completes by itself and is claimed once, with a bonus when all are claimed', () => {
    let s: AppState = createInitialState();
    let q = dailyQuests(s, date);
    expect(q.quests).toHaveLength(3);
    expect(q.quests.every((x) => !x.done)).toBe(true);

    s = appReducer(s, { type: 'LOG_SESSION', log: log(date) });
    s = appReducer(s, { type: 'ADD_CHECKIN', checkIn: { id: 'c', date, mood: 7, energy: 7, soreness: 2, zones: [] } });
    s = appReducer(s, { type: 'LOG_SLEEP', log: { date, hours: 8, quality: 4 } });
    s = appReducer(s, { type: 'LOG_MIND', log: { at: `${date}T10:00:00.000Z`, protocol: 'caja', seconds: 300 } });
    s = appReducer(s, { type: 'LOG_REFLEX', log: { at: `${date}T10:00:00.000Z`, mode: 'simple', medianMs: 300, sdMs: 20, anticipations: 0, omissions: 0, commissions: 0, lapses: 0 } });
    q = dailyQuests(s, date);
    expect(q.quests.every((x) => x.done)).toBe(true);

    const xp0 = s.gamification.xp;
    for (const quest of q.quests) s = appReducer(s, { type: 'CLAIM_QUEST', key: quest.key, xp: quest.xp });
    s = appReducer(s, { type: 'CLAIM_QUEST', key: q.quests[0]!.key, xp: 999 });
    expect(s.gamification.xp - xp0).toBe(q.quests.reduce((a, b) => a + b.xp, 0));
    q = dailyQuests(s, date);
    expect(q.bonusReady).toBe(true);
    expect(q.bonusClaimed).toBe(false);
  });

  it('rotates the third quest between days', () => {
    const s = createInitialState();
    const ids = new Set(['2026-10-09', '2026-10-10', '2026-10-11'].map((d) => dailyQuests(s, d).quests[2]!.id));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('weekly challenge', () => {
  it('counts distinct session days this week up to the goal', () => {
    let s: AppState = createInitialState();
    s = { ...s, planPrefs: { ...s.planPrefs, daysPerWeek: 3 } };
    s = appReducer(s, { type: 'LOG_SESSION', log: log('2026-10-05') });
    s = appReducer(s, { type: 'LOG_SESSION', log: { ...log('2026-10-05'), id: 'dup' } });
    s = appReducer(s, { type: 'LOG_SESSION', log: log('2026-10-07') });
    expect(weeklyChallenge(s, '2026-10-09')).toMatchObject({ goal: 3, done: 2, complete: false });
    s = appReducer(s, { type: 'LOG_SESSION', log: log('2026-10-08') });
    expect(weeklyChallenge(s, '2026-10-09').complete).toBe(true);
    expect(weeklyChallenge(s, '2026-10-14').done).toBe(0);
  });
});

describe('achievements', () => {
  it('unlocks once, pays XP once, and tracks progress', () => {
    let s: AppState = createInitialState();
    expect(newlyMet(s)).toHaveLength(0);
    s = appReducer(s, { type: 'LOG_SESSION', log: log('2026-10-09') });
    const met = newlyMet(s).map((a) => a.id);
    expect(met).toContain('primera-sesion');
    const xp0 = s.gamification.xp;
    s = appReducer(s, { type: 'UNLOCK_ACHIEVEMENT', id: 'primera-sesion', at: 'now', xp: 30 });
    s = appReducer(s, { type: 'UNLOCK_ACHIEVEMENT', id: 'primera-sesion', at: 'now', xp: 30 });
    expect(s.gamification.xp - xp0).toBe(30);
    expect(newlyMet(s).map((a) => a.id)).not.toContain('primera-sesion');
    const five = achievementStatuses(s).find((a) => a.def.id === 'sesiones-5')!;
    expect([five.value, five.goal, five.met]).toEqual([1, 5, false]);
  });

  it('hat-trick needs three own goals in one match', () => {
    let s: AppState = createInitialState();
    const ev = (side: 'propio' | 'rival') => ({ type: 'gol' as const, atSeconds: 1, pos: null, shot: null, side });
    s = appReducer(s, { type: 'UPSERT_MATCH', match: { id: 'm', date: '2026-10-09', opponent: 'R', kind: 'amistoso', goalsFor: 0, goalsAgainst: 0, minutesPlayed: 0, selfRating: null, rpe: null, events: [] } } as never);
    for (const side of ['propio', 'propio', 'rival', 'propio'] as const) s = appReducer(s, { type: 'ADD_MATCH_EVENT', matchId: 'm', event: ev(side) } as never);
    const ids = newlyMet(s).map((a) => a.id);
    expect(ids).toContain('hat-trick');
    expect(ids).toContain('primer-gol');
  });
});

describe('water quest and season', () => {
  it('water quest completes at the goal', () => {
    let s: AppState = createInitialState();
    s = appReducer(s, { type: 'SET_WATER', date: '2026-10-09', glasses: 5 });
    const q = (st: AppState) => dailyQuests(st, '2026-10-12').quests;
    // 2026-10-12 rota a la misión de agua según la fecha; se comprueba el estado con la fecha que corresponda.
    const days = ['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'];
    const waterDay = days.find((d) => dailyQuests(s, d).quests[2]!.id === 'agua')!;
    s = appReducer(s, { type: 'SET_WATER', date: waterDay, glasses: 5 });
    expect(dailyQuests(s, waterDay).quests[2]!.done).toBe(false);
    s = appReducer(s, { type: 'SET_WATER', date: waterDay, glasses: 6 });
    expect(dailyQuests(s, waterDay).quests[2]!.done).toBe(true);
    expect(q(s)).toHaveLength(3);
  });

  it('season counts distinct session days this month', () => {
    let s: AppState = createInitialState();
    for (let d = 1; d <= 12; d += 1) s = appReducer(s, { type: 'LOG_SESSION', log: log(`2026-10-${String(d).padStart(2, '0')}`) });
    const { seasonProgress } = jest.requireActual('../progression') as typeof import('../progression');
    expect(seasonProgress(s, '2026-10-15')).toMatchObject({ done: 12, complete: true, name: 'Temporada de octubre' });
    expect(seasonProgress(s, '2026-11-02').done).toBe(0);
  });
});
