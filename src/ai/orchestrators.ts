import { EXERCISES } from '../content/exercises';
import { summarizeMatch } from '../core/matchStats';
import { planDays } from '../core/planner';
import { addDays } from '../core/dates';
import type { AiPlan, AppState, AttributeKey, Attributes, Match, PlannedSession, Player } from '../types';
import { AiError, runAiTask, type GatewayConfig } from './client';
import {
  type CoachChatOutput,
  type MatchReviewOutput,
  type PainFollowupOutput,
  type ScoutingEstimateOutput,
  type TacticExplainOutput,
  type TaskInput,
} from './contract';
import { buildLibrary, buildProfileContext, buildSnapshot, effectiveDiscomfortZones } from './context';
import { toAiPlan, validateAiPlan } from './planValidator';
import { clip, sanitizeReply } from './safety';

export const PLAN_DAYS = 7;

/** Genera un plan con IA y lo valida; si no cumple las reglas de seguridad lo rechaza (se mantiene el plan por reglas). */
export async function requestAiPlan(
  config: GatewayConfig,
  state: AppState,
  today: string,
  todaySession: PlannedSession | undefined,
  nowISO: string,
): Promise<{ plan: AiPlan; model: string }> {
  const profile = buildProfileContext(state);
  if (!profile) throw new AiError('bad_request', 'Falta tu perfil.');
  const zones = effectiveDiscomfortZones(state);
  const library = buildLibrary(profile.equipment, zones);
  const input: TaskInput<'weekly_plan'> = {
    profile,
    snapshot: buildSnapshot(state, today, todaySession),
    startDate: today,
    days: PLAN_DAYS,
    matchDates: state.planPrefs.matchDates.filter((d) => d >= today && d <= addDays(today, PLAN_DAYS - 1)),
    library,
  };
  const rules = {
    startDate: today,
    days: PLAN_DAYS,
    allowedIds: new Set(library.map((l) => l.id)),
    discomfortZones: zones,
    matchDates: input.matchDates,
    daysPerWeek: profile.daysPerWeek,
    minutesPerSession: profile.minutesPerSession,
  };

  let lastReasons: string[] = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await runAiTask(config, 'weekly_plan', input);
    const verdict = validateAiPlan(result.output, rules);
    if (verdict.ok) return { plan: toAiPlan(verdict.sessions, result.output.rationale, nowISO), model: result.model };
    lastReasons = verdict.reasons;
  }
  throw new AiError('bad_output', `La IA propuso un plan que no cumple las reglas de seguridad (${lastReasons[0] ?? 'sin detalle'}). Se mantiene tu plan por reglas.`);
}

export interface CoachTurn {
  reply: string;
  needsProfessional: boolean;
  actions: CoachChatOutput['actions'];
  replacedMedication: boolean;
}

export async function askCoach(config: GatewayConfig, input: TaskInput<'coach_chat'>): Promise<CoachTurn> {
  const result = await runAiTask(config, 'coach_chat', input);
  const clean = sanitizeReply(result.output.reply);
  return {
    reply: clean.text,
    needsProfessional: result.output.needsProfessional || clean.replaced,
    actions: result.output.actions.filter((a) => a.type !== 'ninguna').slice(0, 3).map((a) => ({ type: a.type, label: clip(a.label, 40) })),
    replacedMedication: clean.replaced,
  };
}

const LEVEL_RANK = { seguir: 0, moderar: 1, descansar: 2, consultar: 3 } as const;

/** Combina el nivel local y el de la IA: la IA solo puede subir la cautela, nunca bajarla. */
export function mergePainLevel(local: 'ok' | 'consulta' | 'urgencias', ai: PainFollowupOutput['level']): PainFollowupOutput['level'] {
  const localLevel: PainFollowupOutput['level'] = local === 'ok' ? 'seguir' : 'consultar';
  return LEVEL_RANK[ai] >= LEVEL_RANK[localLevel] ? ai : localLevel;
}

export async function askPainFollowup(config: GatewayConfig, input: TaskInput<'pain_followup'>, localLevel: 'ok' | 'consulta' | 'urgencias'): Promise<PainFollowupOutput> {
  const result = await runAiTask(config, 'pain_followup', input);
  const summary = sanitizeReply(result.output.summary, 600);
  return {
    summary: summary.text,
    tips: result.output.tips.slice(0, 5).map((t) => sanitizeReply(t, 240)).filter((t) => !t.replaced).map((t) => t.text),
    questions: result.output.questions.slice(0, 3).map((q) => clip(q, 160)),
    level: mergePainLevel(localLevel, summary.replaced ? 'consultar' : result.output.level),
  };
}

export async function explainTactic(config: GatewayConfig, input: TaskInput<'tactic_explain'>): Promise<TacticExplainOutput> {
  const result = await runAiTask(config, 'tactic_explain', input);
  const clean = (list: string[], max: number): string[] => list.slice(0, 5).map((s) => clip(s, max)).filter((s) => s.length > 0);
  return {
    explanation: clip(result.output.explanation, 900),
    strengths: clean(result.output.strengths, 200),
    risks: clean(result.output.risks, 200),
    suggestions: clean(result.output.suggestions, 220),
  };
}

export async function reviewMatch(config: GatewayConfig, match: Match, player: Player): Promise<MatchReviewOutput> {
  const s = summarizeMatch(match.events);
  const drillOptions = EXERCISES.filter((e) => ['prevencion', 'tecnica', 'agilidad', 'velocidad', 'resistencia', 'fuerza'].includes(e.category)).map((e) => ({ id: e.id, name: e.name }));
  const result = await runAiTask(config, 'match_review', {
    position: player.position,
    minutesPlayed: match.minutesPlayed,
    goalsFor: match.goalsFor,
    goalsAgainst: match.goalsAgainst,
    selfRating: match.selfRating,
    rpe: match.rpe,
    stats: {
      goals: s.goals,
      shots: s.shots,
      shotsOnTarget: s.shotsOnTarget,
      xg: s.xg,
      passAccuracy: s.passAccuracy,
      duelsWon: s.duelsWon,
      duelsLost: s.duelsLost,
      recoveries: s.recoveries,
      losses: s.losses,
      coldBlood: s.coldBlood,
    },
    drillOptions,
  });
  const valid = new Set(drillOptions.map((d) => d.id));
  return {
    headline: clip(result.output.headline, 140),
    positives: result.output.positives.slice(0, 4).map((t) => clip(t, 200)),
    toImprove: result.output.toImprove.slice(0, 4).map((t) => clip(t, 200)),
    drills: result.output.drills.filter((id) => valid.has(id)).slice(0, 3),
  };
}

const ESTIMATE_MIN = 25;
const ESTIMATE_MAX = 82;

/** Convierte la estimación de la IA en atributos "estimado", acotados y solo con claves válidas. */
export function estimatesToAttributes(output: ScoutingEstimateOutput, validKeys: readonly string[]): Attributes {
  const result: Attributes = {};
  for (const { key, value } of output.attributes) {
    if (!validKeys.includes(key) || !Number.isFinite(value)) continue;
    result[key as AttributeKey] = { value: Math.round(Math.max(ESTIMATE_MIN, Math.min(ESTIMATE_MAX, value))), source: 'estimado' };
  }
  return result;
}

export async function refineScouting(config: GatewayConfig, state: AppState): Promise<Attributes> {
  const profile = buildProfileContext(state);
  const player = state.player;
  if (!profile || !player) throw new AiError('bad_request', 'Falta tu perfil.');
  const selfAssessment = Object.entries(player.selfAssessment).map(([key, score]) => ({ key, score }));
  const result = await runAiTask(config, 'scouting_estimate', { profile, selfAssessment, goals: state.planPrefs.goals });
  return estimatesToAttributes(result.output, Object.keys(player.attributes));
}

/** Plan por reglas de respaldo (si la IA falla). */
export function rulesWeek(state: AppState, today: string): PlannedSession[] {
  return planDays({ ...state.planPrefs, discomfortZones: effectiveDiscomfortZones(state), startDate: today, days: PLAN_DAYS, latestCheckIn: state.checkIns.find((c) => c.date === today) ?? null });
}

