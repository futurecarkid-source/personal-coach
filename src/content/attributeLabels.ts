import type { AttributeKey, Equipment } from '../types';

/** Etiqueta corta (en la cara de la tarjeta) y nombre completo (en el detalle). */
export const ATTRIBUTE_LABELS: Record<AttributeKey, { short: string; full: string }> = {
  pac: { short: 'PAC', full: 'Ritmo' },
  sho: { short: 'SHO', full: 'Disparo' },
  pas: { short: 'PAS', full: 'Pase' },
  dri: { short: 'DRI', full: 'Regate' },
  def: { short: 'DEF', full: 'Defensa' },
  phy: { short: 'PHY', full: 'Físico' },
  vision: { short: 'VIS', full: 'Visión' },
  mentalidad: { short: 'MEN', full: 'Mentalidad' },
  resistencia: { short: 'RES', full: 'Resistencia' },
  agilidad: { short: 'AGI', full: 'Agilidad' },
  salto: { short: 'SAL', full: 'Salto' },
  juegoAereo: { short: 'AER', full: 'Juego aéreo' },
  posicionamiento: { short: 'POS', full: 'Posicionamiento' },
  disciplina: { short: 'DIS', full: 'Disciplina' },
  pieDebil: { short: 'PDB', full: 'Pie débil' },
  tecnica: { short: 'TEC', full: 'Técnica' },
  reflejos: { short: 'REF', full: 'Reflejos' },
  estirada: { short: 'EST', full: 'Estirada' },
  juegoDePies: { short: 'JDP', full: 'Juego de pies' },
  posicionamientoPortero: { short: 'POS', full: 'Posicionamiento' },
  salidas: { short: 'SLD', full: 'Salidas' },
  saque: { short: 'SAQ', full: 'Saque' },
};

export const POSITION_LABELS = {
  POR: 'Portero',
  DFC: 'Defensa central',
  LAT: 'Lateral',
  MCD: 'Mediocentro defensivo',
  MC: 'Mediocentro',
  MCO: 'Mediapunta',
  EXT: 'Extremo',
  DEL: 'Delantero',
} as const;

export const LEVEL_LABELS = {
  principiante: 'Principiante',
  amateur: 'Amateur',
  semipro: 'Semipro',
  pro: 'Pro',
  cantera: 'Cantera',
} as const;

export const BODY_ZONE_LABELS = {
  cabeza: 'Cabeza',
  cuello: 'Cuello',
  hombro: 'Hombro',
  lumbar: 'Lumbar',
  cadera: 'Cadera',
  ingle: 'Ingle',
  cuadriceps: 'Cuádriceps',
  isquiotibiales: 'Isquiotibiales',
  rodilla: 'Rodilla',
  gemelo: 'Gemelo',
  aquiles: 'Aquiles',
  tobillo: 'Tobillo',
  pie: 'Pie',
  canilla: 'Canilla',
} as const;

/** Bandera como emoji a partir del código de país de dos letras. */
export function flagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  const base = 0x1f1e6;
  return String.fromCodePoint(base + code.charCodeAt(0) - 65, base + code.charCodeAt(1) - 65);
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  ninguno: 'Sin equipo',
  bandas: 'Bandas elásticas',
  mancuernas: 'Mancuernas',
  gimnasio: 'Gimnasio',
  balon: 'Balón',
  conos: 'Conos',
  escalera: 'Escalera de agilidad',
};
