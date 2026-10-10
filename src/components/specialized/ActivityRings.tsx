import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { springs, spacing, useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { GlassCard } from '../common/GlassCard';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 132;
const STROKE = 14;
const GAP = 3;

export interface RingSpec {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

function Ring({ index, spec, track }: { index: number; spec: RingSpec; track: string }): React.JSX.Element {
  const r = (SIZE - STROKE) / 2 - index * (STROKE + GAP);
  const c = 2 * Math.PI * r;
  const progress = useSharedValue(0);
  const fraction = Math.max(0, Math.min(1, spec.goal > 0 ? spec.value / spec.goal : 0));
  useEffect(() => {
    progress.set(withDelay(index * 120, withSpring(fraction, springs.smooth)));
  }, [fraction, index, progress]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - progress.get()) }));
  return (
    <>
      <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={track} strokeWidth={STROKE} fill="none" />
      <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={spec.color} strokeWidth={STROKE} strokeLinecap="round" fill="none" strokeDasharray={`${c} ${c}`} animatedProps={props} transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} />
    </>
  );
}

/** Círculo de actividad del día, como en Apple Fitness: tres anillos que se cierran con lo que haces hoy. */
export function ActivityRings({ rings, title = 'Círculo de hoy' }: { rings: readonly [RingSpec, RingSpec, RingSpec]; title?: string }): React.JSX.Element {
  const { colors, isDark } = useTheme();
  return (
    <GlassCard>
      <AppText variant="headline">{title}</AppText>
      <View style={styles.row}>
        <View accessible accessibilityLabel={rings.map((r) => `${r.label} ${r.value} de ${r.goal} ${r.unit}`).join('. ')}>
          <Svg width={SIZE} height={SIZE}>
            {rings.map((spec, i) => (
              <Ring key={spec.label} index={i} spec={spec} track={isDark ? `${spec.color}33` : `${spec.color}2B`} />
            ))}
          </Svg>
        </View>
        <View style={styles.legend}>
          {rings.map((spec) => (
            <View key={spec.label}>
              <AppText variant="caption" tone="secondary">{spec.label}</AppText>
              <AppText variant="title" style={{ color: spec.color }}>
                {spec.value}/{spec.goal}
                <AppText variant="caption" style={{ color: spec.color }}> {spec.unit}</AppText>
              </AppText>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.sep, { backgroundColor: colors.separator }]} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.md },
  legend: { flex: 1, gap: spacing.sm },
  sep: { height: 0 },
});
