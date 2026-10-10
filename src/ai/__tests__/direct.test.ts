import { detectKey, extractJson, pingDirect, runDirectTask } from '../direct';

const input = {
  persona: 'motivador' as const,
  profile: { position: 'MC' as const, level: 'amateur' as const, ageBand: 'adulto' as const, daysPerWeek: 3, minutesPerSession: 40, equipment: ['ninguno' as const], discomfortZones: [] },
  snapshot: { today: '2026-10-10', streak: 2, lastCheckIn: null, todaySession: null, recentSessions: [], activePain: [] },
  messages: [{ role: 'user' as const, content: 'Hola' }],
};

const reply = (status: number, body: unknown): typeof fetch => (async () => ({ status, ok: status < 300, json: async () => body }) as Response) as unknown as typeof fetch;

describe('detectKey', () => {
  it('encuentra la clave de Google aunque venga en un enlace', () => {
    const k = 'AIzaSyA1234567890abcdefghijklmnopqrstuv';
    expect(detectKey(`https://aistudio.google.com/apikey#${k}`)).toEqual({ provider: 'gemini', key: k });
    expect(detectKey('mi clave sk-ant-api03-abcdefghijklmnopqrstuvwx')?.provider).toBe('anthropic');
    expect(detectKey('hola')).toBeNull();
  });
});

describe('extractJson', () => {
  it('quita cercas de código y texto alrededor', () => {
    expect(extractJson('Claro:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(() => extractJson('nada')).toThrow();
  });
});

describe('pingDirect', () => {
  it('traduce los códigos', async () => {
    expect(await pingDirect('gemini', 'k', reply(200, {}))).toBe('ok');
    expect(await pingDirect('gemini', 'k', reply(400, {}))).toBe('bad_key');
    expect(await pingDirect('gemini', 'k', reply(429, {}))).toBe('quota');
    expect(await pingDirect('anthropic', 'k', reply(401, {}))).toBe('bad_key');
    expect(await pingDirect('gemini', 'k', (async () => { throw new Error('x'); }) as unknown as typeof fetch)).toBe('unreachable');
  });
});

describe('runDirectTask', () => {
  const good = { reply: 'Vamos', actions: [], needsProfessional: false };
  it('Gemini: lee el JSON de la respuesta', async () => {
    const f = reply(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(good) }] } }], usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 7 } });
    const r = await runDirectTask('gemini', 'k', 'coach_chat', input, f);
    expect(r.output).toEqual(good);
    expect(r.usage).toEqual({ inputTokens: 5, outputTokens: 7 });
  });
  it('Anthropic: lee el bloque de texto', async () => {
    const f = reply(200, { content: [{ type: 'text', text: '```json\n' + JSON.stringify(good) + '\n```' }], usage: { input_tokens: 1, output_tokens: 2 }, model: 'm' });
    expect((await runDirectTask('anthropic', 'k', 'coach_chat', input, f)).output).toEqual(good);
  });
  it('clave mala → error de acceso; formato malo dos veces → bad_output', async () => {
    await expect(runDirectTask('gemini', 'k', 'coach_chat', input, reply(403, { error: { message: 'API key not valid' } }))).rejects.toMatchObject({ code: 'unauthorized' });
    const bad = reply(200, { candidates: [{ content: { parts: [{ text: '{"x":1}' }] } }] });
    await expect(runDirectTask('gemini', 'k', 'coach_chat', input, bad)).rejects.toMatchObject({ code: 'bad_output' });
  });
});
