import { EXERCISES, EXERCISE_BY_ID } from '../content/exercises';
import { estimateExerciseMinutes } from '../core/planner';
import { addDays, dayNumber } from '../core/dates';
import { blockedZones } from '../core/painSafety';
import type { AppState, BodyZone, Exercise, PlannedSession } from '../types';
import type { LibraryItem, ProfileContext, SnapshotContext } from './contract';

/** Zonas que el plan debe evitar: las marcadas en el cuestionario más las de dolores activos. */
export function effectiveDiscomfortZones(state: Pick<AppState, 'planPrefs' | 'painReports'>): BodyZone[] {
  const fromPain = blockedZones(state.painReports);
  return [...new Set<BodyZone>([...state.planPrefs.discomfortZones, ...fromPain])];
}

/** Contexto de perfil mínimo: sin apodo, club, país ni foto. */
export function buildProfileContext(state: AppState): ProfileContext | null {
  if (!state.player) return null;
  return {
    position: state.player.position,
    level: state.player.level,
    ageBand: state.player.ageBand,
    daysPerWeek: state.planPrefs.daysPerWeek,
    minutesPerSession: state.planPrefs.minutesPerSession,
    equipment: state.planPrefs.equipment,
    discomfortZones: effectiveDiscomfortZones(state),
  };
}

export function buildSnapshot(state: AppState, today: string, todaySession: PlannedSession | undefined): SnapshotContext {
  const latest = [...state.checkIns].reverse().find((c) => c.date <= today) ?? null;
  const recent = state.sessionLogs.slice(-7).map((l) => ({
    date: l.date,
    title: l.title,
    minutes: Math.round(l.durationSeconds / 60),
    rpe: l.rpe,
  }));
  const nowDay = dayNumber(today);
  const activePain = state.painReports
    .filter((r) => r.status === 'activo')
    .map((r) => {
      const last = r.followUps[r.followUps.length - 1];
      return { zone: r.zone, intensity: last ? last.intensity : r.intensity, daysAgo: Math.max(0, nowDay - dayNumber(r.createdAt.slice(0, 10))) };
    });
  return {
    today,
    streak: state.gamification.streak,
    lastCheckIn: latest ? { mood: latest.mood, energy: latest.energy, soreness: latest.soreness, zones: latest.zones } : null,
    todaySession:
      todaySession && todaySession.kind !== 'descanso'
        ? { title: todaySession.title, kind: todaySession.kind, exercises: todaySession.exerciseIds.map((id) => EXERCISE_BY_ID.get(id)?.name ?? id) }
        : todaySession
          ? { title: todaySession.title, kind: todaySession.kind, exercises: [] }
          : null,
    recentSessions: recent,
    activePain,
  };
}

/** Ejercicios que la IA puede elegir: solo los que el equipamiento y las molestias permiten. */
export function buildLibrary(equipment: readonly string[], zones: readonly BodyZone[], library: readonly Exercise[] = EXERCISES): LibraryItem[] {
  return library
    .filter((e) => e.equipment.every((q) => q === 'ninguno' || equipment.includes(q)))
    .filter((e) => !e.loadsZones.some((z) => zones.includes(z)))
    .map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      pattern: e.pattern,
      loadsZones: [...e.loadsZones],
      minutes: Math.round(estimateExerciseMinutes(e) * 10) / 10,
    }));
}

export function planEndDate(startDate: string, days: number): string {
  return addDays(startDate, days - 1);
}

