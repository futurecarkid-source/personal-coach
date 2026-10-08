import { estimateAttributes } from '../../core/ovr';
import type { AppState, Player } from '../../types';
import { CORRUPT_KEY, STATE_KEY, loadState, saveState } from '../persistence';
import { appReducer, createInitialState } from '../reducer';
import { createMemoryStorage } from '../storage';

const player = (ageBand: Player['ageBand']): Player => ({
  id: 'p1',
  nickname: 'Fede',
  number: 10,
  country: 'CO',
  position: 'MC',
  secondaryPositions: [],
  level: 'amateur',
  foot: 'derecho',
  club: null,
  ageBand,
  attributes: estimateAttributes({ position: 'MC', level: 'amateur' }),
  createdAt: '2026-10-08T00:00:00.000Z',
});

describe('reducer', () => {
  it('logs a session: adds xp and starts the streak', () => {
    let s: AppState = appReducer(createInitialState(), { type: 'SET_PLAYER', player: player('adulto') });
    s = appReducer(s, {
      type: 'LOG_SESSION',
      log: { id: 'l1', date: '2026-10-08', title: 'Fuerza', durationSeconds: 2400, rpe: 6, exerciseIds: [] },
    });
    expect(s.sessionLogs).toHaveLength(1);
    expect(s.gamification.xp).toBeGreaterThan(0);
    expect(s.gamification.streak).toBe(1);
  });

  it('a prescribed rest day keeps the streak alive', () => {
    let s = appReducer(createInitialState(), { type: 'SET_PLAYER', player: player('adulto') });
    s = appReducer(s, { type: 'REGISTER_REST_DAY', date: '2026-10-08' });
    s = appReducer(s, { type: 'REGISTER_REST_DAY', date: '2026-10-09' });
    expect(s.gamification.streak).toBe(2);
  });

  it('uses weekly streaks for minors', () => {
    let s = appReducer(createInitialState(), { type: 'SET_PLAYER', player: player('de13a15') });
    s = appReducer(s, { type: 'REGISTER_REST_DAY', date: '2026-10-05' });
    s = appReducer(s, { type: 'REGISTER_REST_DAY', date: '2026-10-08' });
    expect(s.gamification.streak).toBe(1);
  });

  it('keeps one check-in per day', () => {
    let s = createInitialState();
    const c = { id: 'c1', date: '2026-10-08', mood: 5, energy: 5, soreness: 3, zones: [] };
    s = appReducer(s, { type: 'ADD_CHECKIN', checkIn: c });
    s = appReducer(s, { type: 'ADD_CHECKIN', checkIn: { ...c, id: 'c2', mood: 8 } });
    expect(s.checkIns).toHaveLength(1);
    expect(s.checkIns[0]?.mood).toBe(8);
  });

  it('adds and undoes match events', () => {
    let s = createInitialState();
    s = appReducer(s, {
      type: 'UPSERT_MATCH',
      match: {
        id: 'm1', opponent: 'Rival', date: '2026-10-08', competition: 'Liga', venue: 'local', surface: 'cesped',
        goalsFor: 0, goalsAgainst: 0, minutesPlayed: 0, selfRating: null, rpe: null, events: [],
      },
    });
    const event = { id: 'e1', matchId: 'm1', type: 'gol', atSeconds: 10, pos: null, shot: null, side: 'propio' } as const;
    s = appReducer(s, { type: 'ADD_MATCH_EVENT', matchId: 'm1', event });
    expect(s.matches[0]?.events).toHaveLength(1);
    s = appReducer(s, { type: 'UNDO_MATCH_EVENT', matchId: 'm1' });
    expect(s.matches[0]?.events).toHaveLength(0);
  });

  it('clamps and tags manual attribute changes', () => {
    let s = appReducer(createInitialState(), { type: 'SET_PLAYER', player: player('adulto') });
    s = appReducer(s, { type: 'SET_ATTRIBUTE', key: 'pas', value: 150, source: 'ajustado' });
    expect(s.player?.attributes.pas).toEqual({ value: 99, source: 'ajustado' });
  });
});

describe('persistence', () => {
  it('round-trips the state', async () => {
    const storage = createMemoryStorage();
    expect((await loadState(storage)).status).toBe('empty');
    const state = appReducer(createInitialState(), { type: 'SET_PLAYER', player: player('adulto') });
    await saveState(storage, state);
    const loaded = await loadState(storage);
    expect(loaded.status).toBe('ok');
    expect(loaded.state.player?.nickname).toBe('Fede');
  });

  it('recovers from corrupt data and keeps a copy', async () => {
    const storage = createMemoryStorage({ [STATE_KEY]: '{"version":1,"player":123' });
    const loaded = await loadState(storage);
    expect(loaded.status).toBe('recovered');
    expect(loaded.state.player).toBeNull();
    expect(storage.dump()[CORRUPT_KEY]).toContain('"version":1');
  });

  it('rejects data that does not match the schema', async () => {
    const storage = createMemoryStorage({ [STATE_KEY]: JSON.stringify({ version: 1, player: { nickname: '' } }) });
    expect((await loadState(storage)).status).toBe('recovered');
  });
});
