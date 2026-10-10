import { INITIAL_GAMIFICATION, addXp, sessionXp, touchStreak } from '../core/gamification';
import { isMinor, STATE_VERSION, type AppAction, type AppState, type PlanPrefs, type Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  hapticsEnabled: true,
  cardEffect: 2,
  reduceMotion: false,
  healthNoticeAccepted: false,
  aiGatewayUrl: '',
  aiConsentAt: null,
  lastOnlineAt: null,
  remindersEnabled: false,
  wearable: 'ninguno',
  reminderHour: 18,
  guardianConsent: false,
  coachPersona: 'motivador',
  readinessSensitivity: 'equilibrado',
  sleepGoalHours: 8,
};

export const DEFAULT_PLAN_PREFS: PlanPrefs = {
  daysPerWeek: 3,
  minutesPerSession: 40,
  equipment: ['ninguno'],
  discomfortZones: [],
  matchDates: [],
  goals: [],
};

export function createInitialState(): AppState {
  return {
    version: STATE_VERSION,
    player: null,
    settings: DEFAULT_SETTINGS,
    gamification: INITIAL_GAMIFICATION,
    planPrefs: DEFAULT_PLAN_PREFS,
    checkIns: [],
    sessionLogs: [],
    matches: [],
    plays: [],
    timerPresets: [],
    aiPlan: null,
    coachLog: [],
    painReports: [],
    sleepLogs: [],
    reflexLogs: [],
    mindLogs: [],
    waterLogs: [],
    achievements: [],
    questClaims: [],
  };
}

const MAX_CHECKINS = 400;
const MAX_LOGS = 800;
const MAX_COACH_LOG = 40;
const MAX_PAIN_REPORTS = 200;

function isWeeklyStreak(state: AppState): boolean {
  return state.player ? isMinor(state.player.ageBand) : false;
}

/** Un gol registrado suma al marcador: de mi equipo a favor, del rival en contra. */
function goalDelta(event: { type: string; side: string }): { for: number; against: number } {
  if (event.type !== 'gol') return { for: 0, against: 0 };
  return event.side === 'rival' ? { for: 0, against: 1 } : { for: 1, against: 0 };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'SET_PLAYER':
      return { ...state, player: action.player };

    case 'SET_ATTRIBUTE': {
      if (!state.player) return state;
      const value = Math.max(1, Math.min(99, Math.round(action.value)));
      return {
        ...state,
        player: {
          ...state.player,
          attributes: { ...state.player.attributes, [action.key]: { value, source: action.source } },
        },
      };
    }

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'APPLY_ESTIMATES': {
      if (!state.player) return state;
      const attributes = { ...state.player.attributes };
      for (const [key, value] of Object.entries(action.attributes)) {
        const current = attributes[key as keyof typeof attributes];
        // Solo se reemplazan las cifras que siguen siendo "estimado": lo medido o ajustado a mano se respeta.
        if (value && (!current || current.source === 'estimado')) attributes[key as keyof typeof attributes] = value;
      }
      return { ...state, player: { ...state.player, attributes } };
    }

    case 'SET_PLAN_PREFS':
      return { ...state, planPrefs: action.prefs };

    case 'ADD_CHECKIN': {
      const withoutSameDay = state.checkIns.filter((c) => c.date !== action.checkIn.date);
      const checkIns = [...withoutSameDay, action.checkIn].slice(-MAX_CHECKINS);
      return { ...state, checkIns, gamification: touchStreak(state.gamification, action.checkIn.date, isWeeklyStreak(state)) };
    }

    case 'LOG_SESSION': {
      const minutes = action.log.durationSeconds / 60;
      const streak = touchStreak(state.gamification, action.log.date, isWeeklyStreak(state));
      return {
        ...state,
        sessionLogs: [...state.sessionLogs, action.log].slice(-MAX_LOGS),
        gamification: addXp(streak, sessionXp(action.log.rpe, minutes)),
      };
    }

    case 'REGISTER_REST_DAY':
      return { ...state, gamification: touchStreak(state.gamification, action.date, isWeeklyStreak(state)) };

    case 'UPSERT_MATCH': {
      const exists = state.matches.some((m) => m.id === action.match.id);
      const matches = exists ? state.matches.map((m) => (m.id === action.match.id ? action.match : m)) : [...state.matches, action.match];
      return { ...state, matches };
    }

    case 'ADD_MATCH_EVENT':
      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id !== action.matchId) return m;
          const d = goalDelta(action.event);
          return { ...m, events: [...m.events, action.event], goalsFor: m.goalsFor + d.for, goalsAgainst: m.goalsAgainst + d.against };
        }),
      };

    case 'UNDO_MATCH_EVENT':
      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id !== action.matchId) return m;
          const last = m.events[m.events.length - 1];
          const d = last ? goalDelta(last) : { for: 0, against: 0 };
          return { ...m, events: m.events.slice(0, -1), goalsFor: Math.max(0, m.goalsFor - d.for), goalsAgainst: Math.max(0, m.goalsAgainst - d.against) };
        }),
      };

    case 'DELETE_MATCH':
      return { ...state, matches: state.matches.filter((m) => m.id !== action.matchId) };

    case 'SAVE_PLAY': {
      const exists = state.plays.some((p) => p.id === action.play.id);
      const plays = exists ? state.plays.map((p) => (p.id === action.play.id ? action.play : p)) : [...state.plays, action.play];
      return { ...state, plays };
    }

    case 'DELETE_PLAY':
      return { ...state, plays: state.plays.filter((p) => p.id !== action.playId) };

    case 'SAVE_TIMER_PRESET': {
      const exists = state.timerPresets.some((p) => p.id === action.preset.id);
      const timerPresets = exists
        ? state.timerPresets.map((p) => (p.id === action.preset.id ? action.preset : p))
        : [...state.timerPresets, action.preset];
      return { ...state, timerPresets };
    }

    case 'DELETE_TIMER_PRESET':
      return { ...state, timerPresets: state.timerPresets.filter((p) => p.id !== action.presetId) };

    case 'LOG_SLEEP': {
      const sleepLogs = [...state.sleepLogs.filter((l) => l.date !== action.log.date), action.log].slice(-200);
      return { ...state, sleepLogs, gamification: touchStreak(state.gamification, action.log.date, isWeeklyStreak(state)) };
    }

    case 'LOG_REFLEX':
      return { ...state, reflexLogs: [...state.reflexLogs, action.log].slice(-100) };

    case 'LOG_MIND': {
      const day = action.log.at.slice(0, 10);
      return { ...state, mindLogs: [...state.mindLogs, action.log].slice(-200), gamification: touchStreak(state.gamification, day, isWeeklyStreak(state)) };
    }

    case 'SET_WATER': {
      const glasses = Math.max(0, Math.min(30, action.glasses));
      const waterLogs = [...state.waterLogs.filter((w) => w.date !== action.date), { date: action.date, glasses }].slice(-60);
      return { ...state, waterLogs };
    }

    case 'CLAIM_QUEST':
      if (state.questClaims.includes(action.key)) return state;
      return { ...state, questClaims: [...state.questClaims, action.key].slice(-120), gamification: addXp(state.gamification, action.xp) };

    case 'UNLOCK_ACHIEVEMENT':
      if (state.achievements.some((a) => a.id === action.id)) return state;
      return { ...state, achievements: [...state.achievements, { id: action.id, at: action.at }], gamification: addXp(state.gamification, action.xp) };

    case 'ACK_LEVEL':
      return { ...state, gamification: { ...state.gamification, celebratedLevel: Math.max(state.gamification.celebratedLevel, action.level) } };

    case 'SET_AI_PLAN':
      return { ...state, aiPlan: action.plan };

    case 'ADD_COACH_MESSAGE':
      return { ...state, coachLog: [...state.coachLog, action.message].slice(-MAX_COACH_LOG) };

    case 'CLEAR_COACH_LOG':
      return { ...state, coachLog: [] };

    case 'ADD_PAIN_REPORT':
      return { ...state, painReports: [...state.painReports, action.report].slice(-MAX_PAIN_REPORTS) };

    case 'ADD_PAIN_FOLLOWUP':
      return {
        ...state,
        painReports: state.painReports.map((r) => (r.id === action.reportId ? { ...r, followUps: [...r.followUps, action.followUp] } : r)),
      };

    case 'RAISE_PAIN_LEVEL': {
      const rank = { ok: 0, consulta: 1, urgencias: 2 } as const;
      return {
        ...state,
        painReports: state.painReports.map((r) => (r.id === action.reportId && rank[action.level] > rank[r.level] ? { ...r, level: action.level } : r)),
      };
    }

    case 'RESOLVE_PAIN':
      return { ...state, painReports: state.painReports.map((r) => (r.id === action.reportId ? { ...r, status: 'resuelto', photo: null, followUps: r.followUps.map(({ photo: _photo, ...rest }) => rest) } : r)) };

    case 'CLEAR_PAIN_BLOCK':
      return { ...state, painReports: state.painReports.map((r) => (r.id === action.reportId ? { ...r, clearedByProfessional: true } : r)) };

    case 'RESET_ALL':
      return createInitialState();

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
