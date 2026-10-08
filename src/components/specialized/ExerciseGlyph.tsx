import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import type { MovementPattern } from '../../types';
import { Icon, type IconName } from '../common/Icon';

const PATTERN_ICON: Record<MovementPattern, IconName> = {
  sentadilla: 'figure.strengthtraining.traditional',
  bisagra: 'figure.flexibility',
  zancada: 'figure.walk',
  plancha: 'figure.core.training',
  salto: 'figure.jumprope',
  carrera: 'figure.run',
  empuje: 'figure.strengthtraining.functional',
  tiron: 'figure.rower',
  movilidad: 'figure.mind.and.body',
  equilibrio: 'figure.stand',
};

/** Movimiento del ícono según el patrón: sube y baja, avanza, o respira. */
const MOTION: Record<MovementPattern, { dy: number; dx: number; scale: number; ms: number }> = {
  sentadilla: { dy: 14, dx: 0, scale: 0.94, ms: 900 },
  bisagra: { dy: 8, dx: 0, scale: 0.97, ms: 1000 },
  zancada: { dy: 10, dx: 8, scale: 0.96, ms: 900 },
  plancha: { dy: 0, dx: 0, scale: 1.04, ms: 1400 },
  salto: { dy: -22, dx: 0, scale: 1.02, ms: 600 },
  carrera: { dy: -6, dx: 10, scale: 1, ms: 400 },
  empuje: { dy: 10, dx: 0, scale: 0.97, ms: 800 },
  tiron: { dy: 0, dx: -12, scale: 1, ms: 900 },
  movilidad: { dy: 0, dx: 0, scale: 1.06, ms: 1800 },
  equilibrio: { dy: 0, dx: 0, scale: 1.03, ms: 1600 },
};

/**
 * Marcador de animación por patrón de movimiento (una animación reutilizable por patrón).
 * Es un sustituto sencillo: los maniquíes animados originales llegan en la siguiente etapa del contenido.
 */
export function ExerciseGlyph({ pattern, size = 120 }: { pattern: MovementPattern; size?: number }): React.JSX.Element {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  const motion = MOTION[pattern];

  useEffect(() => {
    if (reduce) {
      cancelAnimation(t);
      t.set(0);
      return;
    }
    t.set(withRepeat(withSequence(withTiming(1, { duration: motion.ms, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: motion.ms, easing: Easing.inOut(Easing.quad) })), -1, false));
    return () => cancelAnimation(t);
  }, [motion.ms, reduce, t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: motion.dy * t.value }, { translateX: motion.dx * t.value }, { scale: 1 + (motion.scale - 1) * t.value }],
  }));

  return (
    <View style={[styles.box, { width: size * 1.5, height: size * 1.5, backgroundColor: colors.accentSoft, borderRadius: size }]}>
      <Animated.View style={style}>
        <Icon name={PATTERN_ICON[pattern]} size={size} color={colors.accent} weight="regular" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' } });
