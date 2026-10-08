import type { StorageAdapter } from '../context/storage';

/**
 * Guarda de arranque para la barra de pestañas del sistema (alfa en esta versión de Expo).
 * Antes de usarla se marca el arranque como "pendiente"; si la app llega a mostrarla sin problemas se marca "ok".
 * Si al abrir la app de nuevo sigue "pendiente", el arranque anterior se cerró mal: se desactiva y se usa la barra propia.
 */
export const NATIVE_TABS_KEY = 'dorsal.nativeTabs.boot';

export type NativeTabsBootState = 'ok' | 'pending' | 'disabled';

export async function evaluateNativeTabs(storage: StorageAdapter): Promise<{ enabled: boolean }> {
  let current: string | null = null;
  try {
    current = await storage.getItem(NATIVE_TABS_KEY);
  } catch {
    return { enabled: false };
  }
  if (current === 'pending') {
    await storage.setItem(NATIVE_TABS_KEY, 'disabled').catch(() => undefined);
    return { enabled: false };
  }
  if (current === 'disabled') return { enabled: false };
  try {
    await storage.setItem(NATIVE_TABS_KEY, 'pending');
  } catch {
    return { enabled: false };
  }
  return { enabled: true };
}

export async function markNativeTabsHealthy(storage: StorageAdapter): Promise<void> {
  await storage.setItem(NATIVE_TABS_KEY, 'ok').catch(() => undefined);
}

/** Vuelve a permitir la barra del sistema en el próximo arranque. */
export async function resetNativeTabs(storage: StorageAdapter): Promise<void> {
  await storage.setItem(NATIVE_TABS_KEY, 'ok').catch(() => undefined);
}

export async function readNativeTabsState(storage: StorageAdapter): Promise<NativeTabsBootState> {
  const value = await storage.getItem(NATIVE_TABS_KEY).catch(() => null);
  return value === 'pending' || value === 'disabled' ? value : 'ok';
}
