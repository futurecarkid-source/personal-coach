import React, { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, GlassButton, GlassCard, Icon, Screen, SectionHeader, SegmentedControl } from '../components/common';
import { IntervalTimer } from '../components/specialized/IntervalTimer';
import { EXERCISES, EXERCISE_BY_ID, youtubeSearchUrl } from '../content/exercises';
import { useAppDispatch, useAppState } from '../context';
import { newId, weekdayMonday0 } from '../core/dates';
import type { IntervalPlan } from '../core/timerEngine';
import { useWeekPlan } from '../hooks/useTodayPlan';
import { spacing } from '../theme';
import type { Exercise } from '../types';

type Section = 'sesiones' | 'temporizador' | 'ejercicios';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export function TrainScreen(): React.JSX.Element {
  const [section, setSection] = useState<Section>('sesiones');
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { today, week } = useWeekPlan();

  const savePreset = (plan: IntervalPlan, name: string): void => {
    dispatch({ type: 'SAVE_TIMER_PRESET', preset: { id: newId('preset'), name, ...plan } });
  };

  return (
    <Screen nativeHeader>
      <View style={styles.shortcuts}>
        <GlassButton label="Mente" icon="brain.head.profile" size="compact" haptic="light" onPress={() => router.push('/mind')} />
        <GlassButton label="Lesiones" icon="cross.case.fill" size="compact" haptic="light" onPress={() => router.push('/injuries')} />
      </View>
      <SegmentedControl
        options={[
          { value: 'sesiones', label: 'Sesiones' },
          { value: 'temporizador', label: 'Temporizador' },
          { value: 'ejercicios', label: 'Ejercicios' },
        ]}
        value={section}
        onChange={setSection}
      />

      {section === 'sesiones' ? (
        <View style={styles.list}>
          <SectionHeader title="Próximos 7 días" subtitle="Plan por reglas según tu perfil, tus molestias y tus partidos" />
          {week.map((session) => {
            const isToday = session.date === today;
            const rest = session.kind === 'descanso';
            return (
              <GlassCard key={session.date} tint={isToday ? undefined : undefined}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <AppText variant="caption" tone={isToday ? 'accent' : 'secondary'}>
                      {isToday ? 'HOY · ' : ''}{DAY_NAMES[weekdayMonday0(session.date)]}
                    </AppText>
                    <AppText variant="headline">{session.title}</AppText>
                    {!rest ? (
                      <AppText variant="callout" tone="secondary">
                        {session.exerciseIds.length} ejercicios · ~{session.estimatedMinutes} min
                      </AppText>
                    ) : null}
                  </View>
                  {isToday && !rest ? (
                    <GlassButton label="Empezar" icon="play.fill" variant="primary" size="compact" haptic="heavy" onPress={() => router.push('/workout')} />
                  ) : (
                    <Icon name={rest ? 'moon.fill' : 'figure.run'} size={22} />
                  )}
                </View>
                {!rest ? (
                  <View style={styles.names}>
                    {session.exerciseIds.map((id) => (
                      <AppText key={id} variant="caption" tone="secondary">• {EXERCISE_BY_ID.get(id)?.name ?? id}</AppText>
                    ))}
                  </View>
                ) : null}
              </GlassCard>
            );
          })}
        </View>
      ) : null}

      {section === 'temporizador' ? (
        <IntervalTimer
          savedPresets={state.timerPresets}
          onSavePreset={savePreset}
          onDeletePreset={(id) => dispatch({ type: 'DELETE_TIMER_PRESET', presetId: id })}
        />
      ) : null}

      {section === 'ejercicios' ? (
        <View style={styles.list}>
          <SectionHeader title="Biblioteca" subtitle={`${EXERCISES.length} ejercicios`} />
          {EXERCISES.map((exercise) => (
            <ExerciseRow key={exercise.id} exercise={exercise} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const work = exercise.seconds !== null ? `${exercise.sets} × ${exercise.seconds}s` : `${exercise.sets} × ${exercise.reps}`;
  return (
    <GlassCard>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <AppText variant="headline">{exercise.name}</AppText>
          <AppText variant="callout" tone="secondary">{work} · descanso {exercise.restSeconds}s</AppText>
        </View>
        <GlassButton label={open ? 'Cerrar' : 'Ver'} size="compact" haptic="light" onPress={() => setOpen((v) => !v)} />
      </View>
      {open ? (
        <View style={styles.names}>
          {exercise.steps.map((step, i) => (
            <AppText key={step} variant="callout">{i + 1}. {step}</AppText>
          ))}
          <AppText variant="callout" tone="danger">Error común: {exercise.commonMistake}</AppText>
          <GlassButton label="Ver explicación en YouTube" icon="play.rectangle.fill" size="compact" haptic="light" onPress={() => { Linking.openURL(youtubeSearchUrl(exercise.youtubeQuery)).catch(() => undefined); }} />
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  shortcuts: { flexDirection: 'row', gap: spacing.sm },
  list: { gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  names: { gap: spacing.sm, marginTop: spacing.md },
});
