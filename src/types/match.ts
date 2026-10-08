import { z } from 'zod';

export const EVENT_CATEGORIES = [
  'ataque',
  'pase',
  'defensa',
  'portero',
  'balonParado',
  'disciplina',
  'sinBalonMente',
] as const;
export const eventCategorySchema = z.enum(EVENT_CATEGORIES);
export type EventCategory = z.infer<typeof eventCategorySchema>;

export const MATCH_EVENT_TYPES = [
  // ataque
  'gol',
  'asistencia',
  'tiroPuerta',
  'tiroFuera',
  'tiroBloqueado',
  'paseClave',
  'regateGanado',
  'regatePerdido',
  'centro',
  'desmarque',
  'toqueArea',
  'conduccionProgresiva',
  'ocasionCreada',
  'ocasionFallada',
  // pase
  'paseCompletado',
  'paseFallido',
  'paseLargo',
  'paseProfundidad',
  'paseAtras',
  // defensa
  'entradaGanada',
  'entradaPerdida',
  'intercepcion',
  'despeje',
  'bloqueo',
  'recuperacion',
  'perdida',
  'dueloGanado',
  'dueloPerdido',
  'dueloAereo',
  'unoContraUnoDefensivo',
  'presionEfectiva',
  // portero
  'parada',
  'salida',
  'blocaje',
  'despejePuños',
  'paseConPie',
  'golEncajado',
  'penaltiParado',
  // balón parado
  'corner',
  'tiroLibre',
  'penalti',
  'saqueBanda',
  // disciplina
  'faltaCometida',
  'faltaRecibida',
  'amarilla',
  'roja',
  'fueraJuego',
  // sin balón y mente
  'movSinBalon',
  'perfilacion',
  'posturaPositiva',
  'posturaNegativa',
  'reaccionFalloPresiona',
  'reaccionFalloSeFrena',
  'comunicacion',
  'esfuerzoRecuperacion',
  'decisionBuena',
  'decisionMala',
  'liderazgo',
] as const;
export const matchEventTypeSchema = z.enum(MATCH_EVENT_TYPES);
export type MatchEventType = z.infer<typeof matchEventTypeSchema>;

/** Punto en el campo, en metros. Origen en la esquina de la portería propia: x a lo largo (0 a 105), y a lo ancho (0 a 68). */
export const pitchPointSchema = z.object({
  x: z.number().min(0).max(105),
  y: z.number().min(0).max(68),
});
export type PitchPoint = z.infer<typeof pitchPointSchema>;

export const SHOT_BODY_PARTS = ['pie', 'cabeza', 'otro'] as const;
export const shotBodyPartSchema = z.enum(SHOT_BODY_PARTS);
export type ShotBodyPart = z.infer<typeof shotBodyPartSchema>;

export const SHOT_SITUATIONS = ['jugada', 'contraataque', 'balonParado', 'rebote', 'penalti'] as const;
export const shotSituationSchema = z.enum(SHOT_SITUATIONS);
export type ShotSituation = z.infer<typeof shotSituationSchema>;

export const shotContextSchema = z.object({
  bodyPart: shotBodyPartSchema,
  situation: shotSituationSchema,
  /** Presión defensiva: 0 sin presión, 1 media, 2 alta. */
  pressure: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});
export type ShotContext = z.infer<typeof shotContextSchema>;

export const matchEventSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  type: matchEventTypeSchema,
  /** Segundos desde el inicio del partido (o del video). Se guarda en segundos, no en cuadros. */
  atSeconds: z.number().min(0),
  pos: pitchPointSchema.nullable(),
  /** Solo para tiros. */
  shot: shotContextSchema.nullable(),
  /** Si el evento es del rival o del equipo propio. */
  side: z.enum(['propio', 'rival']),
});
export type MatchEvent = z.infer<typeof matchEventSchema>;

export const matchSchema = z.object({
  id: z.string(),
  opponent: z.string().max(40),
  /** Fecha ISO (YYYY-MM-DD). */
  date: z.string(),
  competition: z.string().max(40),
  venue: z.enum(['local', 'visitante']),
  surface: z.enum(['cesped', 'sintetico', 'otro']),
  goalsFor: z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
  minutesPlayed: z.number().int().min(0).max(130),
  /** Nota propia del 1 al 10, o null si aún no se pone. */
  selfRating: z.number().int().min(1).max(10).nullable(),
  rpe: z.number().int().min(1).max(10).nullable(),
  events: z.array(matchEventSchema),
});
export type Match = z.infer<typeof matchSchema>;
