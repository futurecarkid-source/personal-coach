import { FORMATIONS, FORMAT_SIZE, layoutFormation, outfieldPlayers, parseFormation } from '../formations';

describe('formations', () => {
  it('lays out the right number of players for every catalog formation', () => {
    for (const [format, ids] of Object.entries(FORMATIONS)) {
      for (const id of ids) {
        const expected = FORMAT_SIZE[format as keyof typeof FORMAT_SIZE];
        expect(outfieldPlayers(id) + 1).toBe(expected);
        const points = layoutFormation(id);
        expect(points).toHaveLength(expected);
        for (const p of points) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('mirrors the rival', () => {
    const own = layoutFormation('4-3-3', 'propio');
    const rival = layoutFormation('4-3-3', 'rival');
    expect(rival[0]?.x).toBeCloseTo(1 - (own[0]?.x ?? 0), 5);
  });

  it('rejects invalid ids', () => {
    expect(parseFormation('abc')).toBeNull();
    expect(parseFormation('4')).toBeNull();
    expect(layoutFormation('x-y')).toEqual([]);
  });
});
