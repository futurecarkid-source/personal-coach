import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

let current = false;
let started = false;
const listeners = new Set<() => void>();

function set(v: boolean): void {
  if (v === current) return;
  current = v;
  listeners.forEach((l) => l());
}

function start(): void {
  if (started || Platform.OS !== 'ios') return;
  started = true;
  AccessibilityInfo.isReduceTransparencyEnabled().then(set).catch(() => undefined);
  AccessibilityInfo.addEventListener('reduceTransparencyChanged', set);
}

function subscribe(cb: () => void): () => void {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Ajuste de accesibilidad de iOS "Reducir transparencia": quien lo activa pide fondos opacos.
 * Se lee una sola vez para toda la app (un solo oyente), no una vez por cada tarjeta.
 */
export function useReduceTransparency(): boolean {
  return useSyncExternalStore(subscribe, () => current, () => false);
}
