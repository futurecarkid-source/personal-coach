/** Variables y recursos del servicio (Cloudflare Worker). Los secretos nunca viajan a la app. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  /** Clave del proveedor (secreto). */
  ANTHROPIC_API_KEY: string;
  /** Código de acceso del dueño (secreto). */
  OWNER_ACCESS_CODE: string;
  /** Contadores de uso por día y por minuto. */
  USAGE?: KVLike;
  /** Modelo por defecto y por tarea (opcional). Ejemplo: MODEL_COACH_CHAT. */
  MODEL_DEFAULT?: string;
  MODEL_COACH_CHAT?: string;
  MODEL_WEEKLY_PLAN?: string;
  MODEL_PAIN_FOLLOWUP?: string;
  MODEL_TACTIC_EXPLAIN?: string;
  MODEL_MATCH_REVIEW?: string;
  MODEL_SCOUTING_ESTIMATE?: string;
  /** Límites diarios (consultas por día). */
  DAILY_LIMIT_OWNER?: string;
  DAILY_LIMIT_PRO?: string;
}
