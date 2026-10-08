import { appStateSchema, type AppState } from '../types';
import { createInitialState } from './reducer';
import type { StorageAdapter } from './storage';

export const STATE_KEY = 'dorsal.state.v1';
export const CORRUPT_KEY = 'dorsal.state.v1.corrupt';

export type LoadResult =
  | { status: 'empty'; state: AppState }
  | { status: 'ok'; state: AppState }
  | { status: 'recovered'; state: AppState };

/**
 * Lee y valida el estado guardado. Si el contenido no es válido, lo guarda aparte como copia
 * (nunca se pierde) y arranca limpio.
 */
export async function loadState(storage: StorageAdapter): Promise<LoadResult> {
  let raw: string | null;
  try {
    raw = await storage.getItem(STATE_KEY);
  } catch {
    return { status: 'empty', state: createInitialState() };
  }
  if (raw === null) return { status: 'empty', state: createInitialState() };
  try {
    const parsed = appStateSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { status: 'ok', state: parsed.data as AppState };
  } catch {
    // JSON dañado: cae al camino de recuperación.
  }
  try {
    await storage.setItem(CORRUPT_KEY, raw);
  } catch {
    // Si ni siquiera se puede guardar la copia, se sigue igualmente.
  }
  return { status: 'recovered', state: createInitialState() };
}

export async function saveState(storage: StorageAdapter, state: AppState): Promise<void> {
  await storage.setItem(STATE_KEY, JSON.stringify(state));
}
