import { z } from 'zod';
import { playerSchema, type Player } from './player';
import { checkInSchema, planPrefsSchema, sessionLogSchema, timerPresetSchema, type CheckIn, type PlanPrefs, type SessionLog, type TimerPreset } from './training';
import { matchSchema, type Match } from './match';
import { playSchema, type Play } from './tactics';

export const settingsSchema = z.object({
  hapticsEnabled: z.boolean(),
  /** Intensidad del brillo de la tarjeta 3D: 0 apagado, 1 suave, 2 media, 3 máxima. */
  cardEffect: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  /** El usuario pidió reducir el movimiento dentro de la app (además del ajuste del sistema). */
  reduceMotion: z.boolean(),
  healthNoticeAccepted: z.boolean(),
});
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
});

export type AppState = Omit<z.infer<typeof appStateSchema>, 'player'> & { player: Player | null };

export type AppAction =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SET_PLAYER'; player: Player }
  | { type: 'SET_ATTRIBUTE'; key: string; value: number; source: 'medido' | 'ajustado' }
  | { type: 'SET_SETTINGS'; patch: Partial<Settings> }
  | { type: 'SET_PLAN_PREFS'; prefs: PlanPrefs }
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
  | { type: 'RESET_ALL' };
