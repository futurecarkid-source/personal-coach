import { dayNumber, weekIndex } from './dates';
import type { Gamification } from '../types';

export const INITIAL_GAMIFICATION: Gamification = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  freezes: 1,
  celebratedLevel: 1,
};

export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1;
}

/** XP necesarios para llegar al siguiente nivel y progreso 0..1 dentro del nivel actual. */
export function levelProgress(xp: number): { level: number; current: number; next: number; fraction: number } {
  const level = levelFromXp(xp);
  const current = (level - 1) ** 2 * 120;
  const next = level ** 2 * 120;
  return { level, current, next, fraction: (xp - current) / (next - current) };
}

export function sessionXp(rpe: number, minutes: number): number {
  const effort = Math.max(1, Math.min(10, rpe));
  return Math.round(40 + effort * 3 + Math.min(60, Math.max(0, minutes)) / 2);
}

/**
 * Actualiza la racha de compromiso.
 * - Adultos: días seguidos. Menores: semanas seguidas (sin presión diaria).
 * - Un día de descanso prescrito cuenta como compromiso (nunca rompe la racha).
 * - Un congelador cubre un solo día perdido (solo en modo diario).
 * Sin recompensas por entrenar con dolor: el XP lo decide quien llama (no se llama en alerta roja).
 */
export function touchStreak(g: Gamification, dateISO: string, weekly: boolean): Gamification {
  if (g.lastActiveDate === dateISO) return g;
  let streak: number;
  let freezes = g.freezes;
  if (g.lastActiveDate === null) {
    streak = 1;
  } else if (weekly) {
    const gap = weekIndex(dateISO) - weekIndex(g.lastActiveDate);
    if (gap <= 0) streak = Math.max(1, g.streak);
    else streak = gap === 1 ? g.streak + 1 : 1;
  } else {
    const gap = dayNumber(dateISO) - dayNumber(g.lastActiveDate);
    if (gap <= 0) streak = Math.max(1, g.streak);
    else if (gap === 1) streak = g.streak + 1;
    else if (gap === 2 && freezes > 0) {
      freezes -= 1;
      streak = g.streak + 1;
    } else streak = 1;
  }
  return {
    ...g,
    streak,
    bestStreak: Math.max(g.bestStreak, streak),
    lastActiveDate: dateISO,
    freezes,
  };
}

export function addXp(g: Gamification, amount: number): Gamification {
  return { ...g, xp: Math.max(0, g.xp + Math.round(amount)) };
}
