import { handleRequest, ModelError, type HandlerDeps, type HttpRequestLike } from '../handler';
import { createMemoryKV } from '../usage';
import type { Env } from '../env';
import { buildTaskSpec } from '../tasks';
import type { TaskInput } from '../../../src/ai/contract';

const env = (patch: Partial<Env> = {}): Env => ({ ANTHROPIC_API_KEY: 'sk-test', OWNER_ACCESS_CODE: 'codigo-dueno', USAGE: createMemoryKV(), ...patch });

const chatInput: TaskInput<'coach_chat'> = {
  persona: 'calmado',
  profile: { position: 'DEL', level: 'amateur', ageBand: 'adulto', daysPerWeek: 3, minutesPerSession: 40, equipment: ['ninguno'], discomfortZones: ['rodilla'] },
  snapshot: { today: '2026-10-08', streak: 2, lastCheckIn: { mood: 6, energy: 5, soreness: 3, zones: [] }, todaySession: null, recentSessions: [], activePain: [] },
  messages: [{ role: 'user', content: '¿Qué hago hoy?' }],
};

const goodOutput = { reply: 'Hoy movilidad suave.', actions: [{ type: 'abrir_plan', label: 'Ver plan' }], needsProfessional: false };

function request(patch: Partial<HttpRequestLike> = {}, body: unknown = { task: 'coach_chat', input: chatInput, consent: true }): HttpRequestLike {
  return { method: 'POST', path: '/v1/run', authorization: 'Bearer codigo-dueno', bodyText: JSON.stringify(body), ...patch };
}

const deps = (callModel: HandlerDeps['callModel'] = async () => ({ output: goodOutput, model: 'claude-opus-5-5', usage: { inputTokens: 100, outputTokens: 50 } })): HandlerDeps => ({
  callModel,
  now: () => new Date('2026-10-08T12:00:00.000Z'),
});

describe('gateway handler', () => {
  it('serves a valid request and returns validated output', async () => {
    const res = await handleRequest(request(), env(), deps());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, task: 'coach_chat', model: 'claude-opus-5-5' });
  });

  it('answers health and rejects unknown routes and methods', async () => {
    expect((await handleRequest(request({ path: '/health', method: 'GET' }), env(), deps())).status).toBe(200);
    expect((await handleRequest(request({ path: '/x' }), env(), deps())).status).toBe(404);
    expect((await handleRequest(request({ method: 'GET' }), env(), deps())).status).toBe(405);
  });

  it('ping checks the access code without calling the model', async () => {
    const ok = await handleRequest(request({ path: '/v1/ping', method: 'GET', authorization: 'Bearer ' + env().OWNER_ACCESS_CODE }), env(), deps());
    expect(ok.status).toBe(200);
    expect((await handleRequest(request({ path: '/v1/ping', method: 'GET', authorization: 'Bearer mal' }), env(), deps())).status).toBe(401);
  });

  it('requires a valid access code', async () => {
    for (const authorization of [null, 'Bearer mal', 'Basic abc']) {
      const res = await handleRequest(request({ authorization }), env(), deps());
      expect(res.status).toBe(401);
    }
    const noOwner = await handleRequest(request(), env({ OWNER_ACCESS_CODE: '' }), deps());
    expect(noOwner.status).toBe(401);
  });

  it('requires consent and a well-formed body', async () => {
    const noConsent = await handleRequest(request({}, { task: 'coach_chat', input: chatInput }), env(), deps());
    expect(noConsent.body).toMatchObject({ error: { code: 'consent_required' } });
    expect((await handleRequest(request({ bodyText: 'no es json' }), env(), deps())).status).toBe(400);
    const badInput = await handleRequest(request({}, { task: 'coach_chat', input: { persona: 'x' }, consent: true }), env(), deps());
    expect(badInput.body).toMatchObject({ error: { code: 'bad_request' } });
    const unknownTask = await handleRequest(request({}, { task: 'ejecutar_codigo', input: {}, consent: true }), env(), deps());
    expect(unknownTask.status).toBe(400);
  });

  it('rejects oversized bodies', async () => {
    const res = await handleRequest(request({ bodyText: 'x'.repeat(70_000) }), env(), deps());
    expect(res.status).toBe(400);
  });

  it('blocks minors without guardian consent', async () => {
    const minor = { ...chatInput, profile: { ...chatInput.profile, ageBand: 'de16a17' as const } };
    const blocked = await handleRequest(request({}, { task: 'coach_chat', input: minor, consent: true }), env(), deps());
    expect(blocked.status).toBe(403);
    const allowed = await handleRequest(request({}, { task: 'coach_chat', input: minor, consent: true, guardianConsent: true }), env(), deps());
    expect(allowed.status).toBe(200);
  });

  it('enforces rate and daily limits', async () => {
    const e = env({ DAILY_LIMIT_OWNER: '3' });
    for (let i = 0; i < 3; i += 1) expect((await handleRequest(request(), e, deps())).status).toBe(200);
    const fourth = await handleRequest(request(), e, deps());
    expect(fourth.status).toBe(429);
    expect(fourth.body).toMatchObject({ error: { code: 'quota_exceeded' } });

    const e2 = env();
    let last = 200;
    for (let i = 0; i < 25; i += 1) last = (await handleRequest(request(), e2, deps())).status;
    expect(last).toBe(429);
  });

  it('maps model errors and invalid model output', async () => {
    const blocked = await handleRequest(request(), env(), deps(async () => { throw new ModelError('blocked', 'x'); }));
    expect(blocked.status).toBe(422);
    const crash = await handleRequest(request(), env(), deps(async () => { throw new Error('boom secret detail'); }));
    expect(crash.status).toBe(502);
    expect(JSON.stringify(crash.body)).not.toMatch(/boom/);
    const wrong = await handleRequest(request(), env(), deps(async () => ({ output: { reply: 1 }, model: 'm', usage: { inputTokens: 0, outputTokens: 0 } })));
    expect(wrong.body).toMatchObject({ error: { code: 'bad_output' } });
  });

  it('never echoes the access code or the content in responses', async () => {
    const res = await handleRequest(request(), env(), deps());
    expect(JSON.stringify(res.body)).not.toMatch(/codigo-dueno|¿Qué hago hoy\?/);
  });
});

describe('task specs', () => {
  it('uses Claude Opus 5.5 by default and allows per-task overrides', () => {
    expect(buildTaskSpec('coach_chat', chatInput, env()).model).toBe('claude-opus-5-5');
    expect(buildTaskSpec('coach_chat', chatInput, env({ MODEL_COACH_CHAT: 'claude-haiku-5-5' })).model).toBe('claude-haiku-5-5');
    expect(buildTaskSpec('coach_chat', chatInput, env({ MODEL_DEFAULT: 'claude-sonnet-5-5' })).model).toBe('claude-sonnet-5-5');
  });

  it('keeps safety rules and the persona in the system prompt, and the data out of the user turn', () => {
    const spec = buildTaskSpec('coach_chat', chatInput, env());
    expect(spec.system).toMatch(/no recomiendas medicamentos/i);
    expect(spec.system).toMatch(/menores de 18/i);
    expect(spec.system).toMatch(/calmado/i);
    expect(spec.messages).toEqual([{ role: 'user', content: '¿Qué hago hoy?' }]);
    expect(spec.effort).toBe('low');
  });

  it('trims chat history to a user-first window of 12 messages', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 === 0 ? ('user' as const) : ('assistant' as const), content: `m${i}` }));
    const spec = buildTaskSpec('coach_chat', { ...chatInput, messages: many }, env());
    expect(spec.messages.length).toBeLessThanOrEqual(12);
    expect(spec.messages[0]?.role).toBe('user');
  });

  it('builds every task without throwing', () => {
    const profile = chatInput.profile;
    const snapshot = chatInput.snapshot;
    expect(buildTaskSpec('weekly_plan', { profile, snapshot, startDate: '2026-10-08', days: 7, matchDates: [], library: [] }, env()).effort).toBe('high');
    expect(buildTaskSpec('pain_followup', { profile, report: { zone: 'rodilla', intensity: 4, kind: 'sordo', daysSinceOnset: 2, canWalk: true, swelling: false }, history: [], question: '' }, env()).maxTokens).toBeGreaterThan(0);
    expect(buildTaskSpec('tactic_explain', { format: 'f11', formation: '4-3-3', rivalFormation: null, tokens: [], drawings: [], question: '' }, env()).system).toMatch(/pizarra/i);
    expect(buildTaskSpec('match_review', { position: 'MC', minutesPlayed: 60, goalsFor: 1, goalsAgainst: 0, selfRating: 7, rpe: 6, stats: { goals: 0, shots: 1, shotsOnTarget: 0, xg: 0.1, passAccuracy: 80, duelsWon: 3, duelsLost: 2, recoveries: 4, losses: 5, coldBlood: null }, drillOptions: [] }, env()).system).toMatch(/drillOptions/);
    expect(buildTaskSpec('scouting_estimate', { profile, selfAssessment: [], goals: [] }, env()).system).toMatch(/25 a 82/);
  });
});
