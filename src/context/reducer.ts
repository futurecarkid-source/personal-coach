import { INITIAL_GAMIFICATION, addXp, sessionXp, touchStreak } from '../core/gamification';
import { isMinor, STATE_VERSION, type AppAction, type AppState, type PlanPrefs, type Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  hapticsEnabled: true,
  cardEffect: 2,
  reduceMotion: false,
  healthNoticeAccepted: false,
};

export const DEFAULT_PLAN_PREFS: PlanPrefs = {
  daysPerWeek: 3,
  minutesPerSession: 40,
  equipment: ['ninguno'],
  discomfortZones: [],
  matchDates: [],
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
  };
}

const MAX_CHECKINS = 400;
const MAX_LOGS = 800;

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

    case 'RESET_ALL':
      return createInitialState();

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
