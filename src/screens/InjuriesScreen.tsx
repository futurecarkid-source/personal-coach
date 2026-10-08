import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Chip, GlassButton, GlassCard, Screen, SectionHeader } from '../components/common';
import { BODY_ZONE_LABELS } from '../content/attributeLabels';
import { EXERCISE_BY_ID } from '../content/exercises';
import { INJURIES, INJURIES_DISCLAIMER, type InjuryInfo } from '../content/injuries';
import { useAppState } from '../context';
import { haptics, spacing } from '../theme';
import { isMinor } from '../types';

function BulletList({ title, items }: { title: string; items: readonly string[] }): React.JSX.Element {
  return (
    <View style={styles.block}>
      <AppText variant="headline">{title}</AppText>
      {items.map((it) => (
        <AppText key={it} variant="callout" tone="secondary">• {it}</AppText>
      ))}
    </View>
  );
}

function InjuryCard({ info, open, onToggle }: { info: InjuryInfo; open: boolean; onToggle: () => void }): React.JSX.Element {
  const router = useRouter();
  const exercises = info.exerciseIds.map((id) => EXERCISE_BY_ID.get(id)).filter((e): e is NonNullable<typeof e> => e !== undefined);
  return (
    <GlassCard padding={spacing.md}>
      <Pressable onPress={() => { haptics.selection(); onToggle(); }} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <AppText variant="headline">{info.name}</AppText>
        <AppText variant="caption" tone="secondary">{BODY_ZONE_LABELS[info.zone]}</AppText>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          <AppText variant="callout">{info.summary}</AppText>
          <BulletList title="Señales" items={info.signs} />
          <BulletList title="Cómo prevenirlo" items={info.prevention} />
          {exercises.length > 0 ? <BulletList title="Ejercicios de tu biblioteca" items={exercises.map((e) => e.name)} /> : null}
          <BulletList title="Cuándo consultar" items={info.seeDoctor} />
          <GlassButton label="Tengo este dolor" icon="cross.case.fill" variant="primary" size="compact" haptic="medium" onPress={() => router.push({ pathname: '/pain', params: { zone: info.zone } })} />
        </View>
      ) : null}
    </GlassCard>
  );
}

export function InjuriesScreen(): React.JSX.Element {
  const { state } = useAppState();
  const minor = state.player !== null && isMinor(state.player.ageBand);
  const [openId, setOpenId] = useState<string | null>(null);
  const [onlyGrowth, setOnlyGrowth] = useState(false);
  const list = INJURIES.filter((i) => (onlyGrowth ? i.growing === true : true));

  return (
    <Screen tabBarSpace={false} nativeHeader>
      <AppText variant="callout" tone="secondary">{INJURIES_DISCLAIMER}</AppText>
      {minor ? (
        <Chip label="Zonas de crecimiento" selected={onlyGrowth} onPress={() => setOnlyGrowth((v) => !v)} />
      ) : null}
      <SectionHeader title={`${list.length} lesiones frecuentes`} subtitle="Toca una para ver señales, prevención y cuándo consultar" />
      <View style={styles.list}>
        {list.map((info) => (
          <InjuryCard key={info.id} info={info} open={openId === info.id} onToggle={() => setOpenId((cur) => (cur === info.id ? null : info.id))} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  body: { gap: spacing.md, marginTop: spacing.md },
  block: { gap: 2 },
});
