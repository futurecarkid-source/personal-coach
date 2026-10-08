import { z } from 'zod';

export const POSITIONS = ['POR', 'DFC', 'LAT', 'MCD', 'MC', 'MCO', 'EXT', 'DEL'] as const;
export const positionSchema = z.enum(POSITIONS);
export type Position = z.infer<typeof positionSchema>;

export const LEVELS = ['principiante', 'amateur', 'semipro', 'pro', 'cantera'] as const;
export const levelSchema = z.enum(LEVELS);
export type Level = z.infer<typeof levelSchema>;

export const FEET = ['izquierdo', 'derecho', 'ambos'] as const;
export const footSchema = z.enum(FEET);
export type Foot = z.infer<typeof footSchema>;

/** Rango de edad elegido en la primera pantalla; define las salvaguardas para menores. */
export const AGE_BANDS = ['menor13', 'de13a15', 'de16a17', 'adulto'] as const;
export const ageBandSchema = z.enum(AGE_BANDS);
export type AgeBand = z.infer<typeof ageBandSchema>;

export const isMinor = (band: AgeBand): boolean => band !== 'adulto';

/** Los 16 atributos de jugador de campo. */
export const OUTFIELD_ATTRIBUTES = [
  'pac',
  'sho',
  'pas',
  'dri',
  'def',
  'phy',
  'vision',
  'mentalidad',
  'resistencia',
  'agilidad',
  'salto',
  'juegoAereo',
  'posicionamiento',
  'disciplina',
  'pieDebil',
  'tecnica',
] as const;
export const outfieldAttributeSchema = z.enum(OUTFIELD_ATTRIBUTES);
export type OutfieldAttributeKey = z.infer<typeof outfieldAttributeSchema>;

/** Conjunto propio de porteros (las 6 cifras principales de su tarjeta). */
export const GOALKEEPER_ATTRIBUTES = [
  'reflejos',
  'estirada',
  'juegoDePies',
  'posicionamientoPortero',
  'salidas',
  'saque',
] as const;
export const goalkeeperAttributeSchema = z.enum(GOALKEEPER_ATTRIBUTES);
export type GoalkeeperAttributeKey = z.infer<typeof goalkeeperAttributeSchema>;

export type AttributeKey = OutfieldAttributeKey | GoalkeeperAttributeKey;

/** De dónde sale la cifra: fórmula del cuestionario, medición real o ajuste manual. */
export const ATTRIBUTE_SOURCES = ['estimado', 'medido', 'ajustado'] as const;
export const attributeSourceSchema = z.enum(ATTRIBUTE_SOURCES);
export type AttributeSource = z.infer<typeof attributeSourceSchema>;

export const attributeValueSchema = z.object({
  value: z.number().min(1).max(99),
  source: attributeSourceSchema,
});
export type AttributeValue = z.infer<typeof attributeValueSchema>;

export const attributesSchema = z.record(z.string(), attributeValueSchema);
export type Attributes = Partial<Record<AttributeKey, AttributeValue>>;

export const RARITIES = ['bronce', 'plata', 'oro', 'especial', 'leyenda'] as const;
export const raritySchema = z.enum(RARITIES);
export type Rarity = z.infer<typeof raritySchema>;

export const playerSchema = z.object({
  id: z.string(),
  nickname: z.string().min(1).max(24),
  number: z.number().int().min(0).max(99),
  country: z.string().length(2),
  position: positionSchema,
  secondaryPositions: z.array(positionSchema).max(3),
  level: levelSchema,
  foot: footSchema,
  club: z.string().max(40).nullable(),
  ageBand: ageBandSchema,
  attributes: attributesSchema,
  /** Autoevaluación del cuestionario (1 a 10) por atributo principal. */
  selfAssessment: z.record(z.string(), z.number().min(1).max(10)).default({}),
  /** Fecha ISO de creación de la tarjeta. */
  createdAt: z.string(),
});
export type Player = Omit<z.infer<typeof playerSchema>, 'attributes'> & { attributes: Attributes };
