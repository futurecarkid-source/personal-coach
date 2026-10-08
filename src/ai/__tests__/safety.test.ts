import { canUseAi, clip, detectSensitive, sanitizeReply, MEDICATION_MESSAGE } from '../safety';

const okSettings = { aiConsentAt: '2026-10-08T00:00:00.000Z', guardianConsent: false, aiGatewayUrl: 'https://x.example' };

describe('sensitive text', () => {
  it('detects crisis and eating-disorder language', () => {
    expect(detectSensitive('a veces pienso en quitarme la vida')).toBe('crisis');
    expect(detectSensitive('Quiero hacerme daño')).toBe('crisis');
    expect(detectSensitive('estoy pensando en dejar de comer para bajar de peso')).toBe('eating');
    expect(detectSensitive('mañana tengo partido y estoy nervioso')).toBeNull();
  });
});

describe('sanitizeReply', () => {
  it('removes sentences about medication and doses', () => {
    const r = sanitizeReply('Descansa y aplica hielo. Toma ibuprofeno 400 mg cada 8 horas. Vuelve poco a poco.');
    expect(r.replaced).toBe(true);
    expect(r.text).not.toMatch(/ibuprofeno|400 mg/i);
    expect(r.text).toContain('Descansa y aplica hielo.');
    expect(r.text).toContain(MEDICATION_MESSAGE);
  });

  it('keeps clean replies untouched and clips long ones', () => {
    expect(sanitizeReply('Hoy toca movilidad suave.')).toEqual({ text: 'Hoy toca movilidad suave.', replaced: false });
    expect(sanitizeReply('a'.repeat(3000), 100).text.length).toBeLessThanOrEqual(100);
  });

  it('falls back to the fixed message when everything is medication talk', () => {
    expect(sanitizeReply('Toma paracetamol.').text).toBe(MEDICATION_MESSAGE);
  });

  it('clip trims', () => {
    expect(clip('  hola  ', 10)).toBe('hola');
    expect(clip('abcdefghij', 5)).toBe('abcd…');
  });
});

describe('canUseAi', () => {
  it('requires configuration, then consent', () => {
    expect(canUseAi({ ageBand: 'adulto', settings: { ...okSettings, aiGatewayUrl: '' }, hasAccessCode: true })).toMatchObject({ allowed: false, code: 'not_configured' });
    expect(canUseAi({ ageBand: 'adulto', settings: okSettings, hasAccessCode: false })).toMatchObject({ code: 'not_configured' });
    expect(canUseAi({ ageBand: 'adulto', settings: { ...okSettings, aiConsentAt: null }, hasAccessCode: true })).toMatchObject({ code: 'consent_required' });
    expect(canUseAi({ ageBand: 'adulto', settings: okSettings, hasAccessCode: true })).toEqual({ allowed: true });
  });

  it('minors need a guardian and never send media', () => {
    expect(canUseAi({ ageBand: 'de16a17', settings: okSettings, hasAccessCode: true })).toMatchObject({ allowed: false, code: 'not_allowed' });
    expect(canUseAi({ ageBand: 'de16a17', settings: { ...okSettings, guardianConsent: true }, hasAccessCode: true })).toEqual({ allowed: true });
    expect(canUseAi({ ageBand: 'de16a17', settings: { ...okSettings, guardianConsent: true }, hasAccessCode: true, sendsMedia: true })).toMatchObject({ code: 'not_allowed' });
  });
});
