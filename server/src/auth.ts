import type { Env } from './env';

export type Plan = 'owner' | 'pro';

export interface Principal {
  plan: Plan;
  /** Identificador estable para contar el uso (nunca el código en claro). */
  id: string;
}

/** Comparación en tiempo constante para no filtrar el código por diferencias de tiempo. */
export function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function bearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

/**
 * Autenticación actual: solo el código de acceso del dueño (acceso Pro permanente y gratuito).
 * La verificación de suscripciones de pago (RevenueCat) se añade aquí en la etapa de suscripciones.
 */
export function authenticate(authorization: string | null | undefined, env: Env): Principal | null {
  const token = bearerToken(authorization);
  if (!token || !env.OWNER_ACCESS_CODE) return null;
  if (timingSafeEqual(token, env.OWNER_ACCESS_CODE)) return { plan: 'owner', id: 'owner' };
  return null;
}
