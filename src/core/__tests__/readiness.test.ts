import { addDays } from '../dates';
import { computeReadiness, dailyLoads, ewma, loadMetrics, type ReadinessInput } from '../readiness';
import type { SessionLog } from '../../types';

const log = (date: string, rpe: number, minutes: number): SessionLog => ({ id: date + rpe, date, title: 't', durationSeconds: minutes * 60, rpe, exerciseIds: [] });
const today = '2026-10-31';
const checkIn = (mood: number, energy: number, soreness: number) => ({ id: 'c', date: today, mood, energy, soreness, zones: [] });
const base: ReadinessInput = { today, logs: [], checkIn: checkIn(8, 8, 2), sleepHours: null, blockingPain: false, activePain: false, sensitivity: 'equilibrado', minor: false };

describe('load metrics', () => {
  it('builds daily loads and an EWMA', () => {
    const loads = dailyLoads([log(today, 5, 60), log(addDays(today, -1), 4, 30)], today, 7);
    expect(loads).toHaveLength(7);
    expect(loads[6]).toBe(300);
    expect(loads[5]).toBe(120);
    expect(ewma([0, 0, 100], 7)).toBeCloseTo(25, 5);
    expect(ewma([], 7)).toBe(0);
  });

  it('keeps a steady load near ACWR 1 and flags a spike above it', () => {
    const steady = Array.from({ length: 56 }, (_, i) => log(addDays(today, -i), 5, 40));
    expect(loadMetrics(steady, today).acwr).toBeCloseTo(1, 1);
    const spike = [...steady.filter((_, i) => i > 6), ...Array.from({ length: 7 }, (_, i) => log(addDays(today, -i), 9, 90))];
    expect(loadMetrics(spike, today).acwr ?? 0).toBeGreaterThan(1.3);
  });

  it('has no ACWR without data and reports days of data', () => {
    expect(loadMetrics([], today)).toMatchObject({ acwr: null, daysOfData: 0 });
    expect(loadMetrics([log(addDays(today, -9), 5, 30)], today).daysOfData).toBe(10);
  });
});

describe('readiness', () => {
  it('is ready with good wellness and calibrating without history', () => {
    const r = computeReadiness(base);
    expect(r.level).toBe('listo');
    expect(r.calibrating).toBe(true);
    expect(r.confidence).toBe('baja');
  });

  it('drops with poor wellness, pain and little sleep', () => {
    const r = computeReadiness({ ...base, checkIn: checkIn(2, 2, 8), activePain: true, sleepHours: 4.5 });
    expect(r.level).toBe('descansa');
    expect(r.reasons.join(' ')).toMatch(/Dormiste poco|dolor/);
  });

  it('an active alert always forces rest', () => {
    const r = computeReadiness({ ...base, blockingPain: true });
    expect(r.level).toBe('descansa');
    expect(r.score).toBeLessThanOrEqual(40);
  });

  it('penalises a load spike, more strictly for minors, and honours sensitivity', () => {
    const steady = Array.from({ length: 40 }, (_, i) => log(addDays(today, -i - 7), 4, 40));
    const spike = [...steady, ...Array.from({ length: 7 }, (_, i) => log(addDays(today, -i), 8, 60))];
    const adult = computeReadiness({ ...base, logs: spike });
    expect(adult.metrics.acwr ?? 0).toBeGreaterThan(1.2);
    expect(computeReadiness({ ...base, logs: spike, minor: true }).score).toBeLessThanOrEqual(adult.score);
    const mid = { ...base, checkIn: checkIn(6, 6, 4) };
    expect(computeReadiness({ ...mid, sensitivity: 'estricto' }).score).toBe(computeReadiness({ ...mid, sensitivity: 'permisivo' }).score);
    const order = ['descansa', 'moderado', 'listo'];
    expect(order.indexOf(computeReadiness({ ...mid, sensitivity: 'estricto' }).level)).toBeLessThanOrEqual(order.indexOf(computeReadiness({ ...mid, sensitivity: 'permisivo' }).level));
  });

  it('reports high confidence only with 28 days of data and a check-in', () => {
    const logs = Array.from({ length: 30 }, (_, i) => log(addDays(today, -i), 5, 40));
    const r = computeReadiness({ ...base, logs });
    expect(r.calibrating).toBe(false);
    expect(r.confidence).toBe('alta');
    expect(computeReadiness({ ...base, logs, checkIn: null }).confidence).toBe('baja');
  });
});
