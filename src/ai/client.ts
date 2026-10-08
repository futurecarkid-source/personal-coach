import { AI_ERROR_CODES, TASK_SCHEMAS, type AiErrorCode, type AiTask, type TaskInput, type TaskOutput } from './contract';

export class AiError extends Error {
  readonly code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.name = 'AiError';
    this.code = code;
  }
}

export interface GatewayConfig {
  baseUrl: string;
  accessCode: string;
  guardianConsent?: boolean;
  /** Inyectable para pruebas. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface AiResult<T extends AiTask> {
  output: TaskOutput<T>;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

const DEFAULT_TIMEOUT_MS = 45_000;

function isErrorCode(value: unknown): value is AiErrorCode {
  return typeof value === 'string' && (AI_ERROR_CODES as readonly string[]).includes(value);
}

/**
 * Cliente del servicio de IA. La app nunca habla directamente con el proveedor: solo con el servicio,
 * que guarda las claves, comprueba el acceso y limita el uso. Valida entrada y salida con Zod.
 */
export async function runAiTask<T extends AiTask>(config: GatewayConfig, task: T, input: TaskInput<T>): Promise<AiResult<T>> {
  const schemas = TASK_SCHEMAS[task];
  const parsedInput = schemas.input.safeParse(input);
  if (!parsedInput.success) throw new AiError('bad_request', 'Los datos de la consulta no son válidos.');

  const doFetch = config.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let response: Response;
  try {
    response = await doFetch(`${config.baseUrl.replace(/\/+$/, '')}/v1/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.accessCode}` },
      body: JSON.stringify({ task, input: parsedInput.data, consent: true, guardianConsent: config.guardianConsent === true }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new AiError('timeout', 'La IA tardó demasiado en responder.');
    throw new AiError('offline', 'No hay conexión con el servicio de IA.');
  } finally {
    clearTimeout(timer);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AiError('provider_error', 'El servicio respondió algo inesperado.');
  }
  if (typeof body !== 'object' || body === null) throw new AiError('provider_error', 'El servicio respondió algo inesperado.');
  const envelope = body as { ok?: unknown; error?: { code?: unknown; message?: unknown }; output?: unknown; model?: unknown; usage?: { inputTokens?: unknown; outputTokens?: unknown } };

  if (envelope.ok !== true) {
    const code = isErrorCode(envelope.error?.code) ? envelope.error.code : 'provider_error';
    const message = typeof envelope.error?.message === 'string' ? envelope.error.message : 'La IA no pudo responder.';
    throw new AiError(code, message);
  }

  const output = schemas.output.safeParse(envelope.output);
  if (!output.success) throw new AiError('bad_output', 'La IA devolvió una respuesta con formato inválido.');
  return {
    output: output.data as TaskOutput<T>,
    model: typeof envelope.model === 'string' ? envelope.model : 'desconocido',
    usage: {
      inputTokens: typeof envelope.usage?.inputTokens === 'number' ? envelope.usage.inputTokens : 0,
      outputTokens: typeof envelope.usage?.outputTokens === 'number' ? envelope.usage.outputTokens : 0,
    },
  };
}

/** Mensaje amable para mostrar en pantalla según el tipo de error. */
export function describeAiError(error: unknown): string {
  if (error instanceof AiError) {
    switch (error.code) {
      case 'offline':
        return 'Sin conexión con la IA. Esta función necesita internet.';
      case 'timeout':
        return 'La IA tardó demasiado. Intenta de nuevo.';
      case 'unauthorized':
        return 'El código de acceso no es válido.';
      case 'rate_limited':
        return 'Vas muy rápido. Espera unos segundos e intenta de nuevo.';
      case 'quota_exceeded':
        return 'Llegaste al límite de consultas de hoy.';
      case 'blocked':
        return 'La IA no pudo responder esa consulta.';
      default:
        return error.message;
    }
  }
  return 'Algo salió mal con la IA.';
}
