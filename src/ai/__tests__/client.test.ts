import { AiError, describeAiError, runAiTask } from '../client';
import type { TaskInput } from '../contract';

const input: TaskInput<'coach_chat'> = {
  persona: 'motivador',
  profile: { position: 'MC', level: 'amateur', ageBand: 'adulto', daysPerWeek: 3, minutesPerSession: 40, equipment: ['ninguno'], discomfortZones: [] },
  snapshot: { today: '2026-10-08', streak: 3, lastCheckIn: null, todaySession: null, recentSessions: [], activePain: [] },
  messages: [{ role: 'user', content: 'Hola' }],
};

const okBody = { ok: true, task: 'coach_chat', output: { reply: 'Hola, vamos.', actions: [], needsProfessional: false }, model: 'claude-opus-5-5', usage: { inputTokens: 10, outputTokens: 5 } };

const jsonResponse = (body: unknown): Response => ({ json: async () => body }) as unknown as Response;

describe('runAiTask', () => {
  it('posts the task with the access code and validates the output', async () => {
    const fetchImpl = jest.fn(async () => jsonResponse(okBody)) as unknown as typeof fetch;
    const result = await runAiTask({ baseUrl: 'https://gw.example/', accessCode: 'secret', fetchImpl }, 'coach_chat', input);
    expect(result.output.reply).toBe('Hola, vamos.');
    expect(result.usage.outputTokens).toBe(5);
    const call = (fetchImpl as unknown as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('https://gw.example/v1/run');
    expect((call[1].headers as Record<string, string>).authorization).toBe('Bearer secret');
    expect(JSON.parse(call[1].body as string)).toMatchObject({ task: 'coach_chat', consent: true });
  });

  it('maps gateway errors to typed codes', async () => {
    const fetchImpl = (async () => jsonResponse({ ok: false, error: { code: 'quota_exceeded', message: 'x' } })) as unknown as typeof fetch;
    await expect(runAiTask({ baseUrl: 'https://gw.example', accessCode: 's', fetchImpl }, 'coach_chat', input)).rejects.toMatchObject({ code: 'quota_exceeded' });
  });

  it('reports offline and invalid output', async () => {
    const down = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(runAiTask({ baseUrl: 'https://gw.example', accessCode: 's', fetchImpl: down }, 'coach_chat', input)).rejects.toMatchObject({ code: 'offline' });
    const bad = (async () => jsonResponse({ ...okBody, output: { reply: 123 } })) as unknown as typeof fetch;
    await expect(runAiTask({ baseUrl: 'https://gw.example', accessCode: 's', fetchImpl: bad }, 'coach_chat', input)).rejects.toMatchObject({ code: 'bad_output' });
  });

  it('rejects invalid input before the network', async () => {
    const fetchImpl = jest.fn() as unknown as typeof fetch;
    await expect(runAiTask({ baseUrl: 'https://gw.example', accessCode: 's', fetchImpl }, 'coach_chat', { ...input, messages: [] })).rejects.toMatchObject({ code: 'bad_request' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('describes errors in friendly Spanish', () => {
    expect(describeAiError(new AiError('offline', 'x'))).toMatch(/internet/);
    expect(describeAiError(new Error('x'))).toMatch(/salió mal/);
  });
});
