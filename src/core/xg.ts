import type { PitchPoint, ShotContext } from '../types';

export const PITCH_LENGTH_M = 105;
export const PITCH_WIDTH_M = 68;
export const GOAL_WIDTH_M = 7.32;

/** Distancia (m) y ángulo (rad) de visión de la portería desde un punto, atacando hacia x = 105. */
export function shotGeometry(pos: PitchPoint): { distance: number; angle: number } {
  const dx = PITCH_LENGTH_M - pos.x;
  const dy = PITCH_WIDTH_M / 2 - pos.y;
  const distance = Math.hypot(dx, dy);
  const half = GOAL_WIDTH_M / 2;
  const denominator = dx * dx + dy * dy - half * half;
  let angle = Math.atan2(GOAL_WIDTH_M * dx, denominator);
  if (angle < 0) angle += Math.PI;
  return { distance, angle };
}

const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

export const PENALTY_XG = 0.76;

/**
 * xG heurístico (v0): regresión logística sencilla con distancia, ángulo, parte del cuerpo,
 * situación y presión. Los coeficientes son provisionales (ajustados para dar valores típicos:
 * ~0,14 a 12 m centrado, ~0,31 a 6 m, ~0,03 a 25 m) y están pendientes de calibrar con datos abiertos.
 */
export function expectedGoals(pos: PitchPoint, ctx: ShotContext): number {
  if (ctx.situation === 'penalti') return PENALTY_XG;
  const { distance, angle } = shotGeometry(pos);
  let z = -1.2 - 0.1 * distance + 1.0 * angle;
  if (ctx.bodyPart === 'cabeza') z -= 0.9;
  if (ctx.bodyPart === 'otro') z -= 0.5;
  if (ctx.situation === 'contraataque') z += 0.25;
  if (ctx.situation === 'balonParado') z -= 0.2;
  if (ctx.situation === 'rebote') z += 0.5;
  if (ctx.pressure === 0) z += 0.15;
  if (ctx.pressure === 2) z -= 0.5;
  return sigmoid(z);
}
