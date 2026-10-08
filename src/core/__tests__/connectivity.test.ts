import { onlineStatus } from '../connectivity';

const now = new Date('2026-10-08T12:00:00Z');
const ago = (h: number): string => new Date(now.getTime() - h * 3_600_000).toISOString();

describe('onlineStatus', () => {
  it('has no limit without a configured service', () => {
    expect(onlineStatus({ gatewayUrl: '', lastOnlineAt: ago(500), now }).status).toBe('sin_servicio');
  });
  it('is ok when never checked or recent', () => {
    expect(onlineStatus({ gatewayUrl: 'https://g', lastOnlineAt: null, now }).status).toBe('ok');
    expect(onlineStatus({ gatewayUrl: 'https://g', lastOnlineAt: ago(10), now }).status).toBe('ok');
  });
  it('warns from 48h and blocks at 72h', () => {
    expect(onlineStatus({ gatewayUrl: 'https://g', lastOnlineAt: ago(50), now })).toMatchObject({ status: 'aviso' });
    expect(onlineStatus({ gatewayUrl: 'https://g', lastOnlineAt: ago(72), now }).status).toBe('bloqueado');
  });
  it('ignores an invalid date', () => {
    expect(onlineStatus({ gatewayUrl: 'https://g', lastOnlineAt: 'x', now }).status).toBe('ok');
  });
});
