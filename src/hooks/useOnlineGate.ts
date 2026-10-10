import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAppDispatch, useAppState } from '../context';
import { onlineStatus, type OnlineStatusResult } from '../core/connectivity';

/** Comprueba la conexión con el servicio al abrir y al volver a la app; guarda la última vez que respondió. */
export function useOnlineGate(): { result: OnlineStatusResult; retry: () => void; checking: boolean } {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const [now, setNow] = useState(() => new Date());
  const [checking, setChecking] = useState(false);
  const url = state.settings.aiGatewayUrl;

  const check = useCallback(async (): Promise<void> => {
    setNow(new Date());
    if (url.trim().length === 0 || url.trim().startsWith('direct:')) return;
    setChecking(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${url.replace(/\/+$/, '')}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const at = new Date();
        dispatch({ type: 'SET_SETTINGS', patch: { lastOnlineAt: at.toISOString() } });
        setNow(at);
      }
    } catch {
      // Sin conexión: se mantiene la última vez confirmada.
    } finally {
      setChecking(false);
    }
  }, [url, dispatch]);

  useEffect(() => {
    // Se lanza fuera del cuerpo del efecto para no actualizar estado de forma síncrona.
    const first = setTimeout(() => void check(), 0);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void check();
    });
    return () => {
      clearTimeout(first);
      sub.remove();
    };
  }, [check]);

  const result = onlineStatus({ gatewayUrl: url, lastOnlineAt: state.settings.lastOnlineAt, now });
  return { result, retry: () => void check(), checking };
}
