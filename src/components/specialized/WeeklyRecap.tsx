import React from 'react';
import { StyleSheet, View } from 'react-native';
import { addDays } from '../../core/dates';
import { WATER_GOAL } from '../../core/progression';
import { spacing, useTheme } from '../../theme';
import type { AppState } from '../../types';
import { AppText } from '../common/AppText';
import { GlassCard } from '../common/GlassCard';
import { Icon, type IconName } from '../common/Icon';

/** Resumen de los últimos 7 días (se muestra domingo y lunes, el momento natural para mirar atrás). */
export function WeeklyRecap({ state, today }: { state: AppState; today: string }): React.JSX.Element | null {
  const { colors } = useTheme();
  const from = addDays(today, -6);
  const inWeek = (d: string): boolean => d >= from && d <= today;
  const logs = state.sessionLogs.filter((l) => inWeek(l.date));
  const minutes = Math.round(logs.reduce((n, l) => n + l.durationSeconds, 0) / 60);
  const checkIns = state.checkIns.filter((c) => inWeek(c.date)).length;
  const water = state.waterLogs.filter((w) => inWeek(w.date) && w.glasses >= WATER_GOAL).length;
  if (logs.length === 0 && checkIns === 0) return null;

  const items: { icon: IconName; value: string; label: string }[] = [
    { icon: 'figure.run', value: String(logs.length), label: logs.length === 1 ? 'sesión' : 'sesiones' },
    { icon: 'bolt.fill', value: String(minutes), label: 'minutos' },
    { icon: 'heart.text.square.fill', value: String(checkIns), label: 'check-ins' },
    { icon: 'drop.fill', value: String(water), label: 'días de agua' },
  ];
  const headline = logs.length >= 3 ? '¡Gran semana!' : logs.length >= 1 ? 'Buen avance' : 'Semana tranquila';
  return (
    <GlassCard>
      <AppText variant="label" tone="secondary">Tu semana en resumen</AppText>
      <AppText variant="title" style={styles.title}>{headline}</AppText>
      <View style={styles.grid}>
        {items.map((it) => (
          <View key={it.label} style={styles.cell}>
            <Icon name={it.icon} size={18} color={colors.pitch} />
            <AppText variant="digits">{it.value}</AppText>
            <AppText variant="caption" tone="secondary">{it.label}</AppText>
          </View>
        ))}
      </View>
      <AppText variant="callout" tone="secondary">Racha actual: {state.gamification.streak} · mejor racha: {state.gamification.bestStreak}</AppText>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.md },
  cell: { alignItems: 'center', flex: 1, gap: 2 },
});
