import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radii, spacing, useTheme } from '../../theme';
import type { Exercise } from '../../types';
import { AppText } from '../common/AppText';
import { EQUIPMENT_LABELS } from '../../content/attributeLabels';
import { Icon, type IconName } from '../common/Icon';

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

const styles = StyleSheet.create({
  badgeBox: { width: '100%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radii.card, padding: spacing.md },
  badgeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { flex: 1, gap: 2 },
});
