import { writeFileSync } from 'fs';
import { estimateAttributes } from '../../core/ovr';
import { appReducer, createInitialState } from '../reducer';
import type { AppState, Player } from '../../types';

const dump = process.env.POSE_DUMP;
(dump ? it : it.skip)('seed demo state', () => {
  const player: Player = {
    id: 'p1', nickname: 'Fede', number: 10, country: 'CO', position: 'MC', secondaryPositions: [], level: 'amateur', foot: 'derecho', club: null,
    ageBand: 'adulto', attributes: estimateAttributes({ position: 'MC', level: 'amateur' }), selfAssessment: {}, createdAt: '2026-09-20T00:00:00.000Z',
  };
  let s: AppState = appReducer(createInitialState(), { type: 'SET_PLAYER', player });
  s = appReducer(s, { type: 'SET_SETTINGS', patch: { healthNoticeAccepted: true } });
  s = appReducer(s, { type: 'ADD_PAIN_REPORT', report: { id: 'r1', zone: 'rodilla', side: 'derecho', photo: null, createdAt: new Date().toISOString(), intensity: 4, mechanism: 'giro', kind: 'sordo', canUseNormally: true, swelling: false, level: 'ok', ruleIds: [], followUps: [], status: 'activo', clearedByProfessional: false } });
  writeFileSync(`${dump}/seed.json`, JSON.stringify(s));
});
