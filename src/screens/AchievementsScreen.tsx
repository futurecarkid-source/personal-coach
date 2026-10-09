import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, GlassCard, Icon, ProgressBar, Screen } from '../components/common';
import type { IconName } from '../components/common/Icon';
import { useAppState } from '../context';
import { levelFromXp } from '../core/gamification';
import { achievementStatuses, nextRank, rankFor } from '../core/progression';
import { spacing, useTheme } from '../theme';

/** Vitrina de logros: los desbloqueados en color y los pendientes con su progreso. */
export function AchievementsScreen(): React.JSX.Element {
  const { state } = useAppState();
  const { colors } = useTheme();
  const list = achievementStatuses(state);
  const unlocked = list.filter((a) => a.unlockedAt !== null);
  const locked = list.filter((a) => a.unlockedAt === null);
  const level = levelFromXp(state.gamification.xp);
  const rank = rankFor(level);
  const upcoming = nextRank(level);

  const card = (a: (typeof list)[number]): React.JSX.Element => {
    const done = a.unlockedAt !== null;
    return (
      <View key={a.def.id} style={styles.cell}>
        <GlassCard padding={spacing.md} contentStyle={styles.cardInner}>
          <View style={[styles.badge, { backgroundColor: done ? colors.accent : colors.surfaceStrong }]}>
            <Icon name={(done ? a.def.icon : 'lock.fill') as IconName} size={24} color={done ? '#FFFFFF' : colors.textSecondary} />
          </View>
          <AppText variant="headline" style={styles.center} tone={done ? 'primary' : 'secondary'}>{a.def.title}</AppText>
          <AppText variant="caption" tone="secondary" style={styles.center}>{a.def.description}</AppText>
          {done ? (
            <AppText variant="caption" tone="success">+{a.def.xp} XP</AppText>
          ) : (
            <View style={styles.progress}>
              <ProgressBar fraction={a.value / a.goal} height={6} />
              <AppText variant="caption" tone="secondary" style={styles.center}>{a.value} de {a.goal}</AppText>
            </View>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <Screen tabBarSpace={false} nativeHeader>
      <GlassCard>
        <AppText variant="label" tone="secondary">Tu rango</AppText>
        <AppText variant="largeTitle">{rank.name}</AppText>
        <AppText variant="callout" tone="secondary">
          Nivel {level} · {unlocked.length} de {list.length} logros{upcoming ? ` · próximo rango: ${upcoming.name} en el nivel ${upcoming.minLevel}` : ''}
        </AppText>
      </GlassCard>
      {unlocked.length > 0 ? <AppText variant="title">Desbloqueados</AppText> : null}
      <View style={styles.grid}>{unlocked.map(card)}</View>
      <AppText variant="title">Por conseguir</AppText>
      <View style={styles.grid}>{locked.map(card)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47.5%', flexGrow: 1 },
  cardInner: { alignItems: 'center', gap: spacing.sm },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  progress: { alignSelf: 'stretch', gap: 4 },
});
