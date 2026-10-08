import { summarizeMatch } from '../matchStats';
import type { MatchEvent } from '../../types';

let n = 0;
const ev = (type: MatchEvent['type'], extra: Partial<MatchEvent> = {}): MatchEvent => {
  n += 1;
  return { id: `e${n}`, matchId: 'm', type, atSeconds: n, pos: null, shot: null, side: 'propio', ...extra };
};

describe('summarizeMatch', () => {
  it('counts goals, shots and pass accuracy', () => {
    const shot = { bodyPart: 'pie', situation: 'jugada', pressure: 1 } as const;
    const events = [
      ev('gol', { pos: { x: 94, y: 34 }, shot }),
      ev('tiroFuera', { pos: { x: 85, y: 20 }, shot }),
      ev('paseCompletado'), ev('paseCompletado'), ev('paseCompletado'), ev('paseFallido'),
    ];
    const s = summarizeMatch(events);
    expect(s.goals).toBe(1);
    expect(s.shots).toBe(2);
    expect(s.shotsOnTarget).toBe(1);
    expect(s.xg).toBeGreaterThan(0.1);
    expect(s.passAccuracy).toBe(75);
  });

  it('ignores rival events and reports null when there is no data', () => {
    const s = summarizeMatch([ev('gol', { side: 'rival' })]);
    expect(s.goals).toBe(0);
    expect(s.passAccuracy).toBeNull();
    expect(s.coldBlood).toBeNull();
  });

  it('computes cold blood after mistakes', () => {
    const s = summarizeMatch([ev('reaccionFalloPresiona'), ev('reaccionFalloPresiona'), ev('reaccionFalloPresiona'), ev('reaccionFalloSeFrena')]);
    expect(s.coldBlood).toBe(75);
  });

  it('collects positions for the heatmap', () => {
    const s = summarizeMatch([ev('recuperacion', { pos: { x: 30, y: 30 } }), ev('perdida')]);
    expect(s.positions).toHaveLength(1);
    expect(s.recoveries).toBe(1);
  });
});
