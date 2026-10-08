import { BREATH_PROTOCOLS, breathState, cycleSeconds, pulsesFor } from '../breathing';
import { reflexTrend, summarizeReflex } from '../reflex';

const p478 = BREATH_PROTOCOLS[0]!;

describe('breathing', () => {
  it('4-7-8 cycles through inhale, hold and exhale', () => {
    expect(cycleSeconds(p478)).toBe(19);
    expect(breathState(p478, 0)).toMatchObject({ phase: 'inhale', cycle: 0 });
    expect(breathState(p478, 4000).phase).toBe('hold');
    expect(breathState(p478, 11000).phase).toBe('exhale');
    expect(breathState(p478, 19000)).toMatchObject({ phase: 'inhale', cycle: 1 });
    expect(breathState(p478, 2000).progress).toBeCloseTo(0.5, 5);
    expect(breathState(p478, 2000).remainingSeconds).toBeCloseTo(2, 5);
  });

  it('skips empty phases (resonancia has no hold)', () => {
    const res = BREATH_PROTOCOLS.find((p) => p.id === 'resonancia')!;
    expect(breathState(res, 5600).phase).toBe('exhale');
    expect(cycleSeconds(res)).toBe(11);
  });

  it('makes haptic pulses that rise on inhale, beat on hold and fade on exhale', () => {
    const inhale = pulsesFor('inhale', 4000);
    expect(inhale.length).toBeGreaterThan(3);
    expect(inhale[0]!.kind).toBe('soft');
    expect(inhale[inhale.length - 1]!.kind).toBe('medium');
    expect(inhale[1]!.at - inhale[0]!.at).toBeGreaterThan(inhale[inhale.length - 1]!.at - inhale[inhale.length - 2]!.at);
    expect(pulsesFor('hold', 7000)).toHaveLength(7);
    const exhale = pulsesFor('exhale', 8000);
    expect(exhale[1]!.at - exhale[0]!.at).toBeLessThan(exhale[exhale.length - 1]!.at - exhale[exhale.length - 2]!.at);
    expect(pulsesFor('rest', 4000)).toEqual([]);
    expect(pulsesFor('inhale', 0)).toEqual([]);
  });
});

describe('reflex summary', () => {
  it('computes median, spread and errors', () => {
    const s = summarizeReflex([
      { rtMs: 300, noGo: false, falseStart: false },
      { rtMs: 250, noGo: false, falseStart: false },
      { rtMs: 700, noGo: false, falseStart: false },
      { rtMs: 60, noGo: false, falseStart: false },
      { rtMs: null, noGo: false, falseStart: false },
      { rtMs: null, noGo: true, falseStart: false },
      { rtMs: 280, noGo: true, falseStart: false },
      { rtMs: null, noGo: false, falseStart: true },
    ]);
    expect(s).toMatchObject({ trials: 8, medianMs: 300, anticipations: 2, omissions: 1, commissions: 1, lapses: 1 });
    expect(s.sdMs).toBeGreaterThan(100);
  });

  it('handles no valid trials and computes trends against a baseline', () => {
    expect(summarizeReflex([])).toMatchObject({ medianMs: null, sdMs: null });
    expect(reflexTrend([300, 310], 290)).toBeNull();
    expect(reflexTrend([300, 320, 310], 290)).toEqual({ baseline: 310, deltaMs: -20 });
  });
});
