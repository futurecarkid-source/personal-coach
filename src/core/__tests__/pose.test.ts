import { writeFileSync } from 'fs';
import { ANIMATIONS, animationFor, type AnimationId } from '../../content/exerciseAnimations';
import { EXERCISES } from '../../content/exercises';
import { FLOOR, POINTS, VIEW_W, buildTracks, resolvePose, skeleton, type Tracks } from '../pose';

const ids = Object.keys(ANIMATIONS) as AnimationId[];

describe('exercise animations', () => {
  it('maps every exercise to an existing animation', () => {
    for (const e of EXERCISES) expect(ANIMATIONS[animationFor(e)]).toBeDefined();
  });

  it('keeps segment lengths constant', () => {
    const sk = skeleton(resolvePose(undefined, { torso: 30, th: 70, sh: -20, ua: 40, fa: 90 }));
    expect(Math.hypot(sk.neck[0], sk.neck[1])).toBeCloseTo(26, 5);
    expect(Math.hypot(sk.kn1[0], sk.kn1[1])).toBeCloseTo(21, 5);
  });

  it.each(ids)('%s stays inside the frame and finite', (id) => {
    const def = ANIMATIONS[id];
    const t = buildTracks(def);
    const minY = t.view.minY;
    const maxY = t.view.minY + t.view.height;
    for (const p of POINTS) {
      for (let i = 0; i < t.samples; i += 1) {
        const x = t.x[p][i]!;
        const y = t.y[p][i]!;
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThan(2);
        expect(x).toBeLessThan(VIEW_W - 2);
        expect(y).toBeGreaterThan(minY);
        expect(y).toBeLessThan(maxY);
      }
    }
  });

  it.each(ids)('%s never sinks below the floor and loops cleanly', (id) => {
    const def = ANIMATIONS[id];
    const t = buildTracks(def);
    for (let i = 0; i < t.samples; i += 1) {
      for (const p of POINTS) if (p !== 'head') expect(t.y[p][i]!).toBeLessThanOrEqual(FLOOR + 0.01);
    }
    if (def.mode === 'loop') {
      for (const p of POINTS) {
        expect(t.x[p][0]).toBeCloseTo(t.x[p][t.samples - 1]!, 4);
        expect(t.y[p][0]).toBeCloseTo(t.y[p][t.samples - 1]!, 4);
      }
    }
  });
});

/** Con POSE_DUMP=carpeta genera una hoja de contacto por animación para revisarla a ojo. */
function frameSvg(t: Tracks, i: number, ox: number): string {
  const line = (a: string, b: string, color: string, w: number): string =>
    `<line x1="${t.x[a as 'hip'][i]! + ox}" y1="${t.y[a as 'hip'][i]}" x2="${t.x[b as 'hip'][i]! + ox}" y2="${t.y[b as 'hip'][i]}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const far = '#9a9aa2';
  const near = '#1c1c1e';
  const props = t.props.map((p) => `<rect x="${p.x + ox}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#ddd"/>`).join('');
  const ball = t.ball ? `<circle cx="${t.ball.x[i]! + ox}" cy="${t.ball.y[i]}" r="${t.ball.r}" fill="${t.ball.kind === 'rodillo' ? '#8e8e93' : '#ff7a00'}"/>` : '';
  const band = t.def.band ? line(t.def.band.from, t.def.band.to, '#ff7a00', 0.8) : '';
  return `${props}<line x1="${4 + ox}" y1="${FLOOR + 1.5}" x2="${96 + ox}" y2="${FLOOR + 1.5}" stroke="#bbb" stroke-width="1"/>
${line('neck', 'el2', far, 3)}${line('el2', 'wr2', far, 3)}${line('hip', 'kn2', far, 3.4)}${line('kn2', 'an2', far, 3.4)}${line('an2', 'to2', far, 3.4)}
${line('hip', 'neck', near, 3.6)}<circle cx="${t.x.head[i]! + ox}" cy="${t.y.head[i]}" r="5.5" fill="#ff7a00"/>
${line('hip', 'kn1', near, 3.6)}${line('kn1', 'an1', near, 3.6)}${line('an1', 'to1', near, 3.6)}${line('neck', 'el1', near, 3)}${line('el1', 'wr1', near, 3)}${ball}${band}`;
}

const dump = process.env.POSE_DUMP;
(dump ? it : it.skip)('dumps contact sheets', () => {
  const rows = ids.map((id) => {
    const t = buildTracks(ANIMATIONS[id]);
    const frames = [0, 8, 16, 24, 32, 40, 47].map((i, k) => frameSvg(t, i, k * 100)).join('');
    const { minY, height } = t.view;
    return `<div><b>${id}</b><br/><svg width="1050" height="${(height * 1050) / 700}" viewBox="0 ${minY} 700 ${height}" style="background:#f5f5f7">${frames}</svg></div>`;
  });
  writeFileSync(`${dump}/poses.html`, `<html><body style="font-family:sans-serif">${rows.join('')}</body></html>`);
});
