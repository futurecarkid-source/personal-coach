import { levelFromXp } from './gamification';
import { weekIndex } from './dates';
import type { AppState } from '../types';

// ---------- Rangos ----------

export interface Rank {
  minLevel: number;
  name: string;
  /** Verbo corto para el mensaje al subir. */
  blurb: string;
}

export const RANKS: readonly Rank[] = [
  { minLevel: 1, name: 'Cantera', blurb: 'Empieza el camino.' },
  { minLevel: 3, name: 'Promesa', blurb: 'Ya se nota el trabajo.' },
  { minLevel: 5, name: 'Titular', blurb: 'Te ganaste un puesto.' },
  { minLevel: 8, name: 'Crack', blurb: 'Tu constancia marca la diferencia.' },
  { minLevel: 12, name: 'Estrella', blurb: 'Nivel de primera.' },
  { minLevel: 17, name: 'Figura', blurb: 'Referente del equipo.' },
  { minLevel: 23, name: 'Leyenda', blurb: 'Pocos llegan hasta aquí.' },
];

export function rankFor(level: number): Rank {
  let current = RANKS[0]!;
  for (const r of RANKS) if (level >= r.minLevel) current = r;
  return current;
}

export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.minLevel > level) ?? null;
}

// ---------- Misiones ----------

export type QuestIcon = 'figure.run' | 'heart.text.square.fill' | 'moon.zzz.fill' | 'wind' | 'bolt.fill' | 'cross.case.fill';

export interface Quest {
  /** Clave única del día, por ejemplo `2026-10-09:sesion`. */
  key: string;
  id: string;
  title: string;
  hint: string;
  xp: number;
  icon: QuestIcon;
  done: boolean;
  claimed: boolean;
}

const dayOf = (iso: string): string => iso.slice(0, 10);

interface QuestDef {
  id: string;
  title: string;
  hint: string;
  xp: number;
  icon: QuestIcon;
  done: (s: AppState, date: string) => boolean;
}

const DEFS: Record<string, QuestDef> = {
  sesion: { id: 'sesion', title: 'Cumple tu sesión', hint: 'Haz la sesión de hoy (o descansa si toca).', xp: 40, icon: 'figure.run', done: (s, d) => s.sessionLogs.some((l) => l.date === d) },
  checkin: { id: 'checkin', title: 'Check-in del día', hint: 'Cuéntanos cómo te sientes.', xp: 15, icon: 'heart.text.square.fill', done: (s, d) => s.checkIns.some((c) => c.date === d) },
  sueno: { id: 'sueno', title: 'Registra tu sueño', hint: 'Horas y calidad de anoche.', xp: 15, icon: 'moon.zzz.fill', done: (s, d) => s.sleepLogs.some((l) => l.date === d) },
  respirar: { id: 'respirar', title: 'Respira 3 minutos', hint: 'Una sesión de respiración guiada.', xp: 20, icon: 'wind', done: (s, d) => s.mindLogs.some((l) => dayOf(l.at) === d && l.seconds >= 180) },
  reflejos: { id: 'reflejos', title: 'Test de reflejos', hint: 'Mide tu tiempo de reacción.', xp: 20, icon: 'bolt.fill', done: (s, d) => s.reflexLogs.some((l) => dayOf(l.at) === d) },
  cuidado: { id: 'cuidado', title: 'Cuida tu cuerpo', hint: 'Lee una ficha de lesiones o haz un seguimiento.', xp: 15, icon: 'cross.case.fill', done: (s, d) => s.painReports.some((r) => r.followUps.some((f) => dayOf(f.at) === d)) },
};

/** Una misión rotativa distinta cada día. */
const ROTATING = ['sueno', 'respirar', 'reflejos'] as const;

function pick(date: string): (typeof ROTATING)[number] {
  const n = Number.parseInt(date.replaceAll('-', ''), 10);
  return ROTATING[n % ROTATING.length]!;
}

export const DAILY_BONUS_XP = 50;

/** Misiones del día: sesión, check-in y una rotativa. Se completan solas; tú las reclamas. */
export function dailyQuests(state: AppState, date: string): { quests: Quest[]; bonusKey: string; bonusReady: boolean; bonusClaimed: boolean } {
  const ids = ['sesion', 'checkin', pick(date)];
  const first = state.sessionLogs.length === 0;
  const quests = ids.map((id) => {
    const def = DEFS[id]!;
    const key = `${date}:${id}`;
    // Primer día: la misión de sesión es más generosa y se llama distinto, para que el primer paso se sienta como un juego.
    const special = id === 'sesion' && first;
    return {
      key, id,
      title: special ? 'Tu primera sesión' : def.title,
      hint: special ? 'Unos minutos bastan. Suma tu primer XP.' : def.hint,
      xp: special ? 60 : def.xp,
      icon: def.icon, done: def.done(state, date), claimed: state.questClaims.includes(key),
    };
  });
  const bonusKey = `${date}:bonus`;
  return { quests, bonusKey, bonusReady: quests.every((q) => q.claimed), bonusClaimed: state.questClaims.includes(bonusKey) };
}

export const WEEKLY_XP = 150;

/** Reto semanal: cumple tantas sesiones como días de entrenamiento elegiste (máximo 5). */
export function weeklyChallenge(state: AppState, date: string): { key: string; goal: number; done: number; complete: boolean; claimed: boolean; xp: number } {
  const week = weekIndex(date);
  const goal = Math.max(1, Math.min(5, state.planPrefs.daysPerWeek));
  const days = new Set(state.sessionLogs.filter((l) => weekIndex(l.date) === week).map((l) => l.date));
  const key = `week-${week}`;
  return { key, goal, done: Math.min(goal, days.size), complete: days.size >= goal, claimed: state.questClaims.includes(key), xp: WEEKLY_XP };
}

// ---------- Logros ----------

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: string;
  /** Progreso actual y meta, para mostrar la barra aunque aún no se haya desbloqueado. */
  progress: (s: AppState) => { value: number; goal: number };
}

const matchGoals = (s: AppState): number[] => s.matches.map((m) => m.events.filter((e) => e.type === 'gol' && e.side === 'propio').length);
const cap = (value: number, goal: number): { value: number; goal: number } => ({ value: Math.min(value, goal), goal });

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'bienvenida', title: 'Bienvenido a Fulbito', description: 'Creaste tu tarjeta de jugador.', xp: 25, icon: 'star.fill', progress: (s) => cap(s.player ? 1 : 0, 1) },
  { id: 'primera-sesion', title: 'Primer paso', description: 'Completa tu primera sesión.', xp: 30, icon: 'figure.run', progress: (s) => cap(s.sessionLogs.length, 1) },
  { id: 'sesiones-5', title: 'Calentando motores', description: 'Completa 5 sesiones.', xp: 50, icon: 'flame.fill', progress: (s) => cap(s.sessionLogs.length, 5) },
  { id: 'sesiones-25', title: 'Máquina', description: 'Completa 25 sesiones.', xp: 150, icon: 'bolt.heart.fill', progress: (s) => cap(s.sessionLogs.length, 25) },
  { id: 'racha-3', title: 'Tres seguidos', description: 'Llega a una racha de 3.', xp: 40, icon: 'flame.fill', progress: (s) => cap(s.gamification.bestStreak, 3) },
  { id: 'racha-7', title: 'Semana perfecta', description: 'Llega a una racha de 7.', xp: 100, icon: 'flame.fill', progress: (s) => cap(s.gamification.bestStreak, 7) },
  { id: 'racha-30', title: 'Imparable', description: 'Llega a una racha de 30.', xp: 400, icon: 'flame.fill', progress: (s) => cap(s.gamification.bestStreak, 30) },
  { id: 'primer-checkin', title: 'Conócete', description: 'Haz tu primer check-in.', xp: 20, icon: 'heart.text.square.fill', progress: (s) => cap(s.checkIns.length, 1) },
  { id: 'sueno-7', title: 'Buen dormir', description: 'Registra tu sueño 7 días.', xp: 60, icon: 'moon.zzz.fill', progress: (s) => cap(s.sleepLogs.length, 7) },
  { id: 'mente-5', title: 'Cabeza fría', description: 'Haz 5 sesiones de respiración.', xp: 60, icon: 'wind', progress: (s) => cap(s.mindLogs.length, 5) },
  { id: 'reflejos-3', title: 'Reflejos', description: 'Haz 3 tests de reflejos.', xp: 60, icon: 'bolt.fill', progress: (s) => cap(s.reflexLogs.length, 3) },
  { id: 'primer-partido', title: 'Debut', description: 'Registra tu primer partido.', xp: 40, icon: 'sportscourt.fill', progress: (s) => cap(s.matches.length, 1) },
  { id: 'primer-gol', title: 'Gol', description: 'Marca un gol en un partido registrado.', xp: 50, icon: 'soccerball', progress: (s) => cap(matchGoals(s).reduce((a, b) => a + b, 0), 1) },
  { id: 'hat-trick', title: 'Hat-trick', description: 'Marca 3 goles en un mismo partido.', xp: 120, icon: 'crown.fill', progress: (s) => cap(Math.max(0, ...matchGoals(s)), 3) },
  { id: 'jugada', title: 'Estratega', description: 'Guarda una jugada en la pizarra.', xp: 40, icon: 'rectangle.and.pencil.and.ellipsis', progress: (s) => cap(s.plays.length, 1) },
  { id: 'cuidado', title: 'Cuidarte también es entrenar', description: 'Haz un seguimiento de dolor.', xp: 40, icon: 'cross.case.fill', progress: (s) => cap(s.painReports.reduce((n, r) => n + r.followUps.length, 0), 1) },
  { id: 'nivel-5', title: 'Titular', description: 'Llega al nivel 5.', xp: 80, icon: 'star.fill', progress: (s) => cap(levelFromXp(s.gamification.xp), 5) },
  { id: 'nivel-10', title: 'Crack', description: 'Llega al nivel 10.', xp: 200, icon: 'star.circle.fill', progress: (s) => cap(levelFromXp(s.gamification.xp), 10) },
];

export interface AchievementStatus {
  def: AchievementDef;
  unlockedAt: string | null;
  value: number;
  goal: number;
  /** Se cumple ahora aunque aún no esté guardado como desbloqueado. */
  met: boolean;
}

export function achievementStatuses(state: AppState): AchievementStatus[] {
  return ACHIEVEMENTS.map((def) => {
    const { value, goal } = def.progress(state);
    const unlocked = state.achievements.find((a) => a.id === def.id);
    return { def, unlockedAt: unlocked?.at ?? null, value, goal, met: value >= goal };
  });
}

/** Logros que ya se cumplen pero todavía no se han registrado. */
export function newlyMet(state: AppState): AchievementDef[] {
  return achievementStatuses(state).filter((a) => a.met && a.unlockedAt === null).map((a) => a.def);
}
