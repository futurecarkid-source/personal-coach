import type { BodyZone } from '../types';

/**
 * Reglas locales de alerta para dolor (sin IA). Orientativas: NO diagnostican.
 * Basadas en el borrador de seguridad (R1 a R11) del inventario; requieren revisión de un profesional
 * (fisioterapeuta o médico deportivo) antes de publicar.
 */

export const PAIN_MECHANISMS = ['golpe', 'giro', 'sobrecarga', 'sin_causa'] as const;
export type PainMechanism = (typeof PAIN_MECHANISMS)[number];

export const PAIN_KINDS = ['punzante', 'tiron', 'ardor', 'rigidez', 'sordo'] as const;
export type PainKind = (typeof PAIN_KINDS)[number];

export interface PainScreeningInput {
  zone: BodyZone;
  /** Intensidad 0 a 10. */
  intensity: number;
  mechanism: PainMechanism;
  /** Puede apoyar la pierna / mover la zona con normalidad (cuatro pasos seguidos, mover sin bloqueo). */
  canUseNormally: boolean;
  daysSinceOnset: number;
  visibleDeformity: boolean;
  /** Pérdida repentina de sensibilidad o fuerza. */
  numbnessOrWeakness: boolean;
  /** Hinchazón grande en menos de dos horas. */
  rapidSwelling: boolean;
  /** Sensación de "crack" o de desgarro con "pelotazo". */
  heardCrack: boolean;
  /** Dolor al presionar un punto concreto del hueso. */
  boneTenderness: boolean;
  /** Dolor constante en reposo o por la noche. */
  nightOrRestPain: boolean;
  fever: boolean;
  chestOrBreathing: boolean;
  /** Pantorrilla hinchada, caliente o enrojecida. */
  calfSwellingHeat: boolean;
  /** Rodilla: se bloquea o se "sale". */
  jointLockedOrGivingWay: boolean;
  /** Golpe en cabeza, cara o cuello con cualquier síntoma (dolor de cabeza, mareo, confusión, visión borrosa, náuseas). */
  headBlowWithSymptoms: boolean;
  /** Pérdida de conciencia, convulsión, vómitos repetidos, confusión creciente, visión doble, debilidad en brazos o piernas. */
  headEmergencySigns: boolean;
  /** Entumecimiento en entrepierna/glúteos o problemas para controlar orina o heces. */
  saddleOrBladder: boolean;
  /** Debilidad o entumecimiento que empeora en una o ambas piernas. */
  legWeaknessWorsening: boolean;
}

export type ScreeningLevel = 'ok' | 'consulta' | 'urgencias';

export interface PainScreening {
  level: ScreeningLevel;
  ruleIds: string[];
  reasons: string[];
  /** Se bloquea el entrenamiento de esa zona hasta que la persona indique que la evaluó un profesional. */
  blockZone: boolean;
  /** Si es verdadero no se entrena hoy (conmoción o urgencia). */
  stopTrainingToday: boolean;
}

const LEG_ZONES: readonly BodyZone[] = ['cadera', 'ingle', 'cuadriceps', 'isquiotibiales', 'rodilla', 'gemelo', 'aquiles', 'tobillo', 'pie', 'canilla'];
const MUSCLE_ZONES: readonly BodyZone[] = ['cuadriceps', 'isquiotibiales', 'gemelo', 'ingle', 'aquiles'];
const RANK: Record<ScreeningLevel, number> = { ok: 0, consulta: 1, urgencias: 2 };

export const EMPTY_SCREENING_INPUT: PainScreeningInput = {
  zone: 'rodilla',
  intensity: 0,
  mechanism: 'sin_causa',
  canUseNormally: true,
  daysSinceOnset: 0,
  visibleDeformity: false,
  numbnessOrWeakness: false,
  rapidSwelling: false,
  heardCrack: false,
  boneTenderness: false,
  nightOrRestPain: false,
  fever: false,
  chestOrBreathing: false,
  calfSwellingHeat: false,
  jointLockedOrGivingWay: false,
  headBlowWithSymptoms: false,
  headEmergencySigns: false,
  saddleOrBladder: false,
  legWeaknessWorsening: false,
};

export const SCREENING_DISCLAIMER = 'Estas señales justifican que te evalúe un profesional. Esto no es un diagnóstico.';

/** Evalúa las reglas R1 a R11. Devuelve el nivel más alto que se active. */
export function screenPain(input: PainScreeningInput): PainScreening {
  const fired: { id: string; level: ScreeningLevel; reason: string }[] = [];
  const add = (id: string, level: ScreeningLevel, reason: string): void => {
    fired.push({ id, level, reason });
  };
  const i = input;

  // R1 Urgencias inmediatas
  if (i.visibleDeformity) add('R1', 'urgencias', 'Hay una deformidad visible.');
  if (i.numbnessOrWeakness) add('R1', 'urgencias', 'Perdiste sensibilidad o fuerza de forma repentina.');
  if (i.chestOrBreathing) add('R1', 'urgencias', 'Tienes dolor en el pecho o dificultad para respirar.');
  if (i.intensity >= 9) add('R1', 'urgencias', 'El dolor es muy intenso (9 o 10 de 10).');

  // R2 Tobillo y pie
  if ((i.zone === 'tobillo' || i.zone === 'pie') && (!i.canUseNormally || i.boneTenderness)) {
    add('R2', 'consulta', 'En tobillo o pie, no poder apoyar o sentir dolor al presionar el hueso justifica descartar una fractura.');
  }

  // R3 Rodilla
  if (i.zone === 'rodilla' && (!i.canUseNormally || i.boneTenderness || i.jointLockedOrGivingWay || (i.rapidSwelling && i.mechanism === 'giro'))) {
    add('R3', 'consulta', 'En la rodilla, el bloqueo, la sensación de que se sale, la hinchazón inmediata tras un giro o no poder apoyar justifican una evaluación.');
  }

  // R4 Articulación o hueso en general
  if ((!i.canUseNormally && LEG_ZONES.includes(i.zone)) || i.rapidSwelling || i.heardCrack || i.boneTenderness) {
    add('R4', 'consulta', 'No poder apoyar, una hinchazón rápida, un "crack" o dolor al presionar un hueso justifican una evaluación.');
  }

  // R5 Músculo
  if (MUSCLE_ZONES.includes(i.zone) && (i.heardCrack || !i.canUseNormally || i.rapidSwelling)) {
    add('R5', 'consulta', 'Una sensación de desgarro, no poder contraer el músculo o una hinchazón grande justifican una evaluación.');
  }

  // R6 Lumbar con señales de alarma
  if (i.zone === 'lumbar' && (i.saddleOrBladder || i.legWeaknessWorsening)) {
    add('R6', 'urgencias', 'Dolor lumbar con entumecimiento en la entrepierna, pérdida de control de orina o heces, o debilidad que empeora en las piernas.');
  }

  // R7 Lumbar, otras señales
  if (i.zone === 'lumbar' && (i.fever || i.nightOrRestPain || i.mechanism === 'golpe')) {
    add('R7', 'consulta', 'Dolor lumbar con fiebre, dolor constante en reposo o por la noche, o tras un golpe fuerte.');
  }

  // R8 Cabeza y cuello (conmoción)
  if ((i.zone === 'cabeza' || i.zone === 'cuello') && i.headEmergencySigns) {
    add('R8', 'urgencias', 'Tras un golpe en la cabeza o el cuello hay señales de emergencia.');
  } else if ((i.zone === 'cabeza' || i.zone === 'cuello' || i.mechanism === 'golpe') && i.headBlowWithSymptoms) {
    add('R8', 'consulta', 'Un golpe en la cabeza con cualquier síntoma exige parar de inmediato, no quedarte solo y recibir evaluación médica.');
  }

  // R9 Señales sistémicas
  if (i.calfSwellingHeat) add('R9', 'consulta', 'Una pantorrilla hinchada y caliente necesita evaluación pronta (posible problema circulatorio).');
  if (i.fever && (i.zone !== 'cabeza')) add('R9', 'consulta', 'Fiebre junto con dolor muscular o articular.');

  // R10 Persistencia o intensidad
  if (i.intensity >= 7) add('R10', 'consulta', 'Un dolor de 7 o más sobre 10 justifica consultar antes de volver a cargar la zona.');

  // R11 Posible estrés del hueso
  if (i.mechanism === 'sobrecarga' && i.boneTenderness && i.daysSinceOnset >= 10) {
    add('R11', 'consulta', 'Dolor en un punto del hueso por sobrecarga que no cede en 10 días o más (posible lesión por estrés).');
  }

  let level: ScreeningLevel = 'ok';
  for (const f of fired) if (RANK[f.level] > RANK[level]) level = f.level;
  const headStop = i.headBlowWithSymptoms || i.headEmergencySigns;

  return {
    level,
    ruleIds: [...new Set(fired.map((f) => f.id))],
    reasons: [...new Set(fired.map((f) => f.reason))],
    blockZone: level !== 'ok',
    stopTrainingToday: level === 'urgencias' || headStop,
  };
}

// ---------- Seguimiento ----------

export interface FollowUp {
  at: string;
  intensity: number;
  note: string;
}

export interface TrackedReport {
  zone: BodyZone;
  createdAt: string;
  intensity: number;
  followUps: readonly FollowUp[];
  status: 'activo' | 'resuelto';
}

/** Horas desde el reporte en las que toca preguntar: 24, 48, 72 h y luego cada semana (hasta 8 semanas). */
export const FOLLOW_UP_OFFSETS_HOURS = [24, 48, 72, 168, 336, 504, 672] as const;

const HOUR_MS = 3_600_000;

/** Siguiente seguimiento pendiente (índice en `FOLLOW_UP_OFFSETS_HOURS`) si ya toca, o null. */
export function dueFollowUp(report: TrackedReport, nowMs: number): number | null {
  if (report.status === 'resuelto') return null;
  const index = report.followUps.length;
  const offset = FOLLOW_UP_OFFSETS_HOURS[index];
  if (offset === undefined) return null;
  const created = Date.parse(report.createdAt);
  if (Number.isNaN(created)) return null;
  return nowMs - created >= offset * HOUR_MS ? index : null;
}

export interface ProgressAssessment {
  level: 'ok' | 'consulta';
  reasons: string[];
}

/**
 * Evalúa la evolución de un dolor con sus seguimientos (regla R10):
 * dolor ≥ 7, sin mejora tras 72 h, empeora en 24 a 48 h, o reaparece 3 veces en la misma zona.
 */
export function assessProgress(report: TrackedReport, nowMs: number, sameZoneReportsLast60Days = 1): ProgressAssessment {
  const reasons: string[] = [];
  const created = Date.parse(report.createdAt);
  const latest = report.followUps[report.followUps.length - 1];
  const current = latest ? latest.intensity : report.intensity;
  const hours = Number.isNaN(created) ? 0 : (nowMs - created) / HOUR_MS;

  if (current >= 7) reasons.push('El dolor sigue en 7 o más sobre 10.');
  if (latest && hours >= 72 && current >= report.intensity) reasons.push('Después de 72 horas el dolor no mejora.');
  if (latest) {
    const prev = report.followUps.length >= 2 ? report.followUps[report.followUps.length - 2] : undefined;
    const before = prev ? prev.intensity : report.intensity;
    if (hours <= 72 && current - before >= 2) reasons.push('El dolor empeoró en las últimas 24 a 48 horas.');
  }
  if (sameZoneReportsLast60Days >= 3) reasons.push('Este dolor reapareció en la misma zona tres veces.');

  return { level: reasons.length > 0 ? 'consulta' : 'ok', reasons };
}

/** Zonas que el plan debe evitar: dolor activo o bloqueo por alerta sin autorización profesional. */
export function blockedZones(reports: readonly { zone: BodyZone; status: 'activo' | 'resuelto'; level: ScreeningLevel; clearedByProfessional: boolean; intensity: number }[]): BodyZone[] {
  const zones = new Set<BodyZone>();
  for (const r of reports) {
    if (r.status !== 'activo') continue;
    if (r.level !== 'ok' && !r.clearedByProfessional) zones.add(r.zone);
    else if (r.intensity >= 4) zones.add(r.zone);
  }
  return [...zones];
}
