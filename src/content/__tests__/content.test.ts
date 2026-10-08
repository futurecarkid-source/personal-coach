import { EXERCISES, EXERCISE_BY_ID } from '../exercises';
import { INJURIES } from '../injuries';

describe('content integrity', () => {
  it('has 30 unique exercises', () => {
    expect(EXERCISES).toHaveLength(30);
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(30);
  });

  it('injury guide only references real exercises and has complete sections', () => {
    expect(INJURIES.length).toBeGreaterThanOrEqual(14);
    for (const injury of INJURIES) {
      for (const id of injury.exerciseIds) expect(EXERCISE_BY_ID.has(id)).toBe(true);
      expect(injury.signs.length).toBeGreaterThan(0);
      expect(injury.seeDoctor.length).toBeGreaterThan(0);
    }
    expect(INJURIES.some((i) => i.growing)).toBe(true);
    expect(INJURIES.some((i) => i.zone === 'cabeza')).toBe(true);
  });
});
