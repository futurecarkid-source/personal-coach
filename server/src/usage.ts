import type { Env, KVLike } from './env';
import type { Plan } from './auth';

/** Almacén en memoria para pruebas y para ejecutar sin KV (los límites se reinician al reiniciar el servicio). */
export function createMemoryKV(): KVLike & { dump(): Record<string, string> } {
  const map = new Map<string, string>();
  return {
    get: async (key) => map.get(key) ?? null,
    put: async (key, value) => {
      map.set(key, value);
    },
    dump: () => Object.fromEntries(map),
  };
}

export interface LimitResult {
  allowed: boolean;
  reason?: 'rate_limited' | 'quota_exceeded';
}

const PER_MINUTE: Record<Plan, number> = { owner: 20, pro: 10 };
const DEFAULT_DAILY: Record<Plan, number> = { owner: 300, pro: 60 };

function dailyLimit(plan: Plan, env: Env): number {
  const raw = plan === 'owner' ? env.DAILY_LIMIT_OWNER : env.DAILY_LIMIT_PRO;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY[plan];
}

async function bump(kv: KVLike, key: string, ttl: number): Promise<number> {
  const current = Number.parseInt((await kv.get(key)) ?? '0', 10) || 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: ttl });
  return next;
}

/**
 * Límite blando por minuto y por día (KV es eventualmente consistente: sirve para frenar abusos y
 * controlar el costo, no como contabilidad exacta).
 */
export async function checkAndCount(kv: KVLike, plan: Plan, id: string, env: Env, now: Date): Promise<LimitResult> {
  const minute = Math.floor(now.getTime() / 60_000);
  const day = now.toISOString().slice(0, 10);
  const perMinute = await bump(kv, `m:${id}:${minute}`, 120);
  if (perMinute > PER_MINUTE[plan]) return { allowed: false, reason: 'rate_limited' };
  const perDay = await bump(kv, `d:${id}:${day}`, 172_800);
  if (perDay > dailyLimit(plan, env)) return { allowed: false, reason: 'quota_exceeded' };
  return { allowed: true };
}
