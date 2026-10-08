import type { PitchPoint } from '../types';
import { PITCH_LENGTH_M, PITCH_WIDTH_M } from './xg';

export interface Heatmap {
  cols: number;
  rows: number;
  /** Valores normalizados de 0 a 1; `cells[row][col]`. */
  cells: number[][];
  max: number;
}

/** Densidad por kernel gaussiano sobre una grilla gruesa (la GPU la suaviza al dibujarla). */
export function buildHeatmap(
  points: readonly PitchPoint[],
  options: { cols?: number; rows?: number; bandwidthM?: number } = {},
): Heatmap {
  const { cols = 21, rows = 14, bandwidthM = 7 } = options;
  const cells: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  const cellW = PITCH_LENGTH_M / cols;
  const cellH = PITCH_WIDTH_M / rows;
  const twoSigmaSq = 2 * bandwidthM * bandwidthM;
  let max = 0;
  for (let r = 0; r < rows; r += 1) {
    const row = cells[r];
    if (!row) continue;
    const cy = (r + 0.5) * cellH;
    for (let c = 0; c < cols; c += 1) {
      const cx = (c + 0.5) * cellW;
      let density = 0;
      for (const p of points) {
        const d2 = (p.x - cx) ** 2 + (p.y - cy) ** 2;
        density += Math.exp(-d2 / twoSigmaSq);
      }
      row[c] = density;
      if (density > max) max = density;
    }
  }
  if (max > 0) {
    for (const row of cells) {
      for (let c = 0; c < row.length; c += 1) row[c] = (row[c] ?? 0) / max;
    }
  }
  return { cols, rows, cells, max };
}
