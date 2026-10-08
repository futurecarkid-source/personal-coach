import { z } from 'zod';

/** Coordenadas normalizadas del campo: x de 0 (portería propia) a 1 (rival), y de 0 a 1 de lado a lado. */
export const normPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type NormPoint = z.infer<typeof normPointSchema>;

export const GAME_FORMATS = ['f11', 'f8', 'f7', 'futsal'] as const;
export const gameFormatSchema = z.enum(GAME_FORMATS);
export type GameFormat = z.infer<typeof gameFormatSchema>;

export const tokenSchema = z.object({
  id: z.string(),
  team: z.enum(['propio', 'rival', 'balon', 'cono']),
  label: z.string().max(3),
  pos: normPointSchema,
});
export type Token = z.infer<typeof tokenSchema>;

export const DRAWING_KINDS = ['pase', 'carrera', 'conduccion'] as const;
export const drawingKindSchema = z.enum(DRAWING_KINDS);
export type DrawingKind = z.infer<typeof drawingKindSchema>;

export const drawingSchema = z.object({
  id: z.string(),
  kind: drawingKindSchema,
  from: normPointSchema,
  to: normPointSchema,
});
export type Drawing = z.infer<typeof drawingSchema>;

/** Un fotograma clave de una jugada. */
export const playFrameSchema = z.object({
  tokens: z.array(tokenSchema),
  drawings: z.array(drawingSchema),
});
export type PlayFrame = z.infer<typeof playFrameSchema>;

export const playSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(40),
  format: gameFormatSchema,
  formation: z.string().max(12),
  frames: z.array(playFrameSchema).min(1),
  updatedAt: z.string(),
});
export type Play = z.infer<typeof playSchema>;

export interface Formation {
  /** Texto de la formación, por ejemplo "4-2-3-1". */
  id: string;
  lines: readonly number[];
}
