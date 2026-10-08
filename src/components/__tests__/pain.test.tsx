import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BodyMap, sideFromHalf } from '../specialized/BodyMap';
import { appReducer, createInitialState } from '../../context/reducer';
import type { PainReport } from '../../types';

const report: PainReport = {
  id: 'r1', zone: 'rodilla', side: 'derecho', photo: { uri: 'file:///x.jpg', aspect: 1, markers: [{ x: 0.5, y: 0.5 }] }, createdAt: '2026-10-08T10:00:00.000Z',
  intensity: 4, mechanism: 'giro', kind: 'punzante', canUseNormally: true, swelling: false, level: 'ok', ruleIds: [],
  followUps: [{ at: '2026-10-09T10:00:00.000Z', intensity: 3, note: '', photo: { uri: 'file:///y.jpg', aspect: 1, markers: [] } }], status: 'activo', clearedByProfessional: false,
};

describe('body map', () => {
  it('maps the tapped half to the person\'s side, mirrored when seen from the front', () => {
    expect(sideFromHalf('izq', 'frente')).toBe('derecho');
    expect(sideFromHalf('der', 'frente')).toBe('izquierdo');
    expect(sideFromHalf('izq', 'espalda')).toBe('izquierdo');
    expect(sideFromHalf('centro', 'frente')).toBe('centro');
  });

  it('renders and exposes its accessibility label', () => {
    render(<BodyMap zone="rodilla" side="derecho" view="frente" onViewChange={jest.fn()} onSelect={jest.fn()} />);
    expect(screen.getByText('Rodilla derecha')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Espalda'));
  });
});

describe('pain reducer', () => {
  it('RAISE_PAIN_LEVEL only raises the level', () => {
    const s = { ...createInitialState(), painReports: [report] };
    const up = appReducer(s, { type: 'RAISE_PAIN_LEVEL', reportId: 'r1', level: 'consulta' });
    expect(up.painReports[0]?.level).toBe('consulta');
    const down = appReducer(up, { type: 'RAISE_PAIN_LEVEL', reportId: 'r1', level: 'ok' });
    expect(down.painReports[0]?.level).toBe('consulta');
  });

  it('RESOLVE_PAIN drops the photos from the state', () => {
    const s = { ...createInitialState(), painReports: [report] };
    const done = appReducer(s, { type: 'RESOLVE_PAIN', reportId: 'r1' });
    expect(done.painReports[0]?.status).toBe('resuelto');
    expect(done.painReports[0]?.photo).toBeNull();
    expect(done.painReports[0]?.followUps[0]?.photo).toBeUndefined();
  });
});
