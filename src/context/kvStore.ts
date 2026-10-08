import type { StorageAdapter } from './storage';

/** App nativa: base de datos clave-valor incluida con Expo (funciona en Expo Go). */
export function loadKvStore(): StorageAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('expo-sqlite/kv-store') as { default: StorageAdapter }).default;
}
