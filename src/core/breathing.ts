export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

export interface BreathProtocol {
  id: 'cuatroSieteOcho' | 'resonancia' | 'caja' | 'activacion';
  name: string;
  description: string;
  /** Segundos de cada fase, en orden: inhalar, retener, exhalar, pausa. */
  seconds: readonly [number, number, number, number];
}

/** El 4-7-8 es relajante (puede dejarte por debajo de tu activación ideal antes de competir); por eso hay más opciones. */
export const BREATH_PROTOCOLS: readonly BreathProtocol[] = [
  { id: 'cuatroSieteOcho', name: '4-7-8', description: 'Inhala 4, retén 7, exhala 8. Calma profunda; ideal para dormir o bajar nervios.', seconds: [4, 7, 8, 0] },
  { id: 'resonancia', name: 'Resonancia', description: 'Inhala 5,5 y exhala 5,5 (unas 5 a 6 respiraciones por minuto). Equilibra antes de competir.', seconds: [5.5, 0, 5.5, 0] },
  { id: 'caja', name: 'Caja 4-4-4-4', description: 'Inhala, retén, exhala y pausa, 4 segundos cada una. Foco y control.', seconds: [4, 4, 4, 4] },
  { id: 'activacion', name: 'Activación', description: 'Inhalación corta y exhalación enérgica. Para subir energía si te sientes apagado.', seconds: [2, 0, 1, 0] },
];

export interface BreathState {
  phase: BreathPhase;
  /** Avance dentro de la fase, de 0 a 1. */
  progress: number;
  cycle: number;
  /** Segundos que faltan en esta fase. */
  remainingSeconds: number;
}

const ORDER: readonly BreathPhase[] = ['inhale', 'hold', 'exhale', 'rest'];

export function cycleSeconds(p: BreathProtocol): number {
  return p.seconds.reduce((a, b) => a + b, 0);
}

/** Fase de la respiración a partir del tiempo transcurrido (función pura; no depende de temporizadores). */
export function breathState(p: BreathProtocol, elapsedMs: number): BreathState {
  const total = cycleSeconds(p) * 1000;
  const t = Math.max(0, elapsedMs);
  const cycle = Math.floor(t / total);
  let within = t - cycle * total;
  for (let i = 0; i < 4; i += 1) {
    const dur = (p.seconds[i] ?? 0) * 1000;
    if (dur === 0) continue;
    if (within < dur) return { phase: ORDER[i] ?? 'rest', progress: within / dur, cycle, remainingSeconds: (dur - within) / 1000 };
    within -= dur;
  }
  return { phase: 'inhale', progress: 0, cycle: cycle + 1, remainingSeconds: p.seconds[0] };
}

export interface Pulse {
  /** Milisegundos desde el inicio de la fase. */
  at: number;
  kind: 'soft' | 'light' | 'medium';
}

/**
 * Pulsos de háptica (iPhone) por fase: al inhalar, pulsos que se aceleran y se hacen más firmes;
 * al retener, un "latido" suave por segundo; al exhalar, pulsos que se espacian hasta el silencio.
 */
export function pulsesFor(phase: BreathPhase, durationMs: number): Pulse[] {
  const out: Pulse[] = [];
  if (durationMs <= 0 || phase === 'rest') return out;
  if (phase === 'hold') {
    for (let t = 0; t < durationMs - 400; t += 1000) out.push({ at: t, kind: 'soft' });
    return out;
  }
  const rising = phase === 'inhale';
  let t = 0;
  let gap = rising ? 700 : 350;
  while (t < durationMs - 200) {
    const fraction = t / durationMs;
    out.push({ at: Math.round(t), kind: rising ? (fraction > 0.66 ? 'medium' : fraction > 0.33 ? 'light' : 'soft') : fraction < 0.5 ? 'light' : 'soft' });
    t += gap;
    gap = rising ? Math.max(260, gap * 0.82) : Math.min(1400, gap * 1.3);
  }
  return out;
}
