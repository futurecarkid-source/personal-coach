import * as Notifications from 'expo-notifications';

export interface ReminderPlan {
  enabled: boolean;
  /** Hora local (0 a 23) del recordatorio diario. */
  hour: number;
  /** Ya hiciste algo hoy (sesión, check-in o descanso): no se avisa del riesgo de racha. */
  activeToday: boolean;
  streak: number;
}

/** Pide permiso de notificaciones (solo se muestra el aviso del sistema la primera vez). */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Recordatorios locales (no necesitan servidor): uno diario a la hora elegida y, si hoy aún no hiciste nada y tienes racha,
 * un aviso por la noche. Se reprograman cada vez que cambia algo, así nunca avisan de lo que ya hiciste.
 */
export async function refreshReminders(plan: ReminderPlan): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!plan.enabled) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Fulbito', body: '¿Listo para tu sesión de hoy? Son pocos minutos.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: plan.hour, minute: 0 },
    });
    if (!plan.activeToday && plan.streak >= 2) {
      const when = new Date();
      when.setHours(21, 30, 0, 0);
      if (when.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `Tu racha de ${plan.streak} está en juego`, body: 'Con un check-in de un minuto la mantienes.' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
      }
    }
  } catch {
    // Sin permiso o sin soporte: simplemente no hay recordatorios.
  }
}
