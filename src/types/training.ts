import { z } from 'zod';

export const EXERCISE_CATEGORIES = [
  'prevencion',
  'fuerza',
  'potencia',
  'velocidad',
  'agilidad',
  'resistencia',
  'movilidad',
  'tecnica',
  'coordinacion',
  'core',
  'calentamiento',
  'vueltaCalma',
  'recuperacion',
] as const;
export const exerciseCategorySchema = z.enum(EXERCISE_CATEGORIES);
export type ExerciseCategory = z.infer<typeof exerciseCategorySchema>;

/** Una animación reutilizable por patrón de movimiento. */
export const MOVEMENT_PATTERNS = [
  'sentadilla',
  'bisagra',
  'zancada',
  'plancha',
  'salto',
  'carrera',
  'empuje',
  'tiron',
  'movilidad',
  'equilibrio',
] as const;
export const movementPatternSchema = z.enum(MOVEMENT_PATTERNS);
export type MovementPattern = z.infer<typeof movementPatternSchema>;

export const BODY_ZONES = [
  'cabeza',
  'cuello',
  'hombro',
  'lumbar',
  'cadera',
  'ingle',
  'cuadriceps',
  'isquiotibiales',
  'rodilla',
  'gemelo',
  'aquiles',
  'tobillo',
  'pie',
  'canilla',
] as const;
export const bodyZoneSchema = z.enum(BODY_ZONES);
export type BodyZone = z.infer<typeof bodyZoneSchema>;

export const EQUIPMENT = ['ninguno', 'bandas', 'mancuernas', 'gimnasio', 'balon', 'conos', 'escalera'] as const;
export const equipmentSchema = z.enum(EQUIPMENT);
export type Equipment = z.infer<typeof equipmentSchema>;

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  pattern: MovementPattern;
  /** Pasos de ejecución (3 a 5). */
  steps: readonly string[];
  commonMistake: string;
  /** Series × repeticiones, o series × segundos si `seconds` está definido. */
  sets: number;
  reps: number | null;
  seconds: number | null;
  restSeconds: number;
  equipment: readonly Equipment[];
  /** Zonas del cuerpo que cargan: se excluye si hay molestia en alguna. */
  loadsZones: readonly BodyZone[];
  /** Consulta para abrir la búsqueda de YouTube (opcional, requiere internet). */
  youtubeQuery: string;
}

export const sessionKindSchema = z.enum(['fuerza', 'prevencion', 'velocidad', 'tecnica', 'recuperacion', 'descanso']);
export type SessionKind = z.infer<typeof sessionKindSchema>;

export interface PlannedSession {
  /** Fecha ISO (YYYY-MM-DD). */
  date: string;
  kind: SessionKind;
  title: string;
  exerciseIds: readonly string[];
  estimatedMinutes: number;
}

export const sessionLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  durationSeconds: z.number().int().min(0),
  /** Esfuerzo percibido (escala 1 a 10). */
  rpe: z.number().int().min(1).max(10),
  exerciseIds: z.array(z.string()),
});
export type SessionLog = z.infer<typeof sessionLogSchema>;

export const checkInSchema = z.object({
  id: z.string(),
  date: z.string(),
  /** Cómo me siento hoy, 1 (mal) a 10 (excelente). */
  mood: z.number().int().min(1).max(10),
  energy: z.number().int().min(1).max(10),
  soreness: z.number().int().min(1).max(10),
  zones: z.array(bodyZoneSchema),
});
export type CheckIn = z.infer<typeof checkInSchema>;

export const timerPresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(30),
  prepSeconds: z.number().int().min(0).max(60),
  workSeconds: z.number().int().min(1).max(3600),
  restSeconds: z.number().int().min(0).max(3600),
  rounds: z.number().int().min(1).max(99),
});
export type TimerPreset = z.infer<typeof timerPresetSchema>;

export const GOALS = ['subir_nivel', 'prevenir_lesiones', 'mejorar_mentalidad', 'mejorar_fisico', 'entender_juego', 'llevar_estadisticas'] as const;
export const goalSchema = z.enum(GOALS);
export type Goal = z.infer<typeof goalSchema>;

export const planPrefsSchema = z.object({
  daysPerWeek: z.number().int().min(1).max(7),
  minutesPerSession: z.number().int().min(10).max(120),
  equipment: z.array(equipmentSchema),
  /** Zonas con molestia marcadas en el cuestionario o en un check-in. */
  discomfortZones: z.array(bodyZoneSchema),
  /** Fechas ISO de partidos próximos. */
  matchDates: z.array(z.string()),
  /** Objetivos elegidos en el cuestionario (se pueden elegir varios). */
  goals: z.array(goalSchema).default([]),
});
export type PlanPrefs = z.infer<typeof planPrefsSchema>;
