import {
  GOALKEEPER_ATTRIBUTES,
  OUTFIELD_ATTRIBUTES,
  type AttributeKey,
  type Attributes,
  type Level,
  type OutfieldAttributeKey,
  type Position,
  type Rarity,
} from '../types';

type Weights = Partial<Record<AttributeKey, number>>;

/**
 * Pesos del OVR por posición (8 perfiles). Son una propuesta inicial, transparente y ajustable:
 * el OVR es la media ponderada de los atributos disponibles (los pesos se reescalan solos).
 */
export const POSITION_WEIGHTS: Record<Position, Weights> = {
  POR: {
    reflejos: 0.24,
    estirada: 0.2,
    posicionamientoPortero: 0.2,
    salidas: 0.12,
    juegoDePies: 0.1,
    saque: 0.08,
    mentalidad: 0.06,
  },
  DFC: { def: 0.26, phy: 0.14, juegoAereo: 0.13, posicionamiento: 0.13, pas: 0.07, mentalidad: 0.07, vision: 0.05, pac: 0.05, resistencia: 0.05, disciplina: 0.05 },
  LAT: { pac: 0.16, def: 0.16, resistencia: 0.14, pas: 0.1, dri: 0.08, agilidad: 0.08, posicionamiento: 0.08, phy: 0.06, vision: 0.05, tecnica: 0.05, mentalidad: 0.04 },
  MCD: { def: 0.18, pas: 0.15, posicionamiento: 0.12, vision: 0.1, phy: 0.1, resistencia: 0.1, mentalidad: 0.08, tecnica: 0.07, disciplina: 0.06, juegoAereo: 0.04 },
  MC: { pas: 0.18, vision: 0.14, resistencia: 0.12, dri: 0.1, tecnica: 0.1, def: 0.08, sho: 0.06, phy: 0.07, mentalidad: 0.08, posicionamiento: 0.07 },
  MCO: { pas: 0.17, vision: 0.17, dri: 0.14, tecnica: 0.12, sho: 0.1, agilidad: 0.08, pac: 0.07, posicionamiento: 0.07, mentalidad: 0.08 },
  EXT: { pac: 0.2, dri: 0.18, agilidad: 0.1, sho: 0.08, pas: 0.09, tecnica: 0.1, resistencia: 0.07, pieDebil: 0.05, vision: 0.07, mentalidad: 0.06 },
  DEL: { sho: 0.22, pac: 0.13, dri: 0.1, posicionamiento: 0.12, phy: 0.08, tecnica: 0.07, pas: 0.05, juegoAereo: 0.05, agilidad: 0.04, pieDebil: 0.04, mentalidad: 0.06, vision: 0.04 },
};

const HEADLINE_OUTFIELD: readonly OutfieldAttributeKey[] = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];

/** Las 6 cifras que se muestran en la cara de la tarjeta. */
export function headlineKeys(position: Position): readonly AttributeKey[] {
  return position === 'POR' ? GOALKEEPER_ATTRIBUTES : HEADLINE_OUTFIELD;
}

/** Media ponderada de los atributos presentes. Devuelve un entero entre 1 y 99. */
export function computeOvr(position: Position, attributes: Attributes): number {
  const weights = POSITION_WEIGHTS[position];
  let sum = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights) as [AttributeKey, number][]) {
    const attr = attributes[key];
    if (!attr) continue;
    sum += attr.value * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return 1;
  return Math.max(1, Math.min(99, Math.round(sum / weightSum)));
}

export function rarityFromOvr(ovr: number): Rarity {
  if (ovr >= 90) return 'leyenda';
  if (ovr >= 80) return 'especial';
  if (ovr >= 70) return 'oro';
  if (ovr >= 60) return 'plata';
  return 'bronce';
}

const BASE_BY_LEVEL: Record<Level, number> = {
  principiante: 42,
  cantera: 50,
  amateur: 55,
  semipro: 65,
  pro: 75,
};

/** Sesgo por posición (puntos sobre la base). */
const POSITION_BIAS: Record<Position, Partial<Record<AttributeKey, number>>> = {
  POR: {},
  DFC: { def: 8, phy: 6, juegoAereo: 7, posicionamiento: 5, sho: -8, dri: -6, pac: -3 },
  LAT: { pac: 5, resistencia: 6, def: 3, sho: -5 },
  MCD: { def: 6, pas: 3, posicionamiento: 4, sho: -4, pac: -2 },
  MC: { pas: 5, vision: 4, resistencia: 4 },
  MCO: { pas: 6, vision: 7, dri: 5, tecnica: 5, def: -8, phy: -3 },
  EXT: { pac: 8, dri: 7, agilidad: 6, def: -9, juegoAereo: -4 },
  DEL: { sho: 9, pac: 3, posicionamiento: 6, def: -12, vision: -2 },
};

export type SelfAssessment = Partial<Record<OutfieldAttributeKey, number>>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Estimación inicial por fórmula local a partir del cuestionario (sin IA).
 * Todas las cifras salen con la etiqueta "estimado" y con techo de 82 para no regalar tarjetas.
 * `selfAssessment` es la autoevaluación de 1 a 10 de los atributos principales.
 */
export function estimateAttributes(input: {
  position: Position;
  level: Level;
  selfAssessment?: SelfAssessment;
}): Attributes {
  const { position, level, selfAssessment = {} } = input;
  const base = BASE_BY_LEVEL[level];
  const bias = POSITION_BIAS[position];
  const keys: readonly AttributeKey[] = position === 'POR' ? [...GOALKEEPER_ATTRIBUTES, 'mentalidad', 'resistencia'] : OUTFIELD_ATTRIBUTES;
  const result: Attributes = {};
  for (const key of keys) {
    const own = key in selfAssessment ? (selfAssessment as Partial<Record<AttributeKey, number>>)[key] : undefined;
    const selfShift = own === undefined ? 0 : (clamp(own, 1, 10) - 5) * 2.4;
    const value = clamp(Math.round(base + (bias[key] ?? 0) + selfShift), 25, 82);
    result[key] = { value, source: 'estimado' };
  }
  return result;
}
