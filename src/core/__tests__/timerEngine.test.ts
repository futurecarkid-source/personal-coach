import { BUILT_IN_PRESETS, computeIntervalState, formatClock, totalDurationMs } from '../timerEngine';

const plan = { prepSeconds: 5, workSeconds: 20, restSeconds: 10, rounds: 3 };

describe('interval engine', () => {
  it('computes the total without a rest after the last round', () => {
    expect(totalDurationMs(plan)).toBe((5 + 3 * 20 + 2 * 10) * 1000);
  });

  it('walks through the phases', () => {
    expect(computeIntervalState(plan, 0).phase).toBe('prep');
    expect(computeIntervalState(plan, 4999).phase).toBe('prep');
    const work1 = computeIntervalState(plan, 5000);
    expect(work1.phase).toBe('work');
    expect(work1.round).toBe(1);
    expect(computeIntervalState(plan, 25000).phase).toBe('rest');
    const work2 = computeIntervalState(plan, 35000);
    expect(work2.phase).toBe('work');
    expect(work2.round).toBe(2);
    const last = computeIntervalState(plan, 5000 + 20000 + 10000 + 20000 + 10000 + 19999);
    expect(last.phase).toBe('work');
    expect(last.round).toBe(3);
    expect(last.phaseRemainingMs).toBe(1);
  });

  it('finishes exactly at the total duration', () => {
    const total = totalDurationMs(plan);
    expect(computeIntervalState(plan, total - 1).finished).toBe(false);
    const done = computeIntervalState(plan, total);
    expect(done.finished).toBe(true);
    expect(done.phase).toBe('done');
    expect(done.totalRemainingMs).toBe(0);
  });

  it('handles EMOM (no rest) and negative elapsed', () => {
    const emom = BUILT_IN_PRESETS.find((p) => p.id === 'emom')?.plan;
    expect(emom).toBeDefined();
    if (!emom) return;
    expect(computeIntervalState(emom, 10_000 + 60_000).round).toBe(2);
    expect(computeIntervalState(emom, -50).phase).toBe('prep');
  });

  it('formats clocks', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65_000)).toBe('01:05');
    expect(formatClock(3_661_000)).toBe('1:01:01');
    expect(formatClock(1_234, true)).toBe('00:01.2');
    expect(formatClock(-10)).toBe('00:00');
  });
});
