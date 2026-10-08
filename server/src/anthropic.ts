import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { ModelError, type ModelCaller } from './handler';

/**
 * Llamada al modelo con el SDK oficial de Anthropic.
 * - Salida estructurada (`output_config.format`) validada con el esquema de la tarea.
 * - `effort` explícito por tarea (en Claude Opus 5.5 el valor por defecto es `medium`).
 * - Se envía `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`) para reintentar rechazos de seguridad en otro modelo.
 * - Sin `thinking`, `temperature` ni prefill: Claude Opus 5.5 no los admite.
 */
export function createAnthropicCaller(apiKey: string): ModelCaller {
  const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });

  return async (spec) => {
    try {
      const response = await client.beta.messages.parse({
        model: spec.model,
        max_tokens: spec.maxTokens,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: spec.system,
        messages: spec.messages,
        output_config: { effort: spec.effort, format: zodOutputFormat(spec.outputSchema) },
      });

      if (response.stop_reason === 'refusal') throw new ModelError('blocked', 'La IA no pudo responder esa consulta.');
      if (response.stop_reason === 'max_tokens') throw new ModelError('bad_output', 'La respuesta de la IA quedó incompleta.');
      if (response.parsed_output === null || response.parsed_output === undefined) throw new ModelError('bad_output', 'La IA devolvió una respuesta con formato inválido.');

      return {
        output: response.parsed_output,
        model: response.model,
        usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      };
    } catch (error) {
      if (error instanceof ModelError) throw error;
      if (error instanceof Anthropic.RateLimitError) throw new ModelError('rate_limited', 'El proveedor está saturado. Intenta de nuevo en un momento.');
      if (error instanceof Anthropic.AuthenticationError) throw new ModelError('provider_error', 'La clave del proveedor no es válida.');
      if (error instanceof Anthropic.APIConnectionTimeoutError) throw new ModelError('timeout', 'La IA tardó demasiado en responder.');
      if (error instanceof Anthropic.APIError) throw new ModelError('provider_error', 'La IA no pudo responder en este momento.');
      throw new ModelError('provider_error', 'La IA no pudo responder en este momento.');
    }
  };
}
