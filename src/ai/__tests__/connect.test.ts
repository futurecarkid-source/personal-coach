import { parseConnectionLink, pingGateway } from '../connect';

describe('parseConnectionLink', () => {
  it('separa dirección y código del enlace', () => {
    expect(parseConnectionLink('https://dorsal.ejemplo.workers.dev/#abc123')).toEqual({ url: 'https://dorsal.ejemplo.workers.dev', code: 'abc123' });
    expect(parseConnectionLink('dorsal.ejemplo.workers.dev?codigo=xyz')).toEqual({ url: 'https://dorsal.ejemplo.workers.dev', code: 'xyz' });
  });
  it('acepta solo la dirección y rechaza basura', () => {
    expect(parseConnectionLink('https://a.b.dev/')).toEqual({ url: 'https://a.b.dev', code: null });
    expect(parseConnectionLink('hola')).toBeNull();
    expect(parseConnectionLink('')).toBeNull();
  });
});

describe('pingGateway', () => {
  const resp = (status: number): typeof fetch => (async () => ({ status }) as Response) as unknown as typeof fetch;
  it('traduce el resultado', async () => {
    expect(await pingGateway('https://a.b.dev', 'c', resp(200))).toBe('ok');
    expect(await pingGateway('https://a.b.dev', 'c', resp(401))).toBe('bad_code');
    expect(await pingGateway('https://a.b.dev', 'c', resp(500))).toBe('unreachable');
    expect(await pingGateway('nada', 'c', resp(200))).toBe('bad_address');
    expect(await pingGateway('https://a.b.dev', 'c', (async () => { throw new Error('x'); }) as unknown as typeof fetch)).toBe('unreachable');
  });
});
