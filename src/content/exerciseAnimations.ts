import { runCycleKeys, type AnimationDef } from '../core/pose';
import type { Exercise } from '../types';

const STAND_ARMS = { ua: 25, fa: 70 } as const;
const CROUCH = { torso: 36, th: 80, sh: -22, ua: 75, fa: 95 } as const;
const SUPINE = { torso: -90, hd: -90, hy: -4.5, hx: -2 } as const;

/** Una animación por movimiento (no por ejercicio): varios ejercicios comparten la misma. Todas son originales. */
export const ANIMATIONS = {
  sentadilla: {
    mode: 'pingpong', ease: 'smooth', ms: 3000, anchor: 'foot1',
    keys: [{ torso: 2, ...STAND_ARMS }, { ...CROUCH }, { ...CROUCH }],
  },
  puente: {
    mode: 'pingpong', ease: 'smooth', ms: 3200, anchor: 'hip', base: { ...SUPINE, hx: 3, ua: 90, fa: 90 },
    keys: [{ th: 135, sh: 45 }, { torso: -112, th: 112, sh: 33 }, { torso: -112, th: 112, sh: 33 }],
  },
  zancada: {
    mode: 'pingpong', ease: 'smooth', ms: 3200, anchor: 'foot1', base: { ua: 10, fa: 80, hx: 10 },
    keys: [
      { torso: 2, th: 25, sh: 0, th2: -25, sh2: -8, ft2: 40 },
      { torso: 6, th: 80, sh: 0, th2: -22, sh2: -93, ft2: 55 },
      { torso: 6, th: 80, sh: 0, th2: -22, sh2: -93, ft2: 55 },
    ],
  },
  plancha: {
    mode: 'pingpong', ease: 'smooth', ms: 2400, anchor: 'hip', base: { hx: 2, ua: 0, fa: 90, ft: 60 },
    keys: [{ torso: 85, th: -85, sh: -85 }, { torso: 83, th: -83, sh: -87 }],
  },
  nordic: {
    mode: 'pingpong', ease: 'smooth', ms: 3600, anchor: 'hip', base: { hx: -8, th: 0, sh: -90, ft: 180 },
    keys: [{ torso: 0, ua: 70, fa: 90 }, { torso: 62, ua: 90, fa: 90 }, { torso: 62, ua: 90, fa: 90 }],
  },
  equilibrio: {
    mode: 'pingpong', ease: 'smooth', ms: 3200, anchor: 'foot1', base: { th: 3, sh: 0, th2: -32, sh2: -85, ft2: 40 },
    keys: [{ torso: 2, ua: 55, fa: 55, ua2: -45, fa2: -45 }, { torso: 6, ua: 70, fa: 70, ua2: -60, fa2: -60 }],
  },
  salto: {
    mode: 'loop', ease: 'spline', ms: 2000, anchor: 'hip',
    keys: [
      { torso: 2, ...STAND_ARMS },
      { ...CROUCH, hx: -4 },
      { torso: 0, ua: 150, fa: 150, th: 2, sh: 0, ft: 70, fl: 5 },
      { torso: 0, ua: 155, fa: 155, th: 8, sh: -8, ft: 60, fl: 14 },
      { torso: 30, th: 70, sh: -22, ua: 70, fa: 90, fl: 0, hx: -2 },
      { torso: 2, ...STAND_ARMS },
    ],
  },
  skipping: {
    mode: 'loop', ease: 'spline', ms: 800, anchor: 'hip', base: { torso: 4 },
    keys: [
      { th: 92, sh: 0, th2: -4, sh2: 0, ua: -50, fa: 50, ua2: 55, fa2: 120, fl: 0 },
      { th: 30, sh: -5, th2: 12, sh2: -5, ua: 0, fa: 70, ua2: 0, fa2: 70, fl: 4 },
      { th2: 92, sh2: 0, th: -4, sh: 0, ua2: -50, fa2: 50, ua: 55, fa: 120, fl: 0 },
      { th: 12, sh: -5, th2: 30, sh2: -5, ua: 0, fa: 70, ua2: 0, fa2: 70, fl: 4 },
      { th: 92, sh: 0, th2: -4, sh2: 0, ua: -50, fa: 50, ua2: 55, fa2: 120, fl: 0 },
    ],
  },
  carrera: { mode: 'loop', ease: 'spline', ms: 760, anchor: 'hip', keys: runCycleKeys({ lean: 8 }) },
  sprint: { mode: 'loop', ease: 'spline', ms: 520, anchor: 'hip', keys: runCycleKeys({ lean: 24, scale: 1.2, bounce: 1.4 }) },
  piesRapidos: { mode: 'loop', ease: 'spline', ms: 420, anchor: 'hip', keys: runCycleKeys({ lean: 16, scale: 0.55, bounce: 0.6 }) },
  trote: { mode: 'loop', ease: 'spline', ms: 1100, anchor: 'hip', keys: runCycleKeys({ lean: 6, scale: 0.7, bounce: 0.6 }) },
  sentado: {
    mode: 'pingpong', ease: 'smooth', ms: 3600, anchor: 'hip', base: { hx: -12, th: 90, sh: 90, ft: -80 },
    keys: [{ torso: 0, ua: 20, fa: 30 }, { torso: 55, ua: 72, fa: 72 }, { torso: 55, ua: 72, fa: 72 }],
  },
  tobilloPared: {
    mode: 'pingpong', ease: 'smooth', ms: 2600, anchor: 'foot1', base: { ua: 82, fa: 90, th2: -25, sh2: -10, ft2: 40 },
    props: [{ kind: 'rect', x: 78, w: 6, h: 70 }],
    keys: [{ torso: 2, th: 8, sh: -4 }, { torso: 6, th: 36, sh: -38 }, { torso: 6, th: 36, sh: -38 }],
  },
  pase: {
    mode: 'loop', ease: 'spline', ms: 2200, anchor: 'foot2', ball: { r: 4, kind: 'balon' }, base: { th2: 0, sh2: 0, ua: 30, fa: 60, ua2: -30, fa2: 40, torso: 5 },
    props: [{ kind: 'rect', x: 90, w: 5, h: 40 }],
    keys: [
      { th: -25, sh: -60, ft: 20, bx: 58, by: 0 },
      { th: 25, sh: 5, ft: 0, bx: 59, by: 0 },
      { th: 50, sh: 20, ft: 0, bx: 74, by: 0 },
      { th: 8, sh: 0, ft: 0, bx: 85, by: 0 },
      { th: 22, sh: 0, ft: 0, bx: 60, by: 0 },
      { th: -25, sh: -60, ft: 20, bx: 58, by: 0 },
    ],
  },
  conduccion: {
    mode: 'loop', ease: 'spline', ms: 1300, anchor: 'hip', ball: { r: 4, kind: 'balon' },
    keys: runCycleKeys({ lean: 10, scale: 0.8, bounce: 0.6 }).map((k, i) => ({ ...k, bx: [64, 66, 69, 73, 71, 66, 64][i] ?? 66, by: 0 })),
  },
  flexion: {
    mode: 'pingpong', ease: 'smooth', ms: 2800, anchor: 'hip', base: { hx: 6, sh: -90, ft: 180, ua: 0, fa: 0 },
    keys: [{ torso: 58, th: -58 }, { torso: 83, th: -83, ua: -70, fa: 80, hd: 60 }, { torso: 83, th: -83, ua: -70, fa: 80, hd: 60 }],
  },
  remo: {
    mode: 'pingpong', ease: 'smooth', ms: 2400, anchor: 'hip', base: { hx: -14, th: 90, sh: 90, ft: -80 }, band: { from: 'to1', to: 'wr1' },
    keys: [{ torso: 4, ua: 84, fa: 88 }, { torso: -6, ua: -35, fa: 25 }, { torso: -6, ua: -35, fa: 25 }],
  },
  respiracion: {
    mode: 'pingpong', ease: 'smooth', ms: 9000, anchor: 'hip', base: { th: 2 },
    keys: [{ torso: 0, ua: 8, fa: 20 }, { torso: -2, ua: 55, fa: 70 }],
  },
  rdlUnipodal: {
    mode: 'pingpong', ease: 'smooth', ms: 3400, anchor: 'foot1', base: { th: 8, sh: -6, ua: 0, fa: 0, ft2: 90 },
    keys: [{ torso: 2, th2: -4, sh2: -6 }, { torso: 82, th2: -82, sh2: -82 }, { torso: 82, th2: -82, sh2: -82 }],
  },
  bulgara: {
    mode: 'pingpong', ease: 'smooth', ms: 3400, anchor: 'foot1', base: { ua: 20, fa: 80, ft2: 150 }, props: [{ kind: 'rect', x: 4, w: 20, h: 24 }],
    keys: [
      { torso: 4, th: 5, sh: 0, th2: -16, sh2: -101 },
      { torso: 22, th: 72, sh: -20, th2: -22, sh2: -158 },
      { torso: 22, th: 72, sh: -20, th2: -22, sh2: -158 },
    ],
  },
  gemelos: {
    mode: 'pingpong', ease: 'smooth', ms: 2400, anchor: 'hip', base: { th: 0, sh: 0, ua: 5, fa: 20 },
    keys: [{ torso: 0, ft: 0 }, { torso: 0, ft: 72 }],
  },
  deadBug: {
    mode: 'loop', ease: 'smooth', ms: 4400, anchor: 'hip', base: { ...SUPINE, hx: 4, ua: 180, fa: 180, th: 180, sh: 90 },
    keys: [{}, { ua: -90, fa: -90, th2: 95, sh2: 95 }, {}, { ua2: -90, fa2: -90, th: 95, sh: 95 }, {}],
  },
  pallof: {
    mode: 'pingpong', ease: 'smooth', ms: 3000, anchor: 'hip', base: { th: 6, sh: -6 },
    keys: [{ ua: 14, fa: 110 }, { ua: 82, fa: 90 }, { ua: 82, fa: 90 }],
  },
  saltoCajon: {
    mode: 'loop', ease: 'spline', ms: 2800, anchor: 'hip', props: [{ kind: 'rect', x: 62, w: 32, h: 16 }],
    keys: [
      { hx: -6, torso: 2, ...STAND_ARMS },
      { hx: -8, ...CROUCH },
      { hx: 8, torso: 8, ua: 150, fa: 150, th: 85, sh: -85, ft: 40, fl: 26 },
      { hx: 24, ...CROUCH, torso: 30, fl: 16 },
      { hx: 24, torso: 2, ...STAND_ARMS, fl: 16 },
      { hx: -6, torso: 2, ...STAND_ARMS },
    ],
  },
  hombros: {
    mode: 'loop', ease: 'linear', ms: 2600, anchor: 'hip',
    keys: [0, 45, 90, 135, 180, 225, 270, 315, 360].map((a) => ({ ua: a, fa: a, ua2: a + 180, fa2: a + 180 })),
  },
  rodillo: {
    mode: 'pingpong', ease: 'smooth', ms: 3200, anchor: 'hip', ball: { r: 6, kind: 'rodillo' }, base: { torso: -60, hd: -50, th: 90, sh: 90, ft: -80, ua: 0, fa: 0, bx: 52, by: 0 },
    keys: [{ hx: -11 }, { hx: 3 }],
  },
} satisfies Record<string, AnimationDef>;

export type AnimationId = keyof typeof ANIMATIONS;

const BY_EXERCISE: Record<string, AnimationId> = {
  'sentadilla-peso-corporal': 'sentadilla',
  'puente-gluteo': 'puente',
  'zancada-alterna': 'zancada',
  'plancha-frontal': 'plancha',
  'plancha-lateral': 'plancha',
  'nordic-asistido': 'nordic',
  'copenhagen-rodilla': 'plancha',
  'equilibrio-unipodal': 'equilibrio',
  'salto-aterrizaje': 'salto',
  'skipping-alto': 'skipping',
  'carrera-progresiva': 'carrera',
  'movilidad-cadera-90-90': 'sentado',
  'movilidad-tobillo-pared': 'tobilloPared',
  'toques-pared': 'pase',
  'escalera-agilidad': 'piesRapidos',
  'flexiones-rodillas': 'flexion',
  'remo-banda': 'remo',
  'respiracion-calma': 'respiracion',
  'peso-muerto-rumano-unipodal': 'rdlUnipodal',
  'sentadilla-bulgara': 'bulgara',
  'elevacion-gemelos': 'gemelos',
  'dead-bug': 'deadBug',
  'pallof-banda': 'pallof',
  'salto-cajon': 'saltoCajon',
  'sprint-30m': 'sprint',
  'cambio-direccion-t': 'piesRapidos',
  'conduccion-conos': 'conduccion',
  'pase-pared-dos-toques': 'pase',
  'movilidad-cuello-hombros': 'hombros',
  'foam-roller-piernas': 'rodillo',
};

const BY_PATTERN: Record<Exercise['pattern'], AnimationId> = {
  sentadilla: 'sentadilla', bisagra: 'rdlUnipodal', zancada: 'zancada', plancha: 'plancha', salto: 'salto',
  carrera: 'carrera', empuje: 'pallof', tiron: 'remo', movilidad: 'respiracion', equilibrio: 'equilibrio',
};

export function animationFor(exercise: Pick<Exercise, 'id' | 'pattern'>): AnimationId {
  return BY_EXERCISE[exercise.id] ?? BY_PATTERN[exercise.pattern];
}
