import { arrowHeadPoints, distance, snapToGrid, zigzagPoints } from '../drawing';

describe('drawing helpers', () => {
  it('builds an arrow head behind the tip', () => {
    const [tip, a, b] = arrowHeadPoints({ x: 0, y: 0 }, { x: 10, y: 0 }, 2);
    expect(tip).toEqual({ x: 10, y: 0 });
    expect(a.x).toBeLessThan(10);
    expect(b.x).toBeLessThan(10);
    expect(a.y).toBeCloseTo(-b.y, 5);
  });

  it('zigzag starts and ends at the endpoints', () => {
    const pts = zigzagPoints({ x: 0, y: 0 }, { x: 20, y: 0 }, 1, 4);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 20, y: 0 });
    expect(pts.length).toBeGreaterThan(3);
    expect(zigzagPoints({ x: 1, y: 1 }, { x: 1, y: 1 }, 1, 4)).toHaveLength(2);
  });

  it('computes distances and snaps to the grid', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    const snapped = snapToGrid({ x: 0.49, y: 0.51 }, 7, 5);
    expect(snapped.x).toBeCloseTo(0.5, 5);
    expect(snapToGrid({ x: 1.4, y: -1 }, 7, 5).x).toBeLessThanOrEqual(1);
  });
});
