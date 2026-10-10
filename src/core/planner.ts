import { EXERCISES } from '../content/exercises';
import type { BodyZone, CheckIn, Equipment, Exercise, ExerciseCategory, PlannedSession, SessionKind } from '../types';
import { addDays, weekdayMonday0 } from './dates';

export interface PlanInput {
  /** Primer día del plan (YYYY-MM-DD). */
  startDate: string;
  days: number;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: readonly Equipment[];
  /** Zonas con molestia marcadas: se excluyen los ejercicios que las cargan. */
  discomfortZones: readonly BodyZone[];
  matchDates: readonly string[];
  /** Último check-in; si el cuerpo no está bien, el primer día baja a recuperación. */
  latestCheckIn?: CheckIn | null;
  /** La Preparación del día pide descanso o recuperación (anillo en rojo o alerta de dolor). */
  forceRecovery?: boolean;
}

const TRAINING_WEEKDAYS: Record<number, readonly number[]> = {
  1: [2],
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

const KIND_ROTATION: readonly SessionKind[] = ['fuerza', 'prevencion', 'velocidad', 'tecnica'];

const KIND_CATEGORIES: Record<Exclude<SessionKind, 'descanso'>, readonly ExerciseCategory[]> = {
  fuerza: ['fuerza', 'core'],
  prevencion: ['prevencion', 'movilidad', 'core'],
  velocidad: ['velocidad', 'agilidad', 'potencia'],
  tecnica: ['tecnica', 'coordinacion', 'agilidad'],
  recuperacion: ['movilidad', 'vueltaCalma', 'recuperacion'],
};

const KIND_TITLES: Record<SessionKind, string> = {
  fuerza: 'Fuerza y estabilidad',
  prevencion: 'Prevención de lesiones',
  velocidad: 'Velocidad y agilidad',
  tecnica: 'Técnica con balón',
  recuperacion: 'Recuperación',
  descanso: 'Descanso',
};

export function estimateExerciseMinutes(exercise: Exercise): number {
  const work = exercise.seconds ?? (exercise.reps ?? 8) * 3;
  return (exercise.sets * (work + exercise.restSeconds)) / 60 + 0.5;
}

export function estimateSessionMinutes(exercises: readonly Exercise[]): number {
  return Math.round(exercises.reduce((sum, e) => sum + estimateExerciseMinutes(e), 0));
}

function isAllowed(exercise: Exercise, equipment: readonly Equipment[], zones: readonly BodyZone[]): boolean {
  const hasEquipment = exercise.equipment.every((e) => e === 'ninguno' || equipment.includes(e));
  const safe = !exercise.loadsZones.some((z) => zones.includes(z));
  return hasEquipment && safe;
}

function pickExercises(
  kind: Exclude<SessionKind, 'descanso'>,
  input: PlanInput,
  minutes: number,
  offset: number,
  library: readonly Exercise[],
): Exercise[] {
  const allowed = library.filter((e) => isAllowed(e, input.equipment, input.discomfortZones));
  const categories = KIND_CATEGORIES[kind];
  const pool = allowed.filter((e) => categories.includes(e.category));
  const picked: Exercise[] = [];

  const warmUp = kind === 'recuperacion' ? undefined : allowed.find((e) => e.category === 'calentamiento');
  const coolDown = allowed.find((e) => e.category === 'vueltaCalma');
  if (warmUp) picked.push(warmUp);

  const rotated = pool.length === 0 ? [] : [...pool.slice(offset % pool.length), ...pool.slice(0, offset % pool.length)];
  for (const exercise of rotated) {
    if (picked.length >= 8) break;
    const tail = coolDown && kind !== 'recuperacion' ? estimateExerciseMinutes(coolDown) : 0;
    if (estimateSessionMinutes(picked) + estimateExerciseMinutes(exercise) + tail > minutes && picked.length >= 3) break;
    if (!picked.includes(exercise)) picked.push(exercise);
  }
  if (coolDown && !picked.includes(coolDown)) picked.push(coolDown);
  return picked;
}

export function feelsBad(checkIn: CheckIn | null | undefined): boolean {
  if (!checkIn) return false;
  return checkIn.mood <= 3 || checkIn.energy <= 2 || checkIn.soreness >= 8;
}

/**
 * Plan por reglas (sin IA): reparte los días de entrenamiento, rota el tipo de sesión,
 * protege los días alrededor del partido y excluye ejercicios según molestias y equipamiento.
 */
export function planDays(input: PlanInput, library: readonly Exercise[] = EXERCISES): PlannedSession[] {
  const perWeek = Math.max(1, Math.min(7, Math.round(input.daysPerWeek)));
  const trainingDays = TRAINING_WEEKDAYS[perWeek] ?? TRAINING_WEEKDAYS[3] ?? [];
  const sessions: PlannedSession[] = [];
  let sessionCounter = 0;

  for (let i = 0; i < input.days; i += 1) {
    const date = addDays(input.startDate, i);
    const isMatch = input.matchDates.includes(date);
    const dayBeforeMatch = input.matchDates.includes(addDays(date, 1));
    const dayAfterMatch = input.matchDates.includes(addDays(date, -1));
    const isTrainingDay = trainingDays.includes(weekdayMonday0(date));

    let kind: SessionKind;
    let title: string;
    if (isMatch) {
      kind = 'descanso';
      title = 'Día de partido';
    } else if (dayAfterMatch) {
      kind = 'recuperacion';
      title = KIND_TITLES.recuperacion;
    } else if (dayBeforeMatch && isTrainingDay) {
      kind = 'prevencion';
      title = 'Activación previa al partido';
    } else if (isTrainingDay) {
      kind = KIND_ROTATION[sessionCounter % KIND_ROTATION.length] ?? 'fuerza';
      sessionCounter += 1;
      title = KIND_TITLES[kind];
    } else {
      kind = 'descanso';
      title = KIND_TITLES.descanso;
    }

    if (i === 0 && kind !== 'descanso' && (feelsBad(input.latestCheckIn) || input.forceRecovery === true)) {
      kind = 'recuperacion';
      title = 'Recuperación (hoy te sientes cansado o con molestias)';
    }

    if (kind === 'descanso') {
      sessions.push({ date, kind, title, exerciseIds: [], estimatedMinutes: 0 });
      continue;
    }

    const minutes = kind === 'recuperacion' || dayBeforeMatch ? Math.min(input.minutesPerSession, 25) : input.minutesPerSession;
    const exercises = pickExercises(kind, input, minutes, sessionCounter, library);
    sessions.push({
      date,
      kind,
      title,
      exerciseIds: exercises.map((e) => e.id),
      estimatedMinutes: estimateSessionMinutes(exercises),
    });
  }
  return sessions;
}

/**
 * Para quien aún no ha entrenado: si el primer día cae en descanso, la primera sesión de la semana pasa a hoy
 * (y su día original queda de descanso). Así la primera impresión es entrenar, no esperar. No toca la cantidad de sesiones.
 */
export function startWithTraining(week: readonly PlannedSession[], hasHistory: boolean): PlannedSession[] {
  const first = week[0];
  if (hasHistory || !first || first.kind !== 'descanso') return [...week];
  const j = week.findIndex((s) => s.kind !== 'descanso');
  if (j <= 0) return [...week];
  const moved = week[j]!;
  return week.map((s, i) => {
    if (i === 0) return { ...moved, date: first.date };
    if (i === j) return { ...first, date: s.date };
    return s;
  });
}
