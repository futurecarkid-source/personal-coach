export const OFFLINE_LIMIT_HOURS = 72;
/** Desde cuántas horas sin conexión se avisa (24 h antes del bloqueo). */
export const OFFLINE_WARN_HOURS = 48;

export type OnlineStatus = 'sin_servicio' | 'ok' | 'aviso' | 'bloqueado';

export interface OnlineStatusResult {
  status: OnlineStatus;
  /** Horas que lleva sin conexión confirmada (null si nunca). */
  hoursOffline: number | null;
  hoursLeft: number | null;
}

/**
 * Regla "primero en línea": con el servicio configurado, la app permite 72 horas seguidas sin conexión.
 * Sin servicio configurado (modo local) no hay límite. La primera vez se da el margen completo desde `firstSeenAt`.
 */
export function onlineStatus(args: { gatewayUrl: string; lastOnlineAt: string | null; now: Date }): OnlineStatusResult {
  if (args.gatewayUrl.trim().length === 0) return { status: 'sin_servicio', hoursOffline: null, hoursLeft: null };
  if (args.lastOnlineAt === null) return { status: 'ok', hoursOffline: null, hoursLeft: OFFLINE_LIMIT_HOURS };
  const last = Date.parse(args.lastOnlineAt);
  if (Number.isNaN(last)) return { status: 'ok', hoursOffline: null, hoursLeft: OFFLINE_LIMIT_HOURS };
  const hours = Math.max(0, (args.now.getTime() - last) / 3_600_000);
  const left = OFFLINE_LIMIT_HOURS - hours;
  const status: OnlineStatus = hours >= OFFLINE_LIMIT_HOURS ? 'bloqueado' : hours >= OFFLINE_WARN_HOURS ? 'aviso' : 'ok';
  return { status, hoursOffline: hours, hoursLeft: Math.max(0, left) };
}
