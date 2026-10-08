export interface ReflexTrial {
  /** Tiempo de reacción en ms, o null si no hubo toque. */
  rtMs: number | null;
  /** Era un estímulo en el que NO se debía tocar (go/no-go). */
  noGo: boolean;
  /** Tocó antes de que apareciera el estímulo. */
  falseStart: boolean;
}

export interface ReflexSummary {
  trials: number;
  medianMs: number | null;
  sdMs: number | null;
  /** Anticipaciones (tocar antes del estímulo o en menos de 100 ms). */
  anticipations: number;
  /** No tocó cuando debía. */
  omissions: number;
  /** Tocó cuando NO debía (go/no-go). */
  commissions: number;
  /** Respuestas lentas (más de 500 ms). */
  lapses: number;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
};

/** Resume una serie de intentos. Las anticipaciones (<100 ms) no cuentan como tiempos válidos. */
export function summarizeReflex(trials: readonly ReflexTrial[]): ReflexSummary {
  const valid: number[] = [];
  let anticipations = 0;
  let omissions = 0;
  let commissions = 0;
  let lapses = 0;
  for (const t of trials) {
    if (t.falseStart) {
      anticipations += 1;
      continue;
    }
    if (t.noGo) {
      if (t.rtMs !== null) commissions += 1;
      continue;
    }
    if (t.rtMs === null) {
      omissions += 1;
      continue;
    }
    if (t.rtMs < 100) {
      anticipations += 1;
      continue;
    }
    valid.push(t.rtMs);
    if (t.rtMs > 500) lapses += 1;
  }
  const mean = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  const sd = valid.length > 1 ? Math.sqrt(valid.reduce((a, b) => a + (b - mean) ** 2, 0) / (valid.length - 1)) : null;
  return { trials: trials.length, medianMs: valid.length > 0 ? Math.round(median(valid)) : null, sdMs: sd === null ? null : Math.round(sd), anticipations, omissions, commissions, lapses };
}

/** Cambio frente a tu línea base (mediana de sesiones anteriores). Negativo = más rápido. */
export function reflexTrend(history: readonly number[], latest: number): { baseline: number; deltaMs: number } | null {
  if (history.length < 3) return null;
  const baseline = Math.round(median([...history]));
  return { baseline, deltaMs: Math.round(latest - baseline) };
}
