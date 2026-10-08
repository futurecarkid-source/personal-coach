import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { setHapticsEnabled } from '../theme/haptics';
import type { AppAction, AppState } from '../types';
import { loadState, saveState } from './persistence';
import { appReducer, createInitialState } from './reducer';
import { getDefaultStorage, type StorageAdapter } from './storage';

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  /** `true` si el contenido guardado estaba dañado y se arrancó limpio (hay copia aparte). */
  recovered: boolean;
}

const StateContext = createContext<AppContextValue | null>(null);
const DispatchContext = createContext<Dispatch<AppAction> | null>(null);

const SAVE_DEBOUNCE_MS = 300;

export function AppProvider({ children, storage }: { children: ReactNode; storage?: StorageAdapter }): React.JSX.Element {
  const adapter = useMemo(() => storage ?? getDefaultStorage(), [storage]);
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    loadState(adapter).then((result) => {
      if (!alive) return;
      dispatch({ type: 'HYDRATE', state: result.state });
      setRecovered(result.status === 'recovered');
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, [adapter]);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(adapter, state).catch(() => undefined);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [adapter, hydrated, state]);

  useEffect(() => {
    setHapticsEnabled(state.settings.hapticsEnabled);
  }, [state.settings.hapticsEnabled]);

  const value = useMemo<AppContextValue>(() => ({ state, hydrated, recovered }), [state, hydrated, recovered]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={value}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState debe usarse dentro de <AppProvider>');
  return ctx;
}

export function useAppDispatch(): Dispatch<AppAction> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useAppDispatch debe usarse dentro de <AppProvider>');
  return ctx;
}
