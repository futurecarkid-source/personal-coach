import { z } from 'zod';
import {
  ageBandSchema,
  bodyZoneSchema,
  drawingKindSchema,
  equipmentSchema,
  exerciseCategorySchema,
  gameFormatSchema,
  levelSchema,
  movementPatternSchema,
  positionSchema,
  sessionKindSchema,
} from '../types';

/**
 * Contrato entre la app y el servicio de IA.
 * La app solo envía una tarea con datos compactos; el servicio guarda los prompts, elige el modelo
 * y valida la respuesta. Así el servicio no es un proxy abierto hacia un modelo.
 * Las salidas son deliberadamente simples (sin límites de longitud en el esquema del modelo): la app
 * recorta y valida después con `sanitize*`.
 */

export const AI_TASKS = ['coach_chat', 'weekly_plan', 'pain_followup', 'tactic_explain', 'match_review', 'scouting_estimate'] as const;
export const aiTaskSchema = z.enum(AI_TASKS);
export type AiTask = z.infer<typeof aiTaskSchema>;

export const PERSONAS = ['exigente', 'motivador', 'cientifico', 'calmado'] as const;
export const personaSchema = z.enum(PERSONAS);
export type Persona = z.infer<typeof personaSchema>;

// ---------- Contexto compacto (nunca apodo, club, país, fotos ni texto libre sin que la persona lo escriba) ----------

export const profileContextSchema = z.object({
  position: positionSchema,
  level: levelSchema,
  ageBand: ageBandSchema,
  daysPerWeek: z.number().int(),
  minutesPerSession: z.number().int(),
  equipment: z.array(equipmentSchema),
  discomfortZones: z.array(bodyZoneSchema),
});
export type ProfileContext = z.infer<typeof profileContextSchema>;

export const snapshotContextSchema = z.object({
  today: z.string(),
  streak: z.number().int(),
  lastCheckIn: z.object({ mood: z.number(), energy: z.number(), soreness: z.number(), zones: z.array(bodyZoneSchema) }).nullable(),
  todaySession: z.object({ title: z.string(), kind: sessionKindSchema, exercises: z.array(z.string()) }).nullable(),
  recentSessions: z.array(z.object({ date: z.string(), title: z.string(), minutes: z.number(), rpe: z.number() })),
  activePain: z.array(z.object({ zone: bodyZoneSchema, intensity: z.number(), daysAgo: z.number() })),
});
export type SnapshotContext = z.infer<typeof snapshotContextSchema>;

// ---------- Tareas ----------

const chatMessageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string() });
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const coachChatInputSchema = z.object({
  persona: personaSchema,
  profile: profileContextSchema,
  snapshot: snapshotContextSchema,
  messages: z.array(chatMessageSchema).min(1),
});
export const COACH_ACTIONS = ['abrir_plan', 'abrir_temporizador', 'registrar_descanso', 'reportar_dolor', 'abrir_pizarra', 'ninguna'] as const;
export const coachChatOutputSchema = z.object({
  reply: z.string(),
  actions: z.array(z.object({ type: z.enum(COACH_ACTIONS), label: z.string() })),
  needsProfessional: z.boolean(),
});

export const libraryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: exerciseCategorySchema,
  pattern: movementPatternSchema,
  loadsZones: z.array(bodyZoneSchema),
  minutes: z.number(),
});
export type LibraryItem = z.infer<typeof libraryItemSchema>;

export const weeklyPlanInputSchema = z.object({
  profile: profileContextSchema,
  snapshot: snapshotContextSchema,
  startDate: z.string(),
  days: z.number().int(),
  matchDates: z.array(z.string()),
  library: z.array(libraryItemSchema),
});
export const weeklyPlanOutputSchema = z.object({
  rationale: z.string(),
  days: z.array(z.object({ date: z.string(), kind: sessionKindSchema, title: z.string(), exerciseIds: z.array(z.string()), note: z.string() })),
});

export const PAIN_LEVELS = ['seguir', 'moderar', 'descansar', 'consultar'] as const;
export const painLevelSchema = z.enum(PAIN_LEVELS);
export type PainLevel = z.infer<typeof painLevelSchema>;

export const painFollowupInputSchema = z.object({
  profile: profileContextSchema,
  report: z.object({
    zone: bodyZoneSchema,
    intensity: z.number(),
    kind: z.string(),
    daysSinceOnset: z.number(),
    canWalk: z.boolean(),
    swelling: z.boolean(),
    side: z.enum(['izquierdo', 'derecho', 'centro']).optional(),
  }),
  history: z.array(z.object({ daysAgo: z.number(), intensity: z.number() })),
  question: z.string(),
});
export const painFollowupOutputSchema = z.object({
  summary: z.string(),
  tips: z.array(z.string()),
  questions: z.array(z.string()),
  level: painLevelSchema,
});

export const tacticExplainInputSchema = z.object({
  format: gameFormatSchema,
  formation: z.string(),
  rivalFormation: z.string().nullable(),
  tokens: z.array(z.object({ team: z.enum(['propio', 'rival', 'balon', 'cono']), x: z.number(), y: z.number() })),
  drawings: z.array(z.object({ kind: drawingKindSchema, from: z.object({ x: z.number(), y: z.number() }), to: z.object({ x: z.number(), y: z.number() }) })),
  question: z.string(),
});
export const tacticExplainOutputSchema = z.object({
  explanation: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const matchReviewInputSchema = z.object({
  position: positionSchema,
  minutesPlayed: z.number(),
  goalsFor: z.number(),
  goalsAgainst: z.number(),
  selfRating: z.number().nullable(),
  rpe: z.number().nullable(),
  stats: z.object({
    goals: z.number(),
    shots: z.number(),
    shotsOnTarget: z.number(),
    xg: z.number(),
    passAccuracy: z.number().nullable(),
    duelsWon: z.number(),
    duelsLost: z.number(),
    recoveries: z.number(),
    losses: z.number(),
    coldBlood: z.number().nullable(),
  }),
  drillOptions: z.array(z.object({ id: z.string(), name: z.string() })),
});
export const matchReviewOutputSchema = z.object({
  headline: z.string(),
  positives: z.array(z.string()),
  toImprove: z.array(z.string()),
  drills: z.array(z.string()),
});

export const scoutingEstimateInputSchema = z.object({
  profile: profileContextSchema,
  selfAssessment: z.array(z.object({ key: z.string(), score: z.number() })),
  goals: z.array(z.string()),
});
export const scoutingEstimateOutputSchema = z.object({
  attributes: z.array(z.object({ key: z.string(), value: z.number() })),
  notes: z.string(),
});

export const TASK_SCHEMAS = {
  coach_chat: { input: coachChatInputSchema, output: coachChatOutputSchema },
  weekly_plan: { input: weeklyPlanInputSchema, output: weeklyPlanOutputSchema },
  pain_followup: { input: painFollowupInputSchema, output: painFollowupOutputSchema },
  tactic_explain: { input: tacticExplainInputSchema, output: tacticExplainOutputSchema },
  match_review: { input: matchReviewInputSchema, output: matchReviewOutputSchema },
  scouting_estimate: { input: scoutingEstimateInputSchema, output: scoutingEstimateOutputSchema },
} as const;

export type TaskInput<T extends AiTask> = z.infer<(typeof TASK_SCHEMAS)[T]['input']>;
export type TaskOutput<T extends AiTask> = z.infer<(typeof TASK_SCHEMAS)[T]['output']>;

export type CoachChatOutput = TaskOutput<'coach_chat'>;
export type WeeklyPlanOutput = TaskOutput<'weekly_plan'>;
export type PainFollowupOutput = TaskOutput<'pain_followup'>;
export type TacticExplainOutput = TaskOutput<'tactic_explain'>;
export type MatchReviewOutput = TaskOutput<'match_review'>;
export type ScoutingEstimateOutput = TaskOutput<'scouting_estimate'>;

// ---------- Sobre de petición y respuesta ----------

export const runRequestSchema = z.object({
  task: aiTaskSchema,
  input: z.unknown(),
  /** La persona vio y aceptó qué se envía y a quién (obligatorio). */
  consent: z.literal(true),
  /** Un adulto responsable autorizó la IA (obligatorio si el perfil es de un menor). */
  guardianConsent: z.boolean().optional(),
});
export type RunRequest = z.infer<typeof runRequestSchema>;

export const AI_ERROR_CODES = [
  'unauthorized',
  'rate_limited',
  'quota_exceeded',
  'bad_request',
  'blocked',
  'bad_output',
  'provider_error',
  'offline',
  'not_configured',
  'consent_required',
  'not_allowed',
  'timeout',
] as const;
export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export interface RunSuccess<T extends AiTask> {
  ok: true;
  task: T;
  output: TaskOutput<T>;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface RunFailure {
  ok: false;
  error: { code: AiErrorCode; message: string };
}

/** Límites de entrada que el servicio aplica (el contenido no se guarda). */
export const INPUT_LIMITS = {
  maxBodyBytes: 60_000,
  maxChatMessages: 12,
  maxMessageChars: 1_500,
} as const;
