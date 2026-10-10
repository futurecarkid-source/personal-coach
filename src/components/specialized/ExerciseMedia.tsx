import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { EXERCISE_PHOTOS } from '../../content/exercisePhotos';
import { radii, spacing, useTheme } from '../../theme';
import type { Exercise } from '../../types';
import { AppText } from '../common/AppText';
import { EQUIPMENT_LABELS } from '../../content/attributeLabels';
import { Icon, type IconName } from '../common/Icon';

/**
 * Las fotos de Free Exercise DB son de distintas personas y gimnasios, lo que se ve poco uniforme.
 * Se dejan apagadas hasta tener clips propios con la misma persona y fondo; para encenderlas, poner true.
 */
const USE_STOCK_PHOTOS = false;

const CATEGORY: Record<Exercise['category'], { icon: IconName; label: string }> = {
  prevencion: { icon: 'shield.fill', label: 'Prevención' },
  fuerza: { icon: 'dumbbell.fill', label: 'Fuerza' },
  potencia: { icon: 'bolt.fill', label: 'Potencia' },
  velocidad: { icon: 'bolt.fill', label: 'Velocidad' },
  agilidad: { icon: 'figure.run', label: 'Agilidad' },
  resistencia: { icon: 'heart.text.square.fill', label: 'Resistencia' },
  movilidad: { icon: 'wind', label: 'Movilidad' },
  tecnica: { icon: 'soccerball', label: 'Técnica' },
  coordinacion: { icon: 'target', label: 'Coordinación' },
  core: { icon: 'figure.core.training', label: 'Core' },
  calentamiento: { icon: 'flame.fill', label: 'Calentamiento' },
  vueltaCalma: { icon: 'leaf.fill', label: 'Vuelta a la calma' },
  recuperacion: { icon: 'moon.fill', label: 'Recuperación' },
};

export interface ExerciseMediaProps {
  exercise: Pick<Exercise, 'id' | 'pattern' | 'name'> & Partial<Pick<Exercise, 'category' | 'equipment'>>;
  maxWidth?: number;
}

/**
 * Cabecera del ejercicio: con fotos reales si se activan; por ahora, una ficha limpia con la categoría y el equipo
 * (sin muñeco: los pasos escritos son la guía).
 */
export function ExerciseMedia({ exercise, maxWidth = 320 }: ExerciseMediaProps): React.JSX.Element {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const photos = USE_STOCK_PHOTOS ? EXERCISE_PHOTOS[exercise.id] : undefined;
  const k = useSharedValue(0);

  useEffect(() => {
    if (!photos || reduce) return undefined;
    k.set(withRepeat(withSequence(withDelay(700, withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) })), withDelay(700, withTiming(0, { duration: 500, easing: Easing.inOut(Easing.quad) }))), -1, false));
    return () => cancelAnimation(k);
  }, [photos, reduce, k]);

  const top = useAnimatedStyle(() => ({ opacity: k.get() }));

  if (!photos) {
    const cat = exercise.category ? CATEGORY[exercise.category] : null;
    const gear = (exercise.equipment ?? []).filter((e) => e !== 'ninguno').map((e) => EQUIPMENT_LABELS[e]).join(' · ');
    return (
      <View style={[styles.badgeBox, { maxWidth, backgroundColor: colors.surfaceStrong }]} accessible accessibilityLabel={`${exercise.name}. ${cat?.label ?? ''}`}>
        <View style={[styles.badgeIcon, { backgroundColor: colors.pitch }]}>
          <Icon name={cat?.icon ?? 'figure.run'} size={30} color="#FFFFFF" />
        </View>
        <View style={styles.badgeText}>
          <AppText variant="headline">{cat?.label ?? 'Ejercicio'}</AppText>
          <AppText variant="caption" tone="secondary">{gear || 'Sin equipo'}</AppText>
        </View>
      </View>
    );
  }
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
  badgeBox: { width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.card, padding: spacing.md },
  badgeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { flex: 1, gap: 2 },
  box: { width: '100%', alignSelf: 'center', aspectRatio: 4 / 3, borderRadius: radii.card, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  over: { position: 'absolute', top: 0, left: 0 },
  credit: { position: 'absolute', right: spacing.sm, bottom: spacing.xs },
  creditText: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
});
