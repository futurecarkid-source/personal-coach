import { z } from 'zod';
import { buildTaskSpec } from '../../server/src/tasks';
import type { Env } from '../../server/src/env';
import { AiError, type AiResult } from './client';
import { TASK_SCHEMAS, type AiTask, type TaskInput, type TaskOutput } from './contract';

/**
 * Modo directo: la app habla con el proveedor usando TU propia clave de API (Google AI Studio o Anthropic),
 * sin servidor intermedio. La clave vive solo en este dispositivo. Reutiliza los mismos prompts y esquemas
 * del servicio, así que la IA responde igual.
 */
export type DirectProvider = 'gemini' | 'anthropic';

export const DIRECT_PREFIX = 'direct:';
export const directUrl = (provider: DirectProvider): string => `${DIRECT_PREFIX}${provider}`;
export const isDirectUrl = (url: string): boolean => url.trim().startsWith(DIRECT_PREFIX);
export function providerFromUrl(url: string): DirectProvider | null {
  const p = url.trim().slice(DIRECT_PREFIX.length);
  return p === 'gemini' || p === 'anthropic' ? p : null;
}
export const PROVIDER_NAME: Record<DirectProvider, string> = { gemini: 'Google AI Studio (Gemini)', anthropic: 'Anthropic (Claude)' };

const GEMINI_MODEL = 'gemini-flash-latest';
/** Si el alias no existe para esa clave, se prueba un modelo fijo. */
const GEMINI_FALLBACK = 'gemini-2.5-flash';
const ANTHROPIC_MODEL = 'claude-sonnet-5-5';

/** Busca una clave de API en lo que se pegó (aunque venga dentro de un enlace o con texto alrededor). */
export function detectKey(text: string): { provider: DirectProvider; key: string } | null {
  // Google tiene dos formatos de clave: el clásico (AIza…) y el nuevo de AI Studio (AQ.…, con un punto).
  const g = /AIza[0-9A-Za-z_-]{30,}/.exec(text) ?? /AQ\.[0-9A-Za-z_-]{20,}/.exec(text);
  if (g) return { provider: 'gemini', key: g[0] };
  const a = /sk-ant-[0-9A-Za-z_-]{20,}/.exec(text);
  if (a) return { provider: 'anthropic', key: a[0] };
  return null;
}

export type DirectStatus = 'ok' | 'bad_key' | 'unreachable' | 'quota';

/** Prueba la clave sin gastar saldo: solo pide la lista de modelos. */
export async function pingDirect(provider: DirectProvider, key: string, fetchImpl: typeof fetch = fetch): Promise<DirectStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res =
      provider === 'gemini'
        ? await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', { headers: { 'x-goog-api-key': key }, signal: controller.signal })
        : await fetchImpl('https://api.anthropic.com/v1/models?limit=1', {
            headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
            signal: controller.signal,
          });
    if (res.status === 200) return 'ok';
    if (res.status === 400 || res.status === 401 || res.status === 403) return 'bad_key';
    if (res.status === 429) return 'quota';
    return 'unreachable';
  } catch {
    return 'unreachable';
  } finally {
    clearTimeout(timer);
  }
}

export const DIRECT_MESSAGES: Record<DirectStatus, string> = {
  ok: 'Conectada. Ya puedes usar la IA.',
  bad_key: 'Google o Anthropic no aceptó esa clave. Cópiala de nuevo completa, sin espacios.',
  unreachable: 'No se pudo llegar al proveedor. Revisa tu internet.',
  quota: 'La clave es válida, pero llegó a su límite gratuito por ahora. Espera un momento.',
};

/** Extrae el primer objeto JSON de un texto (quita ``` y texto alrededor). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('sin json');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function buildEnv(model: string): Env {
  return { ANTHROPIC_API_KEY: '', OWNER_ACCESS_CODE: '', MODEL_DEFAULT: model };
}

function schemaText(schema: z.ZodType): string {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return JSON.stringify(json);
}

async function callProvider(provider: DirectProvider, key: string, system: string, messages: { role: 'user' | 'assistant'; content: string }[], maxTokens: number, fetchImpl: typeof fetch): Promise<{ text: string; model: string; inputTokens: number; outputTokens: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let res: Response;
  try {
    if (provider === 'gemini') {
      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: Math.max(maxTokens * 3, 4096) },
      });
      const send = (model: string): Promise<Response> =>
        fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body, signal: controller.signal });
      res = await send(GEMINI_MODEL);
      if (res.status === 404) res = await send(GEMINI_FALLBACK);
    } else {
      res = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: maxTokens, system, messages }),
        signal: controller.signal,
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new AiError('timeout', 'La IA tardó demasiado en responder.');
    throw new AiError('offline', 'No hay conexión con la IA.');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    const msg = body?.error?.message ?? '';
    if (/api key|api_key|credential|authenticat|invalid x-api-key/i.test(msg) || res.status !== 400) throw new AiError('unauthorized', 'La clave de la IA no es válida. Revísala en Perfil > Conectar la IA.');
    throw new AiError('provider_error', 'La IA rechazó la consulta.');
  }
  if (res.status === 429) throw new AiError('rate_limited', 'Llegaste al límite de tu clave por ahora. Espera un momento.');
  if (!res.ok) throw new AiError('provider_error', 'La IA no pudo responder en este momento.');
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    content?: { type: string; text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
    model?: string;
  };
  if (provider === 'gemini') {
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    if (!text) throw new AiError('blocked', 'La IA no pudo responder esa consulta.');
    return { text, model: GEMINI_MODEL, inputTokens: data.usageMetadata?.promptTokenCount ?? 0, outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0 };
  }
  const text = (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
  if (!text) throw new AiError('blocked', 'La IA no pudo responder esa consulta.');
  return { text, model: data.model ?? ANTHROPIC_MODEL, inputTokens: data.usage?.input_tokens ?? 0, outputTokens: data.usage?.output_tokens ?? 0 };
}

export async function runDirectTask<T extends AiTask>(provider: DirectProvider, key: string, task: T, input: TaskInput<T>, fetchImpl: typeof fetch = fetch): Promise<AiResult<T>> {
  const schemas = TASK_SCHEMAS[task];
  const parsedInput = schemas.input.safeParse(input);
  if (!parsedInput.success) throw new AiError('bad_request', 'Los datos de la consulta no son válidos.');
  const spec = buildTaskSpec(task, parsedInput.data, buildEnv(provider === 'gemini' ? GEMINI_MODEL : ANTHROPIC_MODEL));
  const system = `${spec.system}\n\nFORMATO DE SALIDA: responde ÚNICAMENTE con un objeto JSON válido (sin texto antes ni después, sin \`\`\`) que cumpla este esquema JSON: ${schemaText(spec.outputSchema)}`;

  let lastError = 'La IA devolvió una respuesta con formato inválido.';
  let messages = spec.messages;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const reply = await callProvider(provider, key, system, messages, spec.maxTokens, fetchImpl);
    try {
      const output = schemas.output.safeParse(extractJson(reply.text));
      if (output.success) return { output: output.data as TaskOutput<T>, model: reply.model, usage: { inputTokens: reply.inputTokens, outputTokens: reply.outputTokens } };
      lastError = 'La IA devolvió una respuesta con formato inválido.';
    } catch {
      lastError = 'La IA devolvió una respuesta que no se pudo leer.';
    }
    messages = [...spec.messages, { role: 'assistant', content: reply.text.slice(0, 2000) }, { role: 'user', content: 'Tu respuesta no cumplió el formato. Responde de nuevo solo con el JSON que cumple el esquema.' }];
  }
  throw new AiError('bad_output', lastError);
}

/** ¿Parece una clave suelta (sin espacios ni enlace) aunque no reconozcamos el formato? Se probará con ambos proveedores. */
export function looksLikeBareKey(text: string): string | null {
  const t = text.trim();
  return t.length >= 24 && t.length <= 300 && !/\s/.test(t) && !/^https?:/i.test(t) ? t : null;
}
