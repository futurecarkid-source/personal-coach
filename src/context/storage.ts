/**
 * Capa de almacenamiento intercambiable. En la app se usa `expo-sqlite/kv-store`
 * (viene incluido con Expo, funciona en Expo Go y es asíncrono como AsyncStorage).
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter & { dump(): Record<string, string> } {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
    dump: () => Object.fromEntries(map),
  };
}

let defaultAdapter: StorageAdapter | null = null;

/** Carga perezosa para no importar el módulo nativo en las pruebas. */
export function getDefaultStorage(): StorageAdapter {
  if (defaultAdapter) return defaultAdapter;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const kv = require('expo-sqlite/kv-store') as { default: StorageAdapter };
  defaultAdapter = kv.default;
  return defaultAdapter;
}
