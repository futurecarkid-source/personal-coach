import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DAILY_BONUS_XP, dailyQuests, weeklyChallenge } from '../../core/progression';
import { haptics, spacing, useTheme } from '../../theme';
import type { AppState } from '../../types';
import { AppText } from '../common/AppText';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';
import { Icon } from '../common/Icon';
import { ProgressBar } from '../common/ProgressBar';
import { useCelebrate } from './CelebrationHost';

export interface QuestsCardProps {
  state: AppState;
  date: string;
  onClaim: (key: string, xp: number) => void;
}

/** Misiones del día (se completan solas, tú las cobras), cofre diario y reto de la semana. */
export function QuestsCard({ state, date, onClaim }: QuestsCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const { celebrate } = useCelebrate();
  const daily = dailyQuests(state, date);
  const weekly = weeklyChallenge(state, date);
  const doneCount = daily.quests.filter((q) => q.claimed).length;

  return (
    <GlassCard>
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="label" tone="secondary">Misiones de hoy</AppText>
          <AppText variant="title">{doneCount} de {daily.quests.length}</AppText>
        </View>
        <Icon name="target" size={26} color={colors.accent} />
      </View>

      <View style={styles.list}>
        {daily.quests.map((q) => (
          <View key={q.key} style={styles.quest}>
            <View style={[styles.icon, { backgroundColor: q.claimed ? colors.success : q.done ? colors.accent : colors.surfaceStrong }]}>
              <Icon name={q.claimed ? 'checkmark' : q.icon} size={18} color={q.claimed || q.done ? '#FFFFFF' : colors.textSecondary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="headline" tone={q.claimed ? 'secondary' : 'primary'}>{q.title}</AppText>
            </View>
            {q.claimed ? null : q.done ? (
              <GlassButton label={`+${q.xp} XP`} variant="primary" size="compact" haptic="success" onPress={() => onClaim(q.key, q.xp)} />
            ) : (
              <AppText variant="callout" tone="secondary">+{q.xp}</AppText>
            )}
          </View>
        ))}
      </View>

      <View style={[styles.chest, { borderColor: colors.separator }]}>
        <Icon name="shippingbox.fill" size={22} color={daily.bonusReady && !daily.bonusClaimed ? colors.accent : colors.textSecondary} />
        <View style={styles.flex}>
          <AppText variant="headline">Cofre del día</AppText>
          <AppText variant="caption" tone="secondary">{daily.bonusClaimed ? 'Abierto' : '3 misiones'}</AppText>
        </View>
        {daily.bonusReady && !daily.bonusClaimed ? (
          <GlassButton
            label={`Abrir +${DAILY_BONUS_XP}`}
            variant="primary"
            size="compact"
            haptic="success"
            onPress={() => {
              onClaim(daily.bonusKey, DAILY_BONUS_XP);
              celebrate({ id: `cofre:${daily.bonusKey}`, kind: 'mision', title: '¡Cofre abierto!', subtitle: 'Cumpliste todas las misiones de hoy.', icon: 'shippingbox.fill', xp: DAILY_BONUS_XP });
            }}
          />
        ) : null}
      </View>

      <View style={styles.week}>
        <View style={styles.head}>
          <AppText variant="label" tone="secondary">Reto de la semana</AppText>
          <AppText variant="caption" tone="secondary">{weekly.done} de {weekly.goal} sesiones</AppText>
        </View>
        <ProgressBar fraction={weekly.done / weekly.goal} height={10} color={weekly.complete ? colors.success : colors.accent} />
        {weekly.complete && !weekly.claimed ? (
          <GlassButton
            label={`Cobrar reto +${weekly.xp} XP`}
            variant="primary"
            haptic="success"
            onPress={() => {
              haptics.success();
              onClaim(weekly.key, weekly.xp);
              celebrate({ id: `reto:${weekly.key}`, kind: 'mision', title: '¡Semana cumplida!', subtitle: `Completaste ${weekly.goal} sesiones esta semana.`, icon: 'trophy.fill', xp: weekly.xp });
            }}
          />
        ) : weekly.claimed ? (
          <AppText variant="caption" tone="success">Cobrado</AppText>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  list: { gap: spacing.md, marginTop: spacing.lg },
  quest: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chest: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
  week: { gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg },
});
