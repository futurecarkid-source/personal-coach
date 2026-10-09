import type { Formation, GameFormat, NormPoint } from '../types';

export const FORMATIONS: Record<GameFormat, readonly string[]> = {
  f11: ['4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1', '4-5-1', '4-4-1-1', '4-3-2-1', '3-5-2', '3-4-3', '3-4-2-1', '5-3-2', '5-4-1', '3-4-1-2', '4-2-2-2'],
  f8: ['3-3-1', '3-2-2', '2-3-2', '3-1-3'],
  f7: ['2-3-1', '3-2-1', '2-2-2', '3-3'],
  futsal: ['1-2-1', '2-2', '3-1', '1-1-2'],
};

export const FORMAT_SIZE: Record<GameFormat, number> = { f11: 11, f8: 8, f7: 7, futsal: 5 };

export function parseFormation(id: string): Formation | null {
  const lines = id.split('-').map((part) => Number.parseInt(part, 10));
  if (lines.length < 2 || lines.some((n) => !Number.isInteger(n) || n < 1 || n > 6)) return null;
  return { id, lines };
}

function lineY(count: number, index: number): number {
  if (count === 1) return 0.5;
  const spacing = Math.min(0.22, 0.76 / (count - 1));
  return 0.5 + (index - (count - 1) / 2) * spacing;
}

/**
 * Posiciones normalizadas de un equipo (portero primero) atacando hacia x = 1.
 * El rival se calcula en espejo, defendiendo la portería de la derecha.
 */
export function layoutFormation(id: string, side: 'propio' | 'rival' = 'propio'): NormPoint[] {
  const formation = parseFormation(id);
  if (!formation) return [];
  const points: NormPoint[] = [{ x: 0.06, y: 0.5 }];
  const lineCount = formation.lines.length;
  formation.lines.forEach((count, lineIndex) => {
    const x = lineCount === 1 ? 0.32 : 0.17 + (0.26 * lineIndex) / (lineCount - 1);
    for (let i = 0; i < count; i += 1) points.push({ x, y: lineY(count, i) });
  });
  if (side === 'rival') return points.map((p) => ({ x: 1 - p.x, y: 1 - p.y }));
  return points;
}

export function outfieldPlayers(id: string): number {
  return parseFormation(id)?.lines.reduce((a, b) => a + b, 0) ?? 0;
}
