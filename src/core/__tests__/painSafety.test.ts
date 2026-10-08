import { EMPTY_SCREENING_INPUT, assessProgress, blockedZones, dueFollowUp, screenPain, type PainScreeningInput, type TrackedReport } from '../painSafety';

const input = (patch: Partial<PainScreeningInput>): PainScreeningInput => ({ ...EMPTY_SCREENING_INPUT, ...patch });
const HOUR = 3_600_000;

describe('screenPain', () => {
  it('is ok for a mild pain with no signs', () => {
    const r = screenPain(input({ zone: 'isquiotibiales', intensity: 3 }));
    expect(r.level).toBe('ok');
    expect(r.blockZone).toBe(false);
  });

  it('R1: deformity, sudden numbness, chest pain and 9+ pain are emergencies', () => {
    for (const patch of [{ visibleDeformity: true }, { numbnessOrWeakness: true }, { chestOrBreathing: true }, { intensity: 9 }]) {
      const r = screenPain(input(patch));
      expect(r.level).toBe('urgencias');
      expect(r.ruleIds).toContain('R1');
      expect(r.stopTrainingToday).toBe(true);
    }
  });

  it('R2: ankle with no weight bearing or bone tenderness', () => {
    expect(screenPain(input({ zone: 'tobillo', canUseNormally: false })).ruleIds).toContain('R2');
    expect(screenPain(input({ zone: 'pie', boneTenderness: true })).level).toBe('consulta');
  });

  it('R3: knee that locks or gives way', () => {
    const r = screenPain(input({ zone: 'rodilla', jointLockedOrGivingWay: true }));
    expect(r.level).toBe('consulta');
    expect(r.ruleIds).toContain('R3');
    expect(r.blockZone).toBe(true);
  });

  it('R5: muscle tear sensation', () => {
    expect(screenPain(input({ zone: 'isquiotibiales', heardCrack: true })).ruleIds).toContain('R5');
  });

  it('R6 and R7: lumbar red flags', () => {
    expect(screenPain(input({ zone: 'lumbar', saddleOrBladder: true })).level).toBe('urgencias');
    expect(screenPain(input({ zone: 'lumbar', legWeaknessWorsening: true })).level).toBe('urgencias');
    const r7 = screenPain(input({ zone: 'lumbar', nightOrRestPain: true }));
    expect(r7.level).toBe('consulta');
    expect(r7.ruleIds).toContain('R7');
    expect(screenPain(input({ zone: 'lumbar', intensity: 3 })).level).toBe('ok');
  });

  it('R8: head blow with symptoms stops training today; emergency signs are urgent', () => {
    const mild = screenPain(input({ zone: 'cabeza', headBlowWithSymptoms: true }));
    expect(mild.level).toBe('consulta');
    expect(mild.stopTrainingToday).toBe(true);
    const urgent = screenPain(input({ zone: 'cabeza', headBlowWithSymptoms: true, headEmergencySigns: true }));
    expect(urgent.level).toBe('urgencias');
  });

  it('R9, R10, R11', () => {
    expect(screenPain(input({ zone: 'gemelo', calfSwellingHeat: true })).ruleIds).toContain('R9');
    expect(screenPain(input({ zone: 'hombro', intensity: 7 })).ruleIds).toContain('R10');
    expect(screenPain(input({ zone: 'canilla', mechanism: 'sobrecarga', boneTenderness: true, daysSinceOnset: 12 })).ruleIds).toContain('R11');
  });

  it('takes the highest level when several rules fire', () => {
    const r = screenPain(input({ zone: 'rodilla', boneTenderness: true, visibleDeformity: true }));
    expect(r.level).toBe('urgencias');
    expect(r.ruleIds).toEqual(expect.arrayContaining(['R1', 'R3', 'R4']));
  });
});

describe('follow-ups', () => {
  const base: TrackedReport = { zone: 'rodilla', createdAt: '2026-10-01T10:00:00.000Z', intensity: 5, followUps: [], status: 'activo' };
  const t0 = Date.parse(base.createdAt);

  it('asks at 24, 48 and 72 hours, then weekly', () => {
    expect(dueFollowUp(base, t0 + 23 * HOUR)).toBeNull();
    expect(dueFollowUp(base, t0 + 24 * HOUR)).toBe(0);
    const one = { ...base, followUps: [{ at: 'x', intensity: 4, note: '' }] };
    expect(dueFollowUp(one, t0 + 30 * HOUR)).toBeNull();
    expect(dueFollowUp(one, t0 + 48 * HOUR)).toBe(1);
    const four = { ...base, followUps: Array.from({ length: 4 }, () => ({ at: 'x', intensity: 2, note: '' })) };
    expect(dueFollowUp(four, t0 + 100 * HOUR)).toBeNull();
    expect(dueFollowUp(four, t0 + 336 * HOUR)).toBe(4);
    expect(dueFollowUp({ ...base, status: 'resuelto' }, t0 + 500 * HOUR)).toBeNull();
  });

  it('flags pain that does not improve, worsens, is severe or recurs', () => {
    expect(assessProgress(base, t0 + 10 * HOUR).level).toBe('ok');
    const stuck = { ...base, followUps: [{ at: 'a', intensity: 5, note: '' }] };
    expect(assessProgress(stuck, t0 + 80 * HOUR).reasons.join(' ')).toMatch(/72 horas/);
    const worse = { ...base, followUps: [{ at: 'a', intensity: 8, note: '' }] };
    const w = assessProgress(worse, t0 + 30 * HOUR);
    expect(w.level).toBe('consulta');
    expect(w.reasons.join(' ')).toMatch(/7 o más|empeor/);
    expect(assessProgress(base, t0 + HOUR, 3).reasons.join(' ')).toMatch(/tres veces/);
    const better = { ...base, followUps: [{ at: 'a', intensity: 2, note: '' }] };
    expect(assessProgress(better, t0 + 80 * HOUR).level).toBe('ok');
  });

  it('blocks zones with active alerts or notable pain', () => {
    const zones = blockedZones([
      { zone: 'rodilla', status: 'activo', level: 'consulta', clearedByProfessional: false, intensity: 3 },
      { zone: 'tobillo', status: 'activo', level: 'ok', clearedByProfessional: false, intensity: 5 },
      { zone: 'hombro', status: 'activo', level: 'ok', clearedByProfessional: false, intensity: 2 },
      { zone: 'cadera', status: 'resuelto', level: 'urgencias', clearedByProfessional: false, intensity: 9 },
      { zone: 'gemelo', status: 'activo', level: 'consulta', clearedByProfessional: true, intensity: 2 },
    ]);
    expect(zones.sort()).toEqual(['rodilla', 'tobillo']);
  });
});
