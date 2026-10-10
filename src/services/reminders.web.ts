export interface ReminderPlan {
  enabled: boolean;
  hour: number;
  activeToday: boolean;
  streak: number;
}

/** En el navegador no hay recordatorios locales. */
export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function refreshReminders(): Promise<void> {
  return undefined;
}
