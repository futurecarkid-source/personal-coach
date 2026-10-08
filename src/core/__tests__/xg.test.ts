import { PENALTY_XG, expectedGoals, shotGeometry } from '../xg';

const foot = { bodyPart: 'pie', situation: 'jugada', pressure: 1 } as const;

describe('xG heurístico', () => {
  it('is a probability and decreases with distance', () => {
    const near = expectedGoals({ x: 99, y: 34 }, foot);
    const mid = expectedGoals({ x: 93, y: 34 }, foot);
    const far = expectedGoals({ x: 80, y: 34 }, foot);
    for (const v of [near, mid, far]) {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(far);
  });

  it('gives typical values', () => {
    expect(expectedGoals({ x: 93, y: 34 }, foot)).toBeGreaterThan(0.08);
    expect(expectedGoals({ x: 93, y: 34 }, foot)).toBeLessThan(0.25);
    expect(expectedGoals({ x: 80, y: 34 }, foot)).toBeLessThan(0.06);
  });

  it('penalizes headers and high pressure, and rewards rebounds', () => {
    const pos = { x: 94, y: 34 };
    expect(expectedGoals(pos, { ...foot, bodyPart: 'cabeza' })).toBeLessThan(expectedGoals(pos, foot));
    expect(expectedGoals(pos, { ...foot, pressure: 2 })).toBeLessThan(expectedGoals(pos, foot));
    expect(expectedGoals(pos, { ...foot, situation: 'rebote' })).toBeGreaterThan(expectedGoals(pos, foot));
  });

  it('is lower from a tight angle', () => {
    const central = expectedGoals({ x: 96, y: 34 }, foot);
    const tight = expectedGoals({ x: 96, y: 4 }, foot);
    expect(tight).toBeLessThan(central);
  });

  it('uses a fixed value for penalties', () => {
    expect(expectedGoals({ x: 94, y: 34 }, { ...foot, situation: 'penalti' })).toBe(PENALTY_XG);
  });

  it('computes the visible angle', () => {
    const { distance, angle } = shotGeometry({ x: 93, y: 34 });
    expect(distance).toBeCloseTo(12, 5);
    expect(angle).toBeCloseTo(2 * Math.atan(3.66 / 12), 3);
  });
});
