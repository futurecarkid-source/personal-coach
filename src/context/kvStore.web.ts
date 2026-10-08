import type { StorageAdapter } from './storage';

/** Vista previa en navegador: almacenamiento local del navegador, con memoria de respaldo. */
export function loadKvStore(): StorageAdapter {
  const memory = new Map<string, string>();
  const ls = (): Storage | null => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  };
  return {
    getItem: async (key) => ls()?.getItem(key) ?? memory.get(key) ?? null,
    setItem: async (key, value) => {
      memory.set(key, value);
      try {
        ls()?.setItem(key, value);
      } catch {
        /* sin espacio */
      }
    },
    removeItem: async (key) => {
      memory.delete(key);
      ls()?.removeItem(key);
    },
  };
}
