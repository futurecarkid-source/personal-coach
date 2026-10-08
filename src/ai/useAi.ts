import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppState } from '../context';
import { getAccessCode, setAccessCode as storeAccessCode } from './secrets';
import { AiError, type GatewayConfig } from './client';
import { canUseAi, type AiGateResult } from './safety';

export interface AiAccess {
  /** Resultado de las comprobaciones previas (servicio, consentimiento, menores). */
  gate: AiGateResult;
  /** Configuración lista para llamar al servicio, o null si no se puede usar. */
  config: GatewayConfig | null;
  hasAccessCode: boolean;
  loaded: boolean;
  saveAccessCode: (code: string) => Promise<boolean>;
  acceptConsent: () => void;
  withdrawConsent: () => void;
}

/** Estado de la IA para la pantalla actual: configurada, con permiso, y permitida para esta persona. */
export function useAiAccess(options: { sendsMedia?: boolean } = {}): AiAccess {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const [code, setCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getAccessCode().then((value) => {
      if (!alive) return;
      setCode(value);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ageBand = state.player?.ageBand ?? 'adulto';
  const hasAccessCode = code !== null && code.length > 0;
  const gate = useMemo<AiGateResult>(
    () => canUseAi({ ageBand, settings: state.settings, hasAccessCode, sendsMedia: options.sendsMedia }),
    [ageBand, state.settings, hasAccessCode, options.sendsMedia],
  );

  const config = useMemo<GatewayConfig | null>(
    () => (gate.allowed && code ? { baseUrl: state.settings.aiGatewayUrl.trim(), accessCode: code, guardianConsent: state.settings.guardianConsent } : null),
    [gate.allowed, code, state.settings.aiGatewayUrl, state.settings.guardianConsent],
  );

  const saveAccessCode = useCallback(async (value: string): Promise<boolean> => {
    const ok = await storeAccessCode(value);
    if (ok) setCode(value.trim() || null);
    return ok;
  }, []);

  const acceptConsent = useCallback(() => dispatch({ type: 'SET_SETTINGS', patch: { aiConsentAt: new Date().toISOString() } }), [dispatch]);
  const withdrawConsent = useCallback(() => dispatch({ type: 'SET_SETTINGS', patch: { aiConsentAt: null } }), [dispatch]);

  return { gate, config, hasAccessCode, loaded, saveAccessCode, acceptConsent, withdrawConsent };
}

/** Convierte una puerta cerrada en un error con código, para mostrar el mismo mensaje en todas las pantallas. */
export function gateError(gate: AiGateResult): AiError | null {
  return gate.allowed ? null : new AiError(gate.code, gate.message);
}
