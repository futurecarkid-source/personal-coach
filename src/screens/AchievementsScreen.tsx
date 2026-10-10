import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, GlassButton, GlassCard, Icon, ProgressBar, Screen } from '../components/common';
import type { IconName } from '../components/common/Icon';
import { useAppDispatch, useAppState } from '../context';
import { levelFromXp } from '../core/gamification';
import { achievementStatuses, nextRank, rankFor, seasonProgress } from '../core/progression';
import { toISODate } from '../core/dates';
import { useCelebrate } from '../components/specialized/CelebrationHost';
import { spacing, useTheme } from '../theme';

/** Vitrina de logros: los desbloqueados en color y los pendientes con su progreso. */
export function AchievementsScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const { celebrate } = useCelebrate();
  const { colors } = useTheme();
  const season = seasonProgress(state, toISODate(new Date()));
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
          <View style={[styles.badge, { backgroundColor: done ? colors.volt : colors.surfaceStrong }]}>
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
    <Screen tabBarSpace={false} nativeHeader title="Logros" back>
      <GlassCard>
        <AppText variant="label" tone="secondary">Tu rango</AppText>
        <AppText variant="largeTitle">{rank.name}</AppText>
        <AppText variant="callout" tone="secondary">
          Nivel {level} · {unlocked.length} de {list.length} logros{upcoming ? ` · próximo rango: ${upcoming.name} en el nivel ${upcoming.minLevel}` : ''}
        </AppText>
      </GlassCard>
      <GlassCard>
        <AppText variant="label" tone="secondary">{season.name}</AppText>
        <AppText variant="title">{season.done} de {season.goal} sesiones</AppText>
        <View style={styles.seasonBar}>
          <ProgressBar fraction={season.done / season.goal} height={10} color={season.complete ? colors.success : colors.volt} />
        </View>
        {season.complete && !season.claimed ? (
          <GlassButton
            label={`Cobrar temporada +${season.xp} XP`}
            variant="primary"
            haptic="success"
            fullWidth
            onPress={() => {
              dispatch({ type: 'CLAIM_QUEST', key: season.key, xp: season.xp });
              celebrate({ id: `temporada:${season.key}`, kind: 'mision', title: '¡Temporada cumplida!', subtitle: `Completaste ${season.goal} sesiones este mes.`, icon: 'trophy.fill', xp: season.xp });
            }}
          />
        ) : season.claimed ? (
          <AppText variant="caption" tone="success">Recompensa cobrada</AppText>
        ) : (
          <AppText variant="caption" tone="secondary">Cumple {season.goal} sesiones este mes para ganar +{season.xp} XP.</AppText>
        )}
      </GlassCard>
      {unlocked.length > 0 ? <AppText variant="title">Desbloqueados</AppText> : null}
      <View style={styles.grid}>{unlocked.map(card)}</View>
      <AppText variant="title">Por conseguir</AppText>
      <View style={styles.grid}>{locked.map(card)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  seasonBar: { marginVertical: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47.5%', flexGrow: 1 },
  cardInner: { alignItems: 'center', gap: spacing.sm },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  progress: { alignSelf: 'stretch', gap: 4 },
});
