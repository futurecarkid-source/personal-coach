import { useMemo } from 'react';
import { effectiveDiscomfortZones } from '../ai/context';
import { mergeAiPlan } from '../ai/mergePlan';
import { useAppState } from '../context';
import { feelsBad, planDays } from '../core/planner';
import type { PlannedSession } from '../types';
import { useReadiness } from './useReadiness';
import { useToday } from './useToday';

/**
 * Plan de 7 días a partir de hoy. Base: plan por reglas (según preferencias, molestias, dolores activos y partidos).
 * Si hay un plan de IA vigente y validado, se usa día a día, siempre revisado contra las molestias actuales.
 */
export function useWeekPlan(): { today: string; week: PlannedSession[]; todaySession: PlannedSession | undefined; usingAi: boolean } {
  const { state } = useAppState();
  const today = useToday();
  const { planPrefs, checkIns, painReports, aiPlan } = state;
  const todayCheckIn = checkIns.find((c) => c.date === today) ?? null;
  const readiness = useReadiness();
  const forceRecovery = readiness.level === 'descansa' && readiness.confidence !== 'baja';

  return useMemo(() => {
    const zones = effectiveDiscomfortZones({ planPrefs, painReports });
    const rules = planDays({ ...planPrefs, discomfortZones: zones, startDate: today, days: 7, latestCheckIn: todayCheckIn, forceRecovery });
    const week = mergeAiPlan(rules, aiPlan, zones, feelsBad(todayCheckIn) || forceRecovery);
    const usingAi = aiPlan !== null && week.some((s, i) => s !== rules[i]);
    return { today, week, todaySession: week[0], usingAi };
  }, [planPrefs, painReports, aiPlan, today, todayCheckIn, forceRecovery]);
}
