import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AppText, FaceRating, GlassButton, GlassCard, ProgressBar, Screen } from '../components/common';
import { ExerciseFigure } from '../components/specialized/ExerciseFigure';
import { EXERCISE_BY_ID, youtubeSearchUrl } from '../content/exercises';
import { useAppDispatch } from '../context';
import { newId } from '../core/dates';
import { formatClock } from '../core/timerEngine';
import { initialWorkoutFlow, totalSets, workoutReducer, type WorkoutEvent, type WorkoutFlow } from '../core/workoutFlow';
import { useCountdown } from '../hooks/useCountdown';
import { monotonicNow } from '../hooks/useTicker';
import { useWeekPlan } from '../hooks/useTodayPlan';
import { haptics, spacing } from '../theme';
import type { Exercise } from '../types';

const KEEP_AWAKE_TAG = 'dorsal-workout';
const PREP_MS = 3000;

/**
 * "Empezar ejercicio": guía la sesión del día serie por serie.
 * Ejercicios por tiempo: cuenta atrás automática; por repeticiones: botón "Hecho".
 * Descanso automático, siguiente/anterior/saltar, pausa de pantalla encendida, esfuerzo percibido al final y XP.
 */
export function WorkoutRunnerScreen(): React.JSX.Element {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { today, todaySession } = useWeekPlan();
  const exercises = useMemo<Exercise[]>(
    () => (todaySession?.exerciseIds ?? []).flatMap((id) => {
      const e = EXERCISE_BY_ID.get(id);
      return e ? [e] : [];
    }),
    [todaySession],
  );

  const reducer = (flow: WorkoutFlow, event: WorkoutEvent): WorkoutFlow => workoutReducer(flow, event, exercises);
  const [flow, send] = useReducer(reducer, initialWorkoutFlow);
  const [rpe, setRpe] = useState<number | null>(null);
  const startedAt = useRef(monotonicNow());
  const [elapsedAtSummary, setElapsedAtSummary] = useState(0);

  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (flow.stage === 'summary') {
      setElapsedAtSummary(monotonicNow() - startedAt.current);
      haptics.success();
    }
  }, [flow.stage]);

  const current = exercises[flow.exerciseIndex];

  if (!todaySession || exercises.length === 0 || !current) {
    return (
      <Screen tabBarSpace={false}>
        <AppText variant="largeTitle">Sin sesión hoy</AppText>
        <AppText variant="body" tone="secondary">Hoy no hay ejercicios programados. Disfruta el descanso.</AppText>
        <GlassButton label="Volver" icon="chevron.left" onPress={() => router.back()} />
      </Screen>
    );
  }

  const sets = totalSets(exercises);

  if (flow.stage === 'summary' && flow.setsDone === 0) {
    return (
      <Screen tabBarSpace={false}>
        <AppText variant="largeTitle">Sin series completadas</AppText>
        <AppText variant="body" tone="secondary">Saltaste todos los ejercicios, así que no se guarda la sesión ni se suma XP. Puedes volver cuando quieras.</AppText>
        <GlassButton label="Salir" icon="chevron.left" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (flow.stage === 'summary') {
    const finish = (): void => {
      if (rpe === null) return;
      dispatch({
        type: 'LOG_SESSION',
        log: {
          id: newId('log'),
          date: today,
          title: todaySession.title,
          durationSeconds: Math.round(elapsedAtSummary / 1000),
          rpe,
          exerciseIds: exercises.map((e) => e.id),
        },
      });
      router.back();
    };
    return (
      <Screen tabBarSpace={false}>
        <AppText variant="largeTitle">¡Sesión completa!</AppText>
        <GlassCard>
          <AppText variant="headline">{todaySession.title}</AppText>
          <AppText variant="callout" tone="secondary">
            {flow.setsDone} series · {formatClock(elapsedAtSummary)}
          </AppText>
        </GlassCard>
        <GlassCard>
          <FaceRating label="¿Qué tan duro fue? (esfuerzo percibido)" value={rpe} onChange={setRpe} />
        </GlassCard>
        <GlassButton label="Guardar y sumar XP" icon="checkmark" variant="primary" haptic="success" disabled={rpe === null} onPress={finish} />
      </Screen>
    );
  }

  const isTimed = current.seconds !== null;
  const nextExercise = exercises[flow.exerciseIndex];

  return (
    <Screen tabBarSpace={false}>
      <View style={styles.top}>
        <GlassButton label="Salir" icon="xmark" size="compact" haptic="light" onPress={() => router.back()} />
        <AppText variant="callout" tone="secondary">Ejercicio {flow.exerciseIndex + 1} de {exercises.length}</AppText>
      </View>
      <ProgressBar fraction={flow.setsDone / sets} />

      {flow.stage === 'rest' ? (
        <RestPanel
          key={`rest-${flow.exerciseIndex}-${flow.setIndex}`}
          seconds={exercises[Math.max(0, flow.setIndex === 0 ? flow.exerciseIndex - 1 : flow.exerciseIndex)]?.restSeconds ?? 30}
          nextLabel={`${nextExercise?.name ?? ''} · serie ${flow.setIndex + 1} de ${nextExercise?.sets ?? 1}`}
          onDone={() => send({ type: 'REST_DONE' })}
        />
      ) : (
        <>
          <ExerciseFigure key={current.id} exercise={current} />
          <View style={styles.center}>
            <AppText variant="title" style={styles.titleCenter}>{current.name}</AppText>
            <AppText variant="callout" tone="secondary">Serie {flow.setIndex + 1} de {current.sets}</AppText>
          </View>

          {flow.stage === 'work' && isTimed ? (
            <WorkPanel key={`work-${flow.exerciseIndex}-${flow.setIndex}`} seconds={current.seconds ?? 30} onDone={() => { haptics.medium(); send({ type: 'COMPLETE_SET' }); }} />
          ) : (
            <GlassCard contentStyle={styles.center}>
              <AppText variant="digitsLarge">{isTimed ? `${current.seconds}s` : `${current.reps}`}</AppText>
              <AppText variant="callout" tone="secondary">{isTimed ? 'Mantén el tiempo' : 'repeticiones'}</AppText>
              {isTimed ? (
                <GlassButton label="Empezar serie" icon="play.fill" variant="primary" haptic="heavy" onPress={() => send({ type: 'START_WORK' })} />
              ) : (
                <GlassButton label="Hecho" icon="checkmark" variant="primary" haptic="medium" onPress={() => send({ type: 'COMPLETE_SET' })} />
              )}
            </GlassCard>
          )}

          <GlassCard>
            <AppText variant="headline">Cómo hacerlo</AppText>
            <View style={styles.steps}>
              {current.steps.map((step, i) => (
                <AppText key={step} variant="callout">{i + 1}. {step}</AppText>
              ))}
            </View>
            <AppText variant="callout" tone="danger" style={styles.mistake}>Error común: {current.commonMistake}</AppText>
            <GlassButton label="Ver explicación en YouTube" icon="play.rectangle.fill" size="compact" haptic="light" onPress={() => { Linking.openURL(youtubeSearchUrl(current.youtubeQuery)).catch(() => undefined); }} />
          </GlassCard>
        </>
      )}

      <View style={styles.nav}>
        <GlassButton label="Anterior" icon="chevron.left" size="compact" haptic="light" disabled={flow.exerciseIndex === 0} onPress={() => send({ type: 'PREVIOUS_EXERCISE' })} />
        <GlassButton label="Saltar ejercicio" icon="forward.fill" size="compact" haptic="light" onPress={() => send({ type: 'SKIP_EXERCISE' })} />
      </View>
    </Screen>
  );
}

function WorkPanel({ seconds, onDone }: { seconds: number; onDone: () => void }): React.JSX.Element {
  const prep = useCountdown(PREP_MS, () => undefined);
  const inPrep = prep.remainingMs > 0;
  return inPrep ? (
    <GlassCard contentStyle={styles.center}>
      <AppText variant="caption" tone="secondary">Prepárate</AppText>
      <AppText variant="digitsLarge">{Math.ceil(prep.remainingMs / 1000)}</AppText>
    </GlassCard>
  ) : (
    <ActiveCountdown seconds={seconds} onDone={onDone} />
  );
}

function ActiveCountdown({ seconds, onDone }: { seconds: number; onDone: () => void }): React.JSX.Element {
  const { remainingMs, fraction } = useCountdown(seconds * 1000, onDone);
  return (
    <GlassCard contentStyle={styles.center}>
      <AppText variant="caption" tone="secondary">¡Ahora!</AppText>
      <AppText variant="digitsLarge" accessibilityLiveRegion="polite">{Math.ceil(remainingMs / 1000)}</AppText>
      <ProgressBar fraction={fraction} />
    </GlassCard>
  );
}

function RestPanel({ seconds, nextLabel, onDone }: { seconds: number; nextLabel: string; onDone: () => void }): React.JSX.Element {
  const { remainingMs, fraction } = useCountdown(seconds * 1000, () => { haptics.heavy(); onDone(); });
  return (
    <GlassCard contentStyle={styles.center}>
      <AppText variant="caption" tone="secondary">Descanso</AppText>
      <AppText variant="digitsLarge" accessibilityLiveRegion="polite">{Math.ceil(remainingMs / 1000)}</AppText>
      <ProgressBar fraction={fraction} />
      <AppText variant="callout" tone="secondary" style={styles.titleCenter}>A continuación: {nextLabel}</AppText>
      <GlassButton label="Saltar descanso" icon="forward.fill" size="compact" haptic="light" onPress={onDone} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', gap: spacing.md },
  titleCenter: { textAlign: 'center' },
  steps: { gap: spacing.sm, marginVertical: spacing.md },
  mistake: { marginBottom: spacing.md },
  nav: { flexDirection: 'row', justifyContent: 'space-between' },
});
