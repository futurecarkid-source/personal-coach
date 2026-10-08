import { estimateAttributes } from '../../core/ovr';
import { createInitialState } from '../../context/reducer';
import type { AppState } from '../../types';
import { buildLibrary, buildProfileContext, buildSnapshot, effectiveDiscomfortZones } from '../context';

function stateWithPlayer(): AppState {
  const s = createInitialState();
  return {
    ...s,
    player: {
      id: 'p', nickname: 'NoDebeSalir', number: 10, country: 'CO', position: 'MC', secondaryPositions: [], level: 'amateur', foot: 'derecho',
      club: 'ClubSecreto', ageBand: 'adulto', attributes: estimateAttributes({ position: 'MC', level: 'amateur' }), selfAssessment: {}, createdAt: '2026-10-08T00:00:00.000Z',
    },
  };
}

describe('AI context', () => {
  it('never includes nickname, club or country', () => {
    const s = stateWithPlayer();
    const profile = buildProfileContext(s);
    const snapshot = buildSnapshot(s, '2026-10-08', undefined);
    const json = JSON.stringify({ profile, snapshot });
    expect(json).not.toMatch(/NoDebeSalir|ClubSecreto|"CO"/);
  });

  it('merges quiz discomfort with active pain zones', () => {
    const s = stateWithPlayer();
    s.planPrefs = { ...s.planPrefs, discomfortZones: ['tobillo'] };
    s.painReports = [{ id: 'r', zone: 'rodilla', createdAt: '2026-10-07T10:00:00.000Z', intensity: 5, mechanism: 'giro', kind: 'punzante', canUseNormally: true, swelling: false, level: 'consulta', ruleIds: ['R3'], followUps: [], status: 'activo', clearedByProfessional: false }];
    expect(effectiveDiscomfortZones(s).sort()).toEqual(['rodilla', 'tobillo']);
    expect(buildSnapshot(s, '2026-10-08', undefined).activePain[0]).toMatchObject({ zone: 'rodilla', intensity: 5 });
  });

  it('only offers exercises the person can do', () => {
    const lib = buildLibrary(['ninguno'], ['rodilla']);
    expect(lib.length).toBeGreaterThan(3);
    expect(lib.find((e) => e.id === 'sentadilla-peso-corporal')).toBeUndefined();
    expect(lib.find((e) => e.id === 'remo-banda')).toBeUndefined();
  });

  it('returns null without a player', () => {
    expect(buildProfileContext(createInitialState())).toBeNull();
  });
});
