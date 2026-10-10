export interface ParsedLink {
  url: string;
  code: string | null;
}

/**
 * Acepta el "enlace de conexión" que se pega de una sola vez: `https://servicio.workers.dev/#codigo`
 * (también `?codigo=` o `?code=`), o solo la dirección. Así no hay que copiar dos datos por separado.
 */
export function parseConnectionLink(input: string): ParsedLink | null {
  const text = input.trim();
  if (!text) return null;
  const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') return null;
    const hash = decodeURIComponent(u.hash.replace(/^#/, '')).trim();
    const code = hash || u.searchParams.get('codigo') || u.searchParams.get('code');
    return { url: `${u.protocol}//${u.host}`, code: code && code.length > 0 ? code : null };
  } catch {
    return null;
  }
}

export type ConnectionStatus = 'ok' | 'bad_code' | 'unreachable' | 'bad_address';

/** Prueba la conexión sin gastar saldo de IA: el servicio solo comprueba el código y responde. */
export async function pingGateway(url: string, code: string, fetchImpl: typeof fetch = fetch): Promise<ConnectionStatus> {
  const parsed = parseConnectionLink(url);
  if (!parsed) return 'bad_address';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetchImpl(`${parsed.url}/v1/ping`, { headers: { authorization: `Bearer ${code}` }, signal: controller.signal });
    if (res.status === 200) return 'ok';
    if (res.status === 401) return 'bad_code';
    return 'unreachable';
  } catch {
    return 'unreachable';
  } finally {
    clearTimeout(timer);
  }
}

export const CONNECTION_MESSAGES: Record<ConnectionStatus, string> = {
  ok: 'Conectada. Ya puedes usar la IA.',
  bad_code: 'El servicio respondió, pero el código no es correcto. Revisa que lo copiaste completo.',
  unreachable: 'No se pudo llegar al servicio. Revisa la dirección y tu internet.',
  bad_address: 'Esa dirección no parece válida. Debe empezar por https://',
};
