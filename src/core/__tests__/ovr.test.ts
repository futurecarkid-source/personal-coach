import { computeOvr, estimateAttributes, headlineKeys, rarityFromOvr } from '../ovr';

describe('OVR', () => {
  it('estimates attributes within bounds and marks them as estimated', () => {
    const attrs = estimateAttributes({ position: 'DEL', level: 'amateur' });
    for (const attr of Object.values(attrs)) {
      expect(attr?.source).toBe('estimado');
      expect(attr?.value).toBeGreaterThanOrEqual(25);
      expect(attr?.value).toBeLessThanOrEqual(82);
    }
    expect((attrs.sho?.value ?? 0)).toBeGreaterThan(attrs.def?.value ?? 99);
  });

  it('gives higher OVR to a higher level at the same position', () => {
    const low = computeOvr('MC', estimateAttributes({ position: 'MC', level: 'principiante' }));
    const high = computeOvr('MC', estimateAttributes({ position: 'MC', level: 'pro' }));
    expect(high).toBeGreaterThan(low);
  });

  it('uses goalkeeper attributes for POR', () => {
    const attrs = estimateAttributes({ position: 'POR', level: 'semipro' });
    expect(attrs.reflejos).toBeDefined();
    expect(headlineKeys('POR')).toContain('reflejos');
    const ovr = computeOvr('POR', attrs);
    expect(ovr).toBeGreaterThan(40);
  });

  it('applies self assessment', () => {
    const base = estimateAttributes({ position: 'EXT', level: 'amateur' });
    const strong = estimateAttributes({ position: 'EXT', level: 'amateur', selfAssessment: { pac: 10 } });
    expect(strong.pac?.value ?? 0).toBeGreaterThan(base.pac?.value ?? 99);
  });

  it('returns 1 when there are no attributes and clamps to 99', () => {
    expect(computeOvr('DFC', {})).toBe(1);
    expect(computeOvr('DEL', { sho: { value: 99, source: 'medido' } })).toBe(99);
  });

  it('maps OVR to rarity', () => {
    expect(rarityFromOvr(55)).toBe('bronce');
    expect(rarityFromOvr(65)).toBe('plata');
    expect(rarityFromOvr(75)).toBe('oro');
    expect(rarityFromOvr(85)).toBe('especial');
    expect(rarityFromOvr(92)).toBe('leyenda');
  });
});
