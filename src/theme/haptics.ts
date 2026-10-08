import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Helpers de respuesta háptica.
 * - Solo el iPhone tiene motor háptico: en iPad no hace nada.
 * - Se puede apagar desde Ajustes (`setHapticsEnabled`).
 */
let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function isHapticsSupported(): boolean {
  if (Platform.OS !== 'ios') return false;
  return Platform.isPad !== true;
}

function run(task: () => Promise<void>): void {
  if (!enabled || !isHapticsSupported()) return;
  // La háptica nunca debe romper una interacción.
  task().catch(() => undefined);
}

export const haptics = {
  /** Tick de selectores, cambio de pestaña, arrastre sobre una cuadrícula. */
  selection: () => run(() => Haptics.selectionAsync()),
  /** Toggle, chip. */
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Confirmar un evento o una acción. */
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  /** Un muelle que "aterriza": suave y corto. */
  soft: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  rigid: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
} as const;

export type HapticKind = keyof typeof haptics | 'none';

export function triggerHaptic(kind: HapticKind): void {
  if (kind === 'none') return;
  haptics[kind]();
}

/**
 * Patrón de respiración para Matchday Zen: pulsos suaves y repetidos.
 * expo-haptics no ofrece vibración continua, así que se programan pulsos sobre un reloj monótono.
 * Devuelve una función para cancelar.
 */
export function startPulsePattern(options: {
  durationMs: number;
  intervalMs: number;
  kind?: Exclude<HapticKind, 'none'>;
}): () => void {
  const { durationMs, intervalMs, kind = 'soft' } = options;
  const start = Date.now();
  let cancelled = false;
  let next = 0;
  const tick = (): void => {
    if (cancelled) return;
    const elapsed = Date.now() - start;
    if (elapsed >= durationMs) return;
    haptics[kind]();
    next += 1;
    // Se calcula contra el reloj para no acumular deriva.
    const wait = Math.max(0, start + next * intervalMs - Date.now());
    setTimeout(tick, wait);
  };
  tick();
  return () => {
    cancelled = true;
  };
}
