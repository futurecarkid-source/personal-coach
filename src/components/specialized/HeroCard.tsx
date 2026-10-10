import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { levelProgress } from '../../core/gamification';
import { nextRank, rankFor } from '../../core/progression';
import { haptics, radii, spacing, useTheme } from '../../theme';
import type { Gamification } from '../../types';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { ProgressBar } from '../common/ProgressBar';

/**
 * Tarjeta principal del juego: rango, nivel, XP hacia el siguiente nivel y racha.
 * Es oscura a propósito (como el marcador de un estadio) para que destaque sobre el resto.
 */
export function HeroCard({ gamification, weekly, achievementCount, onPress }: { gamification: Gamification; weekly: boolean; achievementCount: number; onPress: () => void }): React.JSX.Element {
  const { colors } = useTheme();
  const progress = levelProgress(gamification.xp);
  const rank = rankFor(progress.level);
  const upcoming = nextRank(progress.level);
  const unit = weekly ? (gamification.streak === 1 ? 'semana' : 'semanas') : gamification.streak === 1 ? 'día' : 'días';
  const needed = progress.next - gamification.xp;

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${rank.name}, nivel ${progress.level}, racha de ${gamification.streak} ${unit}. Toca para ver tus logros.`}
      style={({ pressed }) => [styles.press, pressed && styles.pressed]}
    >
      <LinearGradient colors={[colors.heroTop, colors.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.top}>
          <View style={styles.flex}>
            <AppText variant="label" style={styles.dim}>Rango</AppText>
            <AppText variant="largeTitle" style={styles.white}>{rank.name}</AppText>
            <AppText variant="callout" style={styles.dim}>Nivel {progress.level}</AppText>
          </View>
          <View style={[styles.streak, { backgroundColor: colors.volt }]}>
            <Icon name="flame.fill" size={22} color="#FFFFFF" />
            <AppText variant="digits" style={styles.white}>{gamification.streak}</AppText>
            <AppText variant="label" style={styles.white}>{unit}</AppText>
          </View>
        </View>
        <View style={styles.bar}>
          <ProgressBar fraction={progress.fraction} height={10} color={colors.volt} trackColor="rgba(255,255,255,0.16)" />
          <AppText variant="caption" style={styles.dim}>{needed} XP para el nivel {progress.level + 1}{upcoming ? ` · ${upcoming.name} en el nivel ${upcoming.minLevel}` : ''}</AppText>
        </View>
        <View style={styles.footer}>
          <Icon name="trophy.fill" size={14} color={colors.volt} />
          <AppText variant="caption" style={styles.white}>{achievementCount} logros</AppText>
          {!weekly && gamification.freezes > 0 ? (
            <View style={styles.shield}>
              <Icon name="shield.fill" size={14} color={colors.pitch} />
              <AppText variant="caption" style={styles.white}>{gamification.freezes} {gamification.freezes === 1 ? 'escudo' : 'escudos'} de racha</AppText>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: radii.card },
  pressed: { transform: [{ scale: 0.985 }] },
  card: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.lg, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  white: { color: '#FFFFFF' },
  dim: { color: 'rgba(255,255,255,0.68)' },
  streak: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.button, gap: 0 },
  bar: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  shield: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
