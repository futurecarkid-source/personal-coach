import { INPUT_LIMITS, TASK_SCHEMAS, runRequestSchema, type AiErrorCode, type AiTask } from '../../src/ai/contract';
import { authenticate } from './auth';
import type { Env } from './env';
import { buildTaskSpec, type TaskSpec } from './tasks';
import { checkAndCount, createMemoryKV } from './usage';

export interface ModelResult {
  output: unknown;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

/** El modelo real se inyecta; las pruebas usan uno falso. Debe lanzar `ModelError` ante fallos conocidos. */
export type ModelCaller = (spec: TaskSpec) => Promise<ModelResult>;

export class ModelError extends Error {
  readonly code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = 'ModelError';
    this.code = code;
  }
}

export interface HttpRequestLike {
  method: string;
  path: string;
  authorization: string | null;
  bodyText: string;
}

export interface HttpResponseLike {
  status: number;
  body: unknown;
}

export interface HandlerDeps {
  callModel: ModelCaller;
  now?: () => Date;
}

const STATUS: Record<AiErrorCode, number> = {
  unauthorized: 401,
  rate_limited: 429,
  quota_exceeded: 429,
  bad_request: 400,
  blocked: 422,
  bad_output: 502,
  provider_error: 502,
  offline: 503,
  not_configured: 503,
  consent_required: 400,
  not_allowed: 403,
  timeout: 504,
};

function fail(code: AiErrorCode, message: string): HttpResponseLike {
  return { status: STATUS[code], body: { ok: false, error: { code, message } } };
}

const memoryKV = createMemoryKV();

/** Si un perfil de menor llega sin autorización de un adulto, se rechaza (defensa adicional a la app). */
function violatesMinorRule(input: unknown, guardianConsent: boolean | undefined): boolean {
  if (guardianConsent === true) return false;
  const profile = (input as { profile?: { ageBand?: unknown } } | null)?.profile;
  return profile !== undefined && profile !== null && profile.ageBand !== undefined && profile.ageBand !== 'adulto';
}

/**
 * Lógica del servicio, independiente de Cloudflare: valida, autentica, limita el uso y llama al modelo.
 * No guarda ni registra el contenido de las consultas.
 */
export async function handleRequest(req: HttpRequestLike, env: Env, deps: HandlerDeps): Promise<HttpResponseLike> {
  if (req.path === '/health') return { status: 200, body: { ok: true } };
  if (req.path === '/v1/ping') {
    // Comprobación de la conexión desde la app: valida el código sin llamar al modelo ni gastar saldo.
    const who = authenticate(req.authorization, env);
    return who ? { status: 200, body: { ok: true, plan: who.plan } } : fail('unauthorized', 'El código de acceso no es válido.');
  }
  if (req.path !== '/v1/run') return { status: 404, body: { ok: false, error: { code: 'bad_request', message: 'Ruta desconocida.' } } };
  if (req.method !== 'POST') return { status: 405, body: { ok: false, error: { code: 'bad_request', message: 'Método no permitido.' } } };
  if (req.bodyText.length > INPUT_LIMITS.maxBodyBytes) return fail('bad_request', 'La consulta es demasiado grande.');

  const principal = authenticate(req.authorization, env);
  if (!principal) return fail('unauthorized', 'Código de acceso inválido.');

  let raw: unknown;
  try {
    raw = JSON.parse(req.bodyText);
  } catch {
    return fail('bad_request', 'El cuerpo no es JSON válido.');
  }
  const envelope = runRequestSchema.safeParse(raw);
  if (!envelope.success) {
    const missingConsent = envelope.error.issues.some((i) => i.path[0] === 'consent');
    return missingConsent ? fail('consent_required', 'Falta el consentimiento de la persona.') : fail('bad_request', 'La consulta no tiene el formato esperado.');
  }
  const task: AiTask = envelope.data.task;
  const input = TASK_SCHEMAS[task].input.safeParse(envelope.data.input);
  if (!input.success) return fail('bad_request', 'Los datos de la consulta no son válidos.');
  if (violatesMinorRule(input.data, envelope.data.guardianConsent)) return fail('not_allowed', 'Esta función requiere el permiso de un padre, madre o tutor.');

  const now = (deps.now ?? (() => new Date()))();
  const limit = await checkAndCount(env.USAGE ?? memoryKV, principal.plan, principal.id, env, now);
  if (!limit.allowed) return fail(limit.reason ?? 'rate_limited', limit.reason === 'quota_exceeded' ? 'Llegaste al límite de consultas de hoy.' : 'Demasiadas consultas seguidas.');

  let spec: TaskSpec;
  try {
    spec = buildTaskSpec(task, input.data, env);
  } catch {
    return fail('bad_request', 'No se pudo preparar la consulta.');
  }

  try {
    const result = await deps.callModel(spec);
    const output = TASK_SCHEMAS[task].output.safeParse(result.output);
    if (!output.success) return fail('bad_output', 'La IA devolvió una respuesta con formato inválido.');
    return { status: 200, body: { ok: true, task, output: output.data, model: result.model, usage: result.usage } satisfies Record<string, unknown> };
  } catch (error) {
    if (error instanceof ModelError) return fail(error.code, error.message);
    return fail('provider_error', 'La IA no pudo responder en este momento.');
  }
}

