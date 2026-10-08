import { INITIAL_GAMIFICATION, levelFromXp, levelProgress, sessionXp, touchStreak } from '../gamification';

describe('streak', () => {
  it('starts at 1 and counts consecutive days', () => {
    let g = touchStreak(INITIAL_GAMIFICATION, '2026-10-05', false);
    expect(g.streak).toBe(1);
    g = touchStreak(g, '2026-10-06', false);
    expect(g.streak).toBe(2);
    g = touchStreak(g, '2026-10-06', false);
    expect(g.streak).toBe(2);
    expect(g.bestStreak).toBe(2);
  });

  it('uses a freeze to cover one missed day, once', () => {
    let g = touchStreak(INITIAL_GAMIFICATION, '2026-10-05', false);
    g = touchStreak(g, '2026-10-07', false);
    expect(g.streak).toBe(2);
    expect(g.freezes).toBe(0);
    g = touchStreak(g, '2026-10-09', false);
    expect(g.streak).toBe(1);
  });

  it('resets after a longer gap but keeps the best streak', () => {
    let g = touchStreak(INITIAL_GAMIFICATION, '2026-10-01', false);
    g = touchStreak(g, '2026-10-02', false);
    g = touchStreak(g, '2026-10-10', false);
    expect(g.streak).toBe(1);
    expect(g.bestStreak).toBe(2);
  });

  it('counts weeks for minors', () => {
    let g = touchStreak(INITIAL_GAMIFICATION, '2026-10-05', true); // lunes
    g = touchStreak(g, '2026-10-08', true); // misma semana
    expect(g.streak).toBe(1);
    g = touchStreak(g, '2026-10-12', true); // lunes siguiente
    expect(g.streak).toBe(2);
    g = touchStreak(g, '2026-10-26', true); // se salta una semana
    expect(g.streak).toBe(1);
  });
});

describe('xp and levels', () => {
  it('computes xp from effort and duration', () => {
    expect(sessionXp(5, 40)).toBe(75);
    expect(sessionXp(99, 500)).toBe(100);
  });

  it('computes levels and progress', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(120)).toBe(2);
    expect(levelFromXp(480)).toBe(3);
    const p = levelProgress(300);
    expect(p.level).toBe(2);
    expect(p.fraction).toBeGreaterThan(0);
    expect(p.fraction).toBeLessThan(1);
  });
});
