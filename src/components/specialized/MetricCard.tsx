import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { GlassCard } from '../common/GlassCard';

export interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  color: string;
  /** Últimos 7 días, de más antiguo a más reciente. */
  bars: readonly number[];
  footnote?: string;
}

/** Tarjeta de métrica estilo Apple Fitness: título de color, número grande y mini barras de la semana. */
export function MetricCard({ title, value, unit, color, bars, footnote }: MetricCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const max = Math.max(1, ...bars);
  return (
    <GlassCard padding={spacing.md} style={styles.card}>
      <AppText variant="headline">{title}</AppText>
      <AppText variant="caption" tone="secondary">{footnote ?? 'Últimos 7 días'}</AppText>
      <View style={styles.valueRow}>
        <AppText variant="digits" style={{ color }}>{value}</AppText>
        <AppText variant="callout" style={{ color }}> {unit}</AppText>
      </View>
      <View style={styles.bars} accessible accessibilityLabel={`${title}: ${bars.join(', ')}`}>
        {bars.map((b, i) => (
          <View key={i} style={styles.barSlot}>
            <View style={[styles.bar, { height: Math.max(3, Math.round((b / max) * 44)), backgroundColor: b > 0 ? color : colors.separator, opacity: b > 0 ? 0.35 + 0.65 * (i / Math.max(1, bars.length - 1)) : 1 }]} />
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 48, marginTop: spacing.sm },
  barSlot: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
});
