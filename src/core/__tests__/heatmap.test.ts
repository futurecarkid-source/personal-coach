import { buildHeatmap } from '../heatmap';

describe('heatmap', () => {
  it('returns zeros for no points', () => {
    const h = buildHeatmap([]);
    expect(h.max).toBe(0);
    expect(h.cells.flat().every((v) => v === 0)).toBe(true);
  });

  it('peaks near the points and is normalized', () => {
    const h = buildHeatmap([{ x: 52.5, y: 34 }, { x: 53, y: 34 }]);
    const flat = h.cells.flat();
    expect(Math.max(...flat)).toBeCloseTo(1, 5);
    const row = Math.floor(34 / (68 / h.rows));
    const col = Math.floor(52.5 / (105 / h.cols));
    expect(h.cells[row]?.[col]).toBeGreaterThan(0.9);
    expect(h.cells[0]?.[0] ?? 1).toBeLessThan(0.05);
  });
});
