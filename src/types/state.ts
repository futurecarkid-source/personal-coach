import { z } from 'zod';
import { playerSchema, type Attributes, type Player } from './player';
import { checkInSchema, planPrefsSchema, sessionLogSchema, timerPresetSchema, type CheckIn, type PlanPrefs, type SessionLog, type TimerPreset } from './training';
import { matchSchema, type Match } from './match';
import { playSchema, type Play } from './tactics';
import { painReportSchema, type PainReport } from './pain';
import { sessionKindSchema } from './training';

export const settingsSchema = z.object({
  hapticsEnabled: z.boolean(),
  /** Intensidad del brillo de la tarjeta 3D: 0 apagado, 1 suave, 2 media, 3 máxima. */
  cardEffect: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  /** El usuario pidió reducir el movimiento dentro de la app (además del ajuste del sistema). */
  reduceMotion: z.boolean(),
  healthNoticeAccepted: z.boolean(),
  /** Dirección del servicio de IA (se pega una vez; el código de acceso va en el llavero, no aquí). */
  aiGatewayUrl: z.string().default(''),
  /** Fecha ISO en que la persona aceptó el aviso de qué se envía a la IA y a quién. */
  aiConsentAt: z.string().nullable().default(null),
  /** Un adulto responsable autoriza la IA (obligatorio para menores). */
  guardianConsent: z.boolean().default(false),
  coachPersona: z.enum(['exigente', 'motivador', 'cientifico', 'calmado']).default('motivador'),
  /** Qué tan pronto el anillo de Preparación te pide bajar la carga. */
  readinessSensitivity: z.enum(['estricto', 'equilibrado', 'permisivo']).default('equilibrado'),
  /** Horas de sueño que quieres dormir (cada persona elige la suya). */
  sleepGoalHours: z.number().min(5).max(12).default(8),
});

export const sleepLogSchema = z.object({
  date: z.string(),
  hours: z.number().min(0).max(16),
  /** Calidad percibida 1 (mala) a 5 (muy buena). */
  quality: z.number().int().min(1).max(5),
});
export type SleepLog = z.infer<typeof sleepLogSchema>;
export type Settings = z.infer<typeof settingsSchema>;

export const gamificationSchema = z.object({
  xp: z.number().int().min(0),
  /** Días seguidos con compromiso (o semanas para menores). */
  streak: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  /** Fecha ISO (YYYY-MM-DD) del último día con compromiso. */
  lastActiveDate: z.string().nullable(),
  /** Congeladores de racha disponibles. */
  freezes: z.number().int().min(0),
});
export type Gamification = z.infer<typeof gamificationSchema>;

export const aiPlanSchema = z.object({
  generatedAt: z.string(),
  rationale: z.string(),
  days: z.array(
    z.object({
      date: z.string(),
      kind: sessionKindSchema,
      title: z.string(),
      exerciseIds: z.array(z.string()),
      estimatedMinutes: z.number(),
    }),
  ),
});
export type AiPlan = z.infer<typeof aiPlanSchema>;

export const coachMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  at: z.string(),
  needsProfessional: z.boolean().default(false),
  /** De dónde viene la respuesta: IA, coach local (reglas) o sistema (avisos fijos). */
  source: z.enum(['ia', 'local', 'sistema']).default('local'),
});
export type CoachMessage = z.infer<typeof coachMessageSchema>;

export const STATE_VERSION = 1 as const;

export const appStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  player: playerSchema.nullable(),
  settings: settingsSchema,
  gamification: gamificationSchema,
  planPrefs: planPrefsSchema,
  checkIns: z.array(checkInSchema),
  sessionLogs: z.array(sessionLogSchema),
  matches: z.array(matchSchema),
  plays: z.array(playSchema),
  timerPresets: z.array(timerPresetSchema),
  aiPlan: aiPlanSchema.nullable().default(null),
  coachLog: z.array(coachMessageSchema).default([]),
  painReports: z.array(painReportSchema).default([]),
  sleepLogs: z.array(sleepLogSchema).default([]),
});

export type AppState = Omit<z.infer<typeof appStateSchema>, 'player'> & { player: Player | null };

export type AppAction =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SET_PLAYER'; player: Player }
  | { type: 'SET_ATTRIBUTE'; key: string; value: number; source: 'medido' | 'ajustado' }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'SET_PLAN_PREFS'; prefs: PlanPrefs }
  | { type: 'APPLY_ESTIMATES'; attributes: Attributes }
  | { type: 'ADD_CHECKIN'; checkIn: CheckIn }
  | { type: 'LOG_SESSION'; log: SessionLog }
  | { type: 'REGISTER_REST_DAY'; date: string }
  | { type: 'UPSERT_MATCH'; match: Match }
  | { type: 'ADD_MATCH_EVENT'; matchId: string; event: Match['events'][number] }
  | { type: 'UNDO_MATCH_EVENT'; matchId: string }
  | { type: 'DELETE_MATCH'; matchId: string }
  | { type: 'SAVE_PLAY'; play: Play }
  | { type: 'DELETE_PLAY'; playId: string }
  | { type: 'SAVE_TIMER_PRESET'; preset: TimerPreset }
  | { type: 'DELETE_TIMER_PRESET'; presetId: string }
  | { type: 'LOG_SLEEP'; log: SleepLog }
  | { type: 'SET_AI_PLAN'; plan: AiPlan | null }
  | { type: 'ADD_COACH_MESSAGE'; message: CoachMessage }
  | { type: 'CLEAR_COACH_LOG' }
  | { type: 'ADD_PAIN_REPORT'; report: PainReport }
  | { type: 'ADD_PAIN_FOLLOWUP'; reportId: string; followUp: PainReport['followUps'][number] }
  | { type: 'RESOLVE_PAIN'; reportId: string }
  | { type: 'CLEAR_PAIN_BLOCK'; reportId: string }
  | { type: 'RESET_ALL' };
