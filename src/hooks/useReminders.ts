import { useEffect } from 'react';
import { useAppState } from '../context';
import { toISODate } from '../core/dates';
import { refreshReminders } from '../services/reminders';

/**
 * Mantiene al día los recordatorios locales desde la raíz de la app (no solo desde Perfil),
 * para que el aviso de racha nunca llegue después de haber entrenado.
 */
export function useReminders(): void {
  const { state } = useAppState();
  const { remindersEnabled, reminderHour } = state.settings;
  const activeToday = state.gamification.lastActiveDate === toISODate(new Date());
  const streak = state.gamification.streak;
  useEffect(() => {
    void refreshReminders({ enabled: remindersEnabled, hour: reminderHour, activeToday, streak });
  }, [remindersEnabled, reminderHour, activeToday, streak]);
}
