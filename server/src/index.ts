import { createAnthropicCaller } from './anthropic';
import type { Env } from './env';
import { handleRequest } from './handler';

/** Punto de entrada del Worker de Cloudflare. */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // La app web (PWA) vive en otro dominio, así que el navegador exige estos permisos (CORS). La seguridad la da el código de acceso.
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-max-age': '86400' };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    const bodyText = request.method === 'POST' ? await request.text() : '';
    const result = await handleRequest(
      { method: request.method, path: url.pathname, authorization: request.headers.get('authorization'), bodyText },
      env,
      { callModel: createAnthropicCaller(env.ANTHROPIC_API_KEY) },
    );
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors },
    });
  },
};
