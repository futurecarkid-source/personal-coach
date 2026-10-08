import type { NormPoint } from '../types';

export interface Pt {
  x: number;
  y: number;
}

/** Puntos de la punta de flecha al final de un segmento (en las mismas unidades que los puntos). */
export function arrowHeadPoints(from: Pt, to: Pt, size: number): [Pt, Pt, Pt] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const spread = Math.PI / 7;
  return [
    to,
    { x: to.x - size * Math.cos(angle - spread), y: to.y - size * Math.sin(angle - spread) },
    { x: to.x - size * Math.cos(angle + spread), y: to.y - size * Math.sin(angle + spread) },
  ];
}

/** Línea ondulada (zigzag suave) para representar una conducción de balón. */
export function zigzagPoints(from: Pt, to: Pt, amplitude: number, wavelength: number): Pt[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-6) return [from, to];
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const steps = Math.max(2, Math.round(length / (wavelength / 2)));
  const points: Pt[] = [from];
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const sign = i % 2 === 0 ? -1 : 1;
    points.push({
      x: from.x + dx * t + nx * amplitude * sign,
      y: from.y + dy * t + ny * amplitude * sign,
    });
  }
  points.push(to);
  return points;
}

export function distance(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Ajusta un punto normalizado a una cuadrícula (por ejemplo, la rejilla de zonas del campo). */
export function snapToGrid(point: NormPoint, cols: number, rows: number): NormPoint {
  const x = (Math.round(point.x * cols - 0.5) + 0.5) / cols;
  const y = (Math.round(point.y * rows - 0.5) + 0.5) / rows;
  return { x: clamp01(x), y: clamp01(y) };
}
