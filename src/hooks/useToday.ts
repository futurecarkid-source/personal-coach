import { useMemo } from 'react';
import { toISODate } from '../core/dates';

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria del dispositivo. */
export function useToday(): string {
  return useMemo(() => toISODate(new Date()), []);
}
