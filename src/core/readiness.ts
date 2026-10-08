import { addDays, dayNumber } from './dates';
import type { CheckIn, SessionLog } from '../types';

/** Carga diaria (esfuerzo percibido × minutos) por fecha ISO. */
export function dailyLoads(logs: readonly SessionLog[], endDate: string, days = 90): number[] {
  const map = new Map<string, number>();
  for (const l of logs) map.set(l.date, (map.get(l.date) ?? 0) + l.rpe * (l.durationSeconds / 60));
  const start = addDays(endDate, -(days - 1));
  return Array.from({ length: days }, (_, i) => map.get(addDays(start, i)) ?? 0);
}

/** Media móvil exponencial: λ = 2 / (N + 1). El último valor es el de hoy. */
export function ewma(series: readonly number[], windowDays: number): number {
  const lambda = 2 / (windowDays + 1);
  let value = series[0] ?? 0;
  for (let i = 1; i < series.length; i += 1) value = lambda * (series[i] ?? 0) + (1 - lambda) * value;
  return value;
}

export interface LoadMetrics {
  acute: number;
  chronic: number;
  /** Cociente carga aguda / crónica, o null si todavía no hay carga crónica. */
  acwr: number | null;
  monotony: number | null;
  strain: number | null;
  /** Días desde la primera sesión registrada. */
  daysOfData: number;
}

export function loadMetrics(logs: readonly SessionLog[], today: string): LoadMetrics {
  if (logs.length === 0) return { acute: 0, chronic: 0, acwr: null, monotony: null, strain: null, daysOfData: 0 };
  const series = dailyLoads(logs, today);
  const acute = ewma(series, 7);
  const chronic = ewma(series, 28);
  const first = logs.reduce((min, l) => (l.date < min ? l.date : min), logs[0]?.date ?? today);
  const week = series.slice(-7);
  const mean = week.reduce((a, b) => a + b, 0) / 7;
  const sd = Math.sqrt(week.reduce((a, b) => a + (b - mean) ** 2, 0) / 7);
  const monotony = sd > 0 ? mean / sd : null;
  return {
    acute,
    chronic,
    acwr: chronic > 1 ? acute / chronic : null,
    monotony,
    strain: monotony === null ? null : mean * 7 * monotony,
    daysOfData: Math.max(0, dayNumber(today) - dayNumber(first) + 1),
  };
}

export type ReadinessLevel = 'listo' | 'moderado' | 'descansa';
export type Sensitivity = 'estricto' | 'equilibrado' | 'permisivo';
export type Confidence = 'baja' | 'media' | 'alta';

export interface ReadinessInput {
  today: string;
  logs: readonly SessionLog[];
  checkIn: CheckIn | null;
  /** Horas dormidas anoche, si se registró. */
  sleepHours: number | null;
  /** Hay un dolor activo con alerta sin autorización de un profesional. */
  blockingPain: boolean;
  /** Dolor activo de más de 3 sobre 10. */
  activePain: boolean;
  sensitivity: Sensitivity;
  minor: boolean;
}

export interface Readiness {
  score: number;
  level: ReadinessLevel;
  confidence: Confidence;
  metrics: LoadMetrics;
  reasons: string[];
  calibrating: boolean;
}

const SHIFT: Record<Sensitivity, number> = { estricto: 8, equilibrado: 0, permisivo: -8 };

/**
 * Preparación (0 a 100) = bienestar del día (55 %) + carga (30 %) + dolor y sueño (15 %).
 * La relación aguda/crónica (ACWR) es un indicador de cambios de carga, NO un predictor de lesiones.
 * Una alerta de dolor siempre manda sobre el anillo.
 */
export function computeReadiness(input: ReadinessInput): Readiness {
  const metrics = loadMetrics(input.logs, input.today);
  const reasons: string[] = [];
  const c = input.checkIn;

  let wellness = 70;
  if (c) {
    wellness = ((c.mood + c.energy) / 2 - 1) * (100 / 9) * 0.8 + (10 - c.soreness) * (100 / 9) * 0.2;
    if (c.mood <= 3 || c.energy <= 3) reasons.push('Ánimo o energía bajos hoy.');
    if (c.soreness >= 7) reasons.push('Molestias musculares fuertes.');
  } else {
    reasons.push('Falta tu check-in de hoy.');
  }

  let load = 75;
  const danger = input.minor ? 1.3 : 1.5;
  if (metrics.acwr !== null) {
    if (metrics.acwr > danger) {
      load = 20;
      reasons.push('Tu carga de esta semana subió mucho frente a tu promedio de 4 semanas.');
    } else if (metrics.acwr > 1.3) {
      load = 50;
      reasons.push('Tu carga reciente está por encima de tu promedio.');
    } else if (metrics.acwr < 0.8) {
      load = 65;
    } else {
      load = 90;
    }
  }

  let other = 80;
  if (input.activePain) {
    other -= 40;
    reasons.push('Hay un dolor activo.');
  }
  if (input.sleepHours !== null) {
    if (input.sleepHours < 6) {
      other -= 25;
      reasons.push('Dormiste poco.');
    } else if (input.sleepHours >= 7.5) {
      other += 10;
    }
  }
  other = Math.max(0, Math.min(100, other));

  let score = Math.round(wellness * 0.55 + load * 0.3 + other * 0.15);
  if (input.blockingPain) {
    score = Math.min(score, 40);
    reasons.unshift('Una alerta de dolor está activa: revisa con un profesional.');
  }
  score = Math.max(0, Math.min(100, score));

  const shift = SHIFT[input.sensitivity];
  const level: ReadinessLevel = score >= 70 + shift ? 'listo' : score >= 45 + shift ? 'moderado' : 'descansa';
  const calibrating = metrics.daysOfData < 28;
  const confidence: Confidence = !c || metrics.daysOfData < 7 ? 'baja' : calibrating ? 'media' : 'alta';

  return { score, level: input.blockingPain ? 'descansa' : level, confidence, metrics, reasons, calibrating };
}
