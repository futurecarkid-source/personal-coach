import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { EXERCISE_PHOTOS } from '../../content/exercisePhotos';
import { radii, spacing, useTheme } from '../../theme';
import type { Exercise } from '../../types';
import { AppText } from '../common/AppText';
import { ExerciseFigure } from './ExerciseFigure';

export interface ExerciseMediaProps {
  exercise: Pick<Exercise, 'id' | 'pattern' | 'name'>;
  maxWidth?: number;
}

/**
 * Muestra el ejercicio con fotos reales (dos posiciones que se funden en bucle) si las hay;
 * si no, el maniquí animado propio.
 */
export function ExerciseMedia({ exercise, maxWidth = 320 }: ExerciseMediaProps): React.JSX.Element {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const photos = EXERCISE_PHOTOS[exercise.id];
  const k = useSharedValue(0);

  useEffect(() => {
    if (!photos || reduce) return undefined;
    k.set(withRepeat(withSequence(withDelay(700, withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) })), withDelay(700, withTiming(0, { duration: 500, easing: Easing.inOut(Easing.quad) }))), -1, false));
    return () => cancelAnimation(k);
  }, [photos, reduce, k]);

  const top = useAnimatedStyle(() => ({ opacity: k.get() }));

  if (!photos) return <ExerciseFigure exercise={exercise} maxWidth={maxWidth} />;
  return (
    <View style={[styles.box, { maxWidth, backgroundColor: colors.surfaceStrong }]} accessible accessibilityRole="image" accessibilityLabel={`Fotos del ejercicio ${exercise.name}`}>
      <Image source={photos[0]} style={styles.img} resizeMode="cover" />
      <Animated.Image source={photos[1]} style={[styles.img, styles.over, top]} resizeMode="cover" />
      <View style={styles.credit} pointerEvents="none">
        <AppText variant="caption" style={styles.creditText}>Free Exercise DB · dominio público</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', alignSelf: 'center', aspectRatio: 4 / 3, borderRadius: radii.card, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  over: { position: 'absolute', top: 0, left: 0 },
  credit: { position: 'absolute', right: spacing.sm, bottom: spacing.xs },
  creditText: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
});
