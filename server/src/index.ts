import { createAnthropicCaller } from './anthropic';
import type { Env } from './env';
import { handleRequest } from './handler';

/** Punto de entrada del Worker de Cloudflare. */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const bodyText = request.method === 'POST' ? await request.text() : '';
    const result = await handleRequest(
      { method: request.method, path: url.pathname, authorization: request.headers.get('authorization'), bodyText },
      env,
      { callModel: createAnthropicCaller(env.ANTHROPIC_API_KEY) },
    );
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  },
};
