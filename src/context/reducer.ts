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
  };
}

const MAX_CHECKINS = 400;
const MAX_LOGS = 800;
const MAX_COACH_LOG = 40;
const MAX_PAIN_REPORTS = 200;

function isWeeklyStreak(state: AppState): boolean {
  return state.player ? isMinor(state.player.ageBand) : false;
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
        matches: state.matches.map((m) => (m.id === action.matchId ? { ...m, events: [...m.events, action.event] } : m)),
      };

    case 'UNDO_MATCH_EVENT':
      return {
        ...state,
        matches: state.matches.map((m) => (m.id === action.matchId ? { ...m, events: m.events.slice(0, -1) } : m)),
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

    case 'RESOLVE_PAIN':
      return { ...state, painReports: state.painReports.map((r) => (r.id === action.reportId ? { ...r, status: 'resuelto' } : r)) };

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
