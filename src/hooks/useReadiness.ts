import { useMemo } from 'react';
import { useAppState } from '../context';
import { computeReadiness, type Readiness } from '../core/readiness';
import { isMinor } from '../types';
import { useToday } from './useToday';

/** Preparación de hoy con los datos guardados: bienestar, carga (ACWR), sueño y dolor. */
export function useReadiness(): Readiness {
  const { state } = useAppState();
  const today = useToday();
  const { sessionLogs, checkIns, sleepLogs, painReports, settings, player } = state;
  return useMemo(() => {
    const active = painReports.filter((r) => r.status === 'activo');
    return computeReadiness({
      today,
      logs: sessionLogs,
      checkIn: checkIns.find((c) => c.date === today) ?? null,
      sleepHours: sleepLogs.find((l) => l.date === today)?.hours ?? null,
      blockingPain: active.some((r) => r.level !== 'ok' && !r.clearedByProfessional),
      activePain: active.some((r) => (r.followUps[r.followUps.length - 1]?.intensity ?? r.intensity) > 3),
      sensitivity: settings.readinessSensitivity,
      minor: player ? isMinor(player.ageBand) : false,
    });
  }, [today, sessionLogs, checkIns, sleepLogs, painReports, settings.readinessSensitivity, player]);
}
