import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { getDefaultStorage } from '../context/storage';
import { evaluateNativeTabs, markNativeTabsHealthy, resetNativeTabs } from './nativeTabsGuard';

export type TabsMode = 'native' | 'floating';

interface TabsModeValue {
  mode: TabsMode;
  /** Se confirma que la barra del sistema se mostró bien (quita la marca de arranque pendiente). */
  confirmHealthy: () => void;
  /** Permite probar otra vez la barra del sistema en el próximo arranque. */
  retryNative: () => void;
}

const TabsModeContext = createContext<TabsModeValue>({ mode: 'floating', confirmHealthy: () => undefined, retryNative: () => undefined });

/** La barra del sistema con vidrio solo tiene sentido en iOS 26 o posterior. */
export function supportsNativeTabs(): boolean {
  return Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
}

export function TabsModeProvider({ children }: { children: ReactNode }): React.JSX.Element | null {
  const [mode, setMode] = useState<TabsMode | null>(() => (supportsNativeTabs() ? null : 'floating'));

  useEffect(() => {
    if (!supportsNativeTabs()) return undefined;
    let alive = true;
    evaluateNativeTabs(getDefaultStorage()).then(({ enabled }) => {
      if (alive) setMode(enabled ? 'native' : 'floating');
    });
    return () => {
      alive = false;
    };
  }, []);

  const confirmHealthy = useCallback(() => {
    void markNativeTabsHealthy(getDefaultStorage());
  }, []);
  const retryNative = useCallback(() => {
    void resetNativeTabs(getDefaultStorage());
  }, []);

  const value = useMemo<TabsModeValue>(() => ({ mode: mode ?? 'floating', confirmHealthy, retryNative }), [mode, confirmHealthy, retryNative]);

  if (mode === null) return null;
  return <TabsModeContext.Provider value={value}>{children}</TabsModeContext.Provider>;
}

export function useTabsMode(): TabsModeValue {
  return useContext(TabsModeContext);
}
