import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WATER_GOAL } from '../../core/progression';
import { haptics, spacing, useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { GlassCard } from '../common/GlassCard';
import { HapticTouch } from '../common/HapticTouch';
import { Icon } from '../common/Icon';

const DROPS = 8;

/** Hidratación del día: toca una gota para marcar cuántos vasos llevas. */
export function HydrationCard({ glasses, onChange }: { glasses: number; onChange: (glasses: number) => void }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <GlassCard>
      <View style={styles.head}>
        <AppText variant="label" tone="secondary">Hidratación</AppText>
        <AppText variant="callout" tone="secondary">{glasses} vasos · meta {WATER_GOAL}</AppText>
      </View>
      <View style={styles.row}>
        {Array.from({ length: DROPS }, (_, i) => {
          const filled = i < glasses;
          return (
            <HapticTouch
              key={i}
              haptic="none"
              pressedScale={0.88}
              accessibilityLabel={`Vaso ${i + 1}`}
              accessibilityState={{ selected: filled }}
              onPress={() => {
                haptics.selection();
                onChange(filled && i === glasses - 1 ? i : i + 1);
              }}
            >
              <Icon name="drop.fill" size={30} color={filled ? colors.deepBlue : colors.surfaceStrong} />
            </HapticTouch>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
});
