import { z } from 'zod';
import { bodyZoneSchema } from './training';

export const PAIN_SIDES = ['izquierdo', 'derecho', 'centro'] as const;
export const painSideSchema = z.enum(PAIN_SIDES);
export type PainSide = z.infer<typeof painSideSchema>;

/** Foto del dolor: se queda solo en este dispositivo. Los marcadores son posiciones relativas (0 a 1) sobre la foto. */
export const painPhotoSchema = z.object({
  uri: z.string(),
  aspect: z.number().positive().default(1),
  markers: z.array(z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })).max(3),
});
export type PainPhoto = z.infer<typeof painPhotoSchema>;

export const painReportSchema = z.object({
  id: z.string(),
  zone: bodyZoneSchema,
  side: painSideSchema.default('centro'),
  photo: painPhotoSchema.nullable().default(null),
  createdAt: z.string(),
  intensity: z.number().min(0).max(10),
  mechanism: z.enum(['golpe', 'giro', 'sobrecarga', 'sin_causa']),
  kind: z.enum(['punzante', 'tiron', 'ardor', 'rigidez', 'sordo']),
  canUseNormally: z.boolean(),
  swelling: z.boolean(),
  /** Resultado de las reglas locales de alerta al reportar. */
  level: z.enum(['ok', 'consulta', 'urgencias']),
  ruleIds: z.array(z.string()),
  followUps: z.array(z.object({ at: z.string(), intensity: z.number().min(0).max(10), note: z.string(), photo: painPhotoSchema.optional() })),
  status: z.enum(['activo', 'resuelto']),
  /** La persona indicó que un profesional ya la evaluó y puede volver a cargar la zona. */
  clearedByProfessional: z.boolean(),
});
export type PainReport = z.infer<typeof painReportSchema>;
