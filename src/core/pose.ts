/**
 * Maniquí de ejercicios: figura de palos vista de perfil (mirando a la derecha) animada con claves.
 * Todo es matemática pura (cinemática directa con ángulos), sin dependencias de pantalla, para poder
 * probarla: las claves se convierten en muestras y la pantalla solo interpola entre muestras.
 *
 * Ángulos en grados, absolutos y medidos desde la vertical hacia abajo, positivos hacia delante (+x):
 * brazo/pierna colgando = 0, apuntando al frente = 90, hacia arriba = 180. El tronco se mide desde la vertical hacia
 * arriba (0 = erguido, positivo = inclinado al frente, -90 = tumbado boca arriba con la cabeza a la izquierda).
 */

export const VIEW_W = 100;
export const FLOOR = 90;
export const ANCHOR_X = 50;
export const FOOT_ANCHOR_X = 46;
const STROKE_HALF = 3;

export const LEN = { torso: 26, headGap: 8, ua: 13, fa: 12, th: 21, sh: 21, ft: 8 } as const;
export const HEAD_R = 5.5;

export interface Pose {
  /** Desplazamiento horizontal de la cadera respecto al ancla. */
  hx: number;
  torso: number;
  /** Dirección de la cabeza (por defecto, la del tronco) y su desplazamiento vertical. */
  hd: number;
  hy: number;
  /** Brazo y pierna cercanos (1) y lejanos (2). */
  ua: number;
  fa: number;
  ua2: number;
  fa2: number;
  th: number;
  sh: number;
  ft: number;
  th2: number;
  sh2: number;
  ft2: number;
  /** Elevación del suelo bajo la figura (saltos, escalones, cajones). */
  fl: number;
  /** Posición absoluta de un objeto móvil (balón, rodillo). */
  bx: number;
  by: number;
}

export type PoseInput = Partial<Pose>;

export const POINTS = ['head', 'neck', 'hip', 'el1', 'wr1', 'el2', 'wr2', 'kn1', 'an1', 'to1', 'kn2', 'an2', 'to2'] as const;
export type PointName = (typeof POINTS)[number];

export type Ease = 'smooth' | 'linear' | 'spline';
export type Anchor = 'hip' | 'foot1' | 'foot2';

export interface PropRect {
  kind: 'rect';
  x: number;
  w: number;
  h: number;
}

export interface AnimationDef {
  /** `pingpong`: va de la primera a la última clave y vuelve. `loop`: la última clave equivale a la primera. */
  mode: 'pingpong' | 'loop';
  ease: Ease;
  /** Duración de un ciclo completo (ida y vuelta, o una vuelta). */
  ms: number;
  anchor: Anchor;
  base?: PoseInput;
  keys: readonly PoseInput[];
  props?: readonly PropRect[];
  /** Objeto móvil circular (balón o rodillo) con su radio; sigue `bx`/`by` de las claves. */
  ball?: { r: number; kind: 'balon' | 'rodillo' };
  /** Goma elástica entre dos puntos del cuerpo. */
  band?: { from: PointName; to: PointName };
}

const DEFAULT_POSE: Pose = {
  hx: 0, torso: 0, hd: Number.NaN, hy: 0,
  ua: 0, fa: 0, ua2: Number.NaN, fa2: Number.NaN,
  th: 0, sh: 0, ft: 0, th2: Number.NaN, sh2: Number.NaN, ft2: Number.NaN,
  fl: 0, bx: 0, by: 0,
};

const NUMERIC_KEYS = Object.keys(DEFAULT_POSE) as (keyof Pose)[];

/** Completa una clave: mezcla con la base y copia el lado cercano al lejano donde no se indicó. */
export function resolvePose(base: PoseInput | undefined, input: PoseInput): Pose {
  const p: Pose = { ...DEFAULT_POSE, ...base, ...input };
  if (Number.isNaN(p.hd)) p.hd = p.torso;
  if (Number.isNaN(p.ua2)) p.ua2 = p.ua;
  if (Number.isNaN(p.fa2)) p.fa2 = p.fa;
  if (Number.isNaN(p.th2)) p.th2 = p.th;
  if (Number.isNaN(p.sh2)) p.sh2 = p.sh;
  if (Number.isNaN(p.ft2)) p.ft2 = p.ft;
  return p;
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
export type Vec = readonly [number, number];

/** Posición de cada articulación con la cadera en (0, 0) (y hacia abajo). */
export function skeleton(p: Pose): Record<PointName, Vec> {
  const tr = rad(p.torso);
  const neck: Vec = [LEN.torso * Math.sin(tr), -LEN.torso * Math.cos(tr)];
  const hr = rad(p.hd);
  const head: Vec = [neck[0] + LEN.headGap * Math.sin(hr), neck[1] - LEN.headGap * Math.cos(hr) + p.hy];
  const limb = (from: Vec, len: number, deg: number): Vec => [from[0] + len * Math.sin(rad(deg)), from[1] + len * Math.cos(rad(deg))];
  const foot = (from: Vec, deg: number): Vec => [from[0] + LEN.ft * Math.cos(rad(deg)), from[1] + LEN.ft * Math.sin(rad(deg))];
  const el1 = limb(neck, LEN.ua, p.ua);
  const el2 = limb(neck, LEN.ua, p.ua2);
  const kn1 = limb([0, 0], LEN.th, p.th);
  const kn2 = limb([0, 0], LEN.th, p.th2);
  const an1 = limb(kn1, LEN.sh, p.sh);
  const an2 = limb(kn2, LEN.sh, p.sh2);
  return {
    head, neck, hip: [0, 0],
    el1, wr1: limb(el1, LEN.fa, p.fa), el2, wr2: limb(el2, LEN.fa, p.fa2),
    kn1, an1, to1: foot(an1, p.ft), kn2, an2, to2: foot(an2, p.ft2),
  };
}

function sampleParam(vals: readonly number[], u: number, loop: boolean, ease: Ease): number {
  const n = vals.length;
  if (n === 1) return vals[0] ?? 0;
  const x = Math.min(Math.max(u, 0), 1) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const s = x - i;
  const v1 = vals[i] ?? 0;
  const v2 = vals[i + 1] ?? 0;
  if (ease === 'linear') return v1 + (v2 - v1) * s;
  if (ease === 'smooth') return v1 + (v2 - v1) * (s * s * (3 - 2 * s));
  // Catmull-Rom; en bucle la última clave equivale a la primera, así que los vecinos dan la vuelta.
  const m = n - 1;
  const at = (k: number): number => (loop ? (vals[((k % m) + m) % m] ?? 0) : (vals[Math.min(n - 1, Math.max(0, k))] ?? 0));
  const p0 = at(i - 1);
  const p3 = at(i + 2);
  const s2 = s * s;
  const s3 = s2 * s;
  return 0.5 * (2 * v1 + (-p0 + v2) * s + (2 * p0 - 5 * v1 + 4 * v2 - p3) * s2 + (-p0 + 3 * v1 - 3 * v2 + p3) * s3);
}

export interface PlacedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Tracks {
  samples: number;
  /** Encuadre calculado: la figura se centra y se reduce si no cabe. */
  view: { minY: number; height: number };
  props: PlacedRect[];
  /** Para cada punto, la coordenada en cada muestra. */
  x: Record<PointName, number[]>;
  y: Record<PointName, number[]>;
  ball: { x: number[]; y: number[]; r: number; kind: 'balon' | 'rodillo' } | null;
  def: AnimationDef;
}

export const SAMPLES = 48;

/** Convierte una animación de claves en muestras (con el cuerpo ya apoyado en el suelo y anclado). */
export function buildTracks(def: AnimationDef, samples: number = SAMPLES): Tracks {
  const keys = def.keys.map((k) => resolvePose(def.base, k));
  const column = (name: keyof Pose): number[] => keys.map((k) => k[name]);
  const columns = Object.fromEntries(NUMERIC_KEYS.map((k) => [k, column(k)])) as Record<keyof Pose, number[]>;
  const x = Object.fromEntries(POINTS.map((p) => [p, [] as number[]])) as Record<PointName, number[]>;
  const y = Object.fromEntries(POINTS.map((p) => [p, [] as number[]])) as Record<PointName, number[]>;
  const ballX: number[] = [];
  const ballY: number[] = [];
  const loop = def.mode === 'loop';

  for (let s = 0; s < samples; s += 1) {
    const u = s / (samples - 1);
    const pose = Object.fromEntries(NUMERIC_KEYS.map((k) => [k, sampleParam(columns[k], u, loop, def.ease)])) as unknown as Pose;
    const sk = skeleton(pose);
    let maxY = sk.head.at(1)! + HEAD_R;
    for (const name of POINTS) if (name !== 'head') maxY = Math.max(maxY, (sk[name][1]) + STROKE_HALF);
    const dy = FLOOR - Math.max(0, pose.fl) - maxY;
    let dx = ANCHOR_X + pose.hx;
    if (def.anchor === 'foot1') dx = FOOT_ANCHOR_X + pose.hx - sk.an1[0];
    if (def.anchor === 'foot2') dx = FOOT_ANCHOR_X + pose.hx - sk.an2[0];
    for (const name of POINTS) {
      x[name].push(sk[name][0] + dx);
      y[name].push(sk[name][1] + dy);
    }
    ballX.push(pose.bx);
    ballY.push(FLOOR - pose.by - (def.ball?.r ?? 0));
  }
  return place(def, samples, x, y, ballX, ballY);
}

const FRAME_W = 92;

/** Centra la figura (y sus objetos) en el encuadre, la reduce si es más ancha que el cuadro y calcula el borde superior. */
function place(def: AnimationDef, samples: number, x: Record<PointName, number[]>, y: Record<PointName, number[]>, ballX: number[], ballY: number[]): Tracks {
  const rects = (def.props ?? []).map((p) => ({ x: p.x, y: FLOOR - p.h, w: p.w, h: p.h }));
  let minX = Infinity;
  let maxX = -Infinity;
  const take = (px: number, r = 0): void => {
    minX = Math.min(minX, px - r);
    maxX = Math.max(maxX, px + r);
  };
  for (const name of POINTS) for (const v of x[name]) take(v, name === 'head' ? HEAD_R : STROKE_HALF);
  if (def.ball) for (const v of ballX) take(v, def.ball.r);
  for (const r of rects) {
    take(r.x);
    take(r.x + r.w);
  }
  const k = Math.min(1, FRAME_W / Math.max(1, maxX - minX));
  const scaledMin = ANCHOR_X + (minX - ANCHOR_X) * k;
  const scaledMax = ANCHOR_X + (maxX - ANCHOR_X) * k;
  const dx = ANCHOR_X - (scaledMin + scaledMax) / 2;
  const tx = (v: number): number => ANCHOR_X + (v - ANCHOR_X) * k + dx;
  const ty = (v: number): number => FLOOR - (FLOOR - v) * k;
  let top = Infinity;
  for (const name of POINTS) {
    x[name] = x[name].map(tx);
    y[name] = y[name].map(ty);
    for (const v of y[name]) top = Math.min(top, v - (name === 'head' ? HEAD_R : STROKE_HALF));
  }
  const ball = def.ball ? { x: ballX.map(tx), y: ballY.map((v) => ty(v)), r: def.ball.r * k, kind: def.ball.kind } : null;
  if (ball) for (const v of ball.y) top = Math.min(top, v - ball.r);
  const props = rects.map((r) => ({ x: tx(r.x), y: ty(r.y), w: r.w * k, h: r.h * k }));
  for (const r of props) top = Math.min(top, r.y);
  const minY = Math.min(0, Math.floor(top - 3));
  return { samples, view: { minY, height: 100 - minY }, props, x, y, ball, def };
}

/** Pasos de una carrera: fases de la pierna cercana; la lejana va desfasada medio ciclo. */
export interface CycleOptions {
  scale?: number;
  lean?: number;
  bounce?: number;
}

const LEG_PHASES: readonly { th: number; sh: number; ft: number }[] = [
  { th: 30, sh: 8, ft: 15 },
  { th: 0, sh: 0, ft: 0 },
  { th: -28, sh: -28, ft: 50 },
  { th: -15, sh: -100, ft: 30 },
  { th: 48, sh: -35, ft: 20 },
  { th: 40, sh: -2, ft: 15 },
];
const ARM_PHASES: readonly { ua: number; fa: number }[] = [
  { ua: -40, fa: 40 },
  { ua: -5, fa: 70 },
  { ua: 35, fa: 120 },
  { ua: 45, fa: 135 },
  { ua: 15, fa: 100 },
  { ua: -30, fa: 50 },
];
const BOUNCE = [0, 0, 2, 4, 3, 0];

/** Claves de un ciclo de carrera (la última repite la primera). */
export function runCycleKeys({ scale = 1, lean = 8, bounce = 1 }: CycleOptions = {}): PoseInput[] {
  const n = LEG_PHASES.length;
  const out: PoseInput[] = [];
  for (let i = 0; i <= n; i += 1) {
    const a = i % n;
    const b = (a + n / 2) % n;
    const la = LEG_PHASES[a]!;
    const lb = LEG_PHASES[b]!;
    const aa = ARM_PHASES[a]!;
    const ab = ARM_PHASES[b]!;
    out.push({
      torso: lean,
      th: la.th * scale, sh: la.sh * scale, ft: la.ft,
      th2: lb.th * scale, sh2: lb.sh * scale, ft2: lb.ft,
      ua: aa.ua * scale, fa: aa.fa, ua2: ab.ua * scale, fa2: ab.fa,
      fl: (BOUNCE[a] ?? 0) * bounce,
    });
  }
  return out;
}
