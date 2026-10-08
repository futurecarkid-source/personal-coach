import { useMemo } from 'react';
import { useAppState } from '../context';
import { planDays } from '../core/planner';
import type { PlannedSession } from '../types';
import { useToday } from './useToday';

/** Plan de 7 días a partir de hoy, calculado con las preferencias y el último check-in. */
export function useWeekPlan(): { today: string; week: PlannedSession[]; todaySession: PlannedSession | undefined } {
  const { state } = useAppState();
  const today = useToday();
  const { planPrefs, checkIns } = state;
  const todayCheckIn = checkIns.find((c) => c.date === today) ?? null;
  const week = useMemo(
    () => planDays({ ...planPrefs, startDate: today, days: 7, latestCheckIn: todayCheckIn }),
    [planPrefs, today, todayCheckIn],
  );
  return { today, week, todaySession: week[0] };
}
