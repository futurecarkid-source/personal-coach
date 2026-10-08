import { z } from 'zod';
import { bodyZoneSchema } from './training';

export const painReportSchema = z.object({
  id: z.string(),
  zone: bodyZoneSchema,
  createdAt: z.string(),
  intensity: z.number().min(0).max(10),
  mechanism: z.enum(['golpe', 'giro', 'sobrecarga', 'sin_causa']),
  kind: z.enum(['punzante', 'tiron', 'ardor', 'rigidez', 'sordo']),
  canUseNormally: z.boolean(),
  swelling: z.boolean(),
  /** Resultado de las reglas locales de alerta al reportar. */
  level: z.enum(['ok', 'consulta', 'urgencias']),
  ruleIds: z.array(z.string()),
  followUps: z.array(z.object({ at: z.string(), intensity: z.number().min(0).max(10), note: z.string() })),
  status: z.enum(['activo', 'resuelto']),
  /** La persona indicó que un profesional ya la evaluó y puede volver a cargar la zona. */
  clearedByProfessional: z.boolean(),
});
export type PainReport = z.infer<typeof painReportSchema>;
