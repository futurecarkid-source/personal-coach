import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { BUILT_IN_PRESETS, computeIntervalState, formatClock, totalDurationMs, type IntervalPhase, type IntervalPlan } from '../../core/timerEngine';
import { useStopwatch } from '../../hooks/useStopwatch';
import { haptics, spacing, useTheme } from '../../theme';
import type { TimerPreset } from '../../types';
import { AppText } from '../common/AppText';
import { Chip } from '../common/Chip';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';
import { SegmentedControl } from '../common/SegmentedControl';
import { Stepper } from '../common/Stepper';

type Mode = 'intervalos' | 'temporizador' | 'cronometro';

const RING_SIZE = 240;
const RING_STROKE = 14;
const RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PHASE_LABEL: Record<IntervalPhase, string> = { prep: 'Prepárate', work: 'Trabajo', rest: 'Descanso', done: 'Terminado' };
const KEEP_AWAKE_TAG = 'dorsal-timer';

export interface IntervalTimerProps {
  savedPresets?: readonly TimerPreset[];
  onSavePreset?: (plan: IntervalPlan, name: string) => void;
  onDeletePreset?: (id: string) => void;
}

/**
 * Temporizador completo: intervalos (Tabata, HIIT, EMOM y personalizados), temporizador de cuenta atrás y cronómetro con vueltas.
 * Todo se calcula contra el reloj monótono; háptica en cada cambio de fase y en los últimos 3 segundos (solo iPhone).
 */
export function IntervalTimer({ savedPresets = [], onSavePreset, onDeletePreset }: IntervalTimerProps): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('intervalos');
  return (
    <View style={styles.wrapper}>
      <SegmentedControl
        options={[
          { value: 'intervalos', label: 'Intervalos' },
          { value: 'temporizador', label: 'Temporizador' },
          { value: 'cronometro', label: 'Cronómetro' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'intervalos' ? <IntervalsPanel savedPresets={savedPresets} onSavePreset={onSavePreset} onDeletePreset={onDeletePreset} /> : null}
      {mode === 'temporizador' ? <CountdownPanel /> : null}
      {mode === 'cronometro' ? <StopwatchPanel /> : null}
    </View>
  );
}

function Ring({ fraction, color }: { fraction: number; color: string }): React.JSX.Element {
  const { colors } = useTheme();
  const progress = useSharedValue(fraction);
  useEffect(() => {
    progress.set(withTiming(Math.max(0, Math.min(1, fraction)), { duration: 160, easing: Easing.linear }));
  }, [fraction, progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.value) }));
  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={colors.surfaceStrong} strokeWidth={RING_STROKE} fill="none" />
      <AnimatedCircle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        stroke={color}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        animatedProps={animatedProps}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    </Svg>
  );
}

/** Mantiene la pantalla encendida mientras el temporizador corre. */
function useKeepAwakeWhile(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [active]);
}

/** Háptica al cambiar de fase y tic en los últimos 3 segundos. */
function usePhaseHaptics(phase: IntervalPhase, remainingMs: number, running: boolean): void {
  const previousPhase = useRef<IntervalPhase | null>(null);
  const lastTick = useRef<number | null>(null);
  useEffect(() => {
    if (!running) {
      previousPhase.current = null;
      lastTick.current = null;
      return;
    }
    if (previousPhase.current !== null && previousPhase.current !== phase) {
      if (phase === 'work') haptics.heavy();
      else if (phase === 'rest') haptics.soft();
      else if (phase === 'done') haptics.success();
    }
    previousPhase.current = phase;
  }, [phase, running]);
  useEffect(() => {
    if (!running || phase === 'done') return;
    const secondsLeft = Math.ceil(remainingMs / 1000);
    if (secondsLeft <= 3 && secondsLeft >= 1 && lastTick.current !== secondsLeft) {
      lastTick.current = secondsLeft;
      haptics.rigid();
    }
    if (secondsLeft > 3) lastTick.current = null;
  }, [phase, remainingMs, running]);
}

function IntervalsPanel({ savedPresets, onSavePreset, onDeletePreset }: Required<Pick<IntervalTimerProps, 'savedPresets'>> & Pick<IntervalTimerProps, 'onSavePreset' | 'onDeletePreset'>): React.JSX.Element {
  const { colors } = useTheme();
  const [presetId, setPresetId] = useState<string>('tabata');
  const [plan, setPlan] = useState<IntervalPlan>(BUILT_IN_PRESETS[0]?.plan ?? { prepSeconds: 10, workSeconds: 20, restSeconds: 10, rounds: 8 });
  const watch = useStopwatch();
  const started = watch.running || watch.elapsedMs > 0;

  const state = useMemo(() => computeIntervalState(plan, watch.elapsedMs), [plan, watch.elapsedMs]);
  const finished = state.finished && watch.elapsedMs > 0;

  useEffect(() => {
    if (finished && watch.running) watch.pause();
  }, [finished, watch]);

  useKeepAwakeWhile(watch.running);
  usePhaseHaptics(state.phase, state.phaseRemainingMs, watch.running);

  const choose = (id: string, next: IntervalPlan): void => {
    watch.reset();
    setPresetId(id);
    setPlan(next);
  };

  const update = (patch: Partial<IntervalPlan>): void => {
    watch.reset();
    setPresetId('custom');
    setPlan((p) => ({ ...p, ...patch }));
  };

  const phaseColor = state.phase === 'work' ? colors.accent : state.phase === 'rest' ? colors.deepBlue : colors.textSecondary;
  const fraction = state.phase === 'done' ? 1 : state.phaseDurationMs > 0 ? state.phaseElapsedMs / state.phaseDurationMs : 0;
  const display = started ? formatClock(Math.ceil(state.phaseRemainingMs / 1000) * 1000) : formatClock(plan.workSeconds * 1000);

  return (
    <View style={styles.wrapper}>
      <GlassCard contentStyle={styles.center}>
        <View style={styles.ringBox}>
          <Ring fraction={started ? fraction : 0} color={phaseColor} />
          <View style={styles.ringCenter} pointerEvents="none">
            <AppText variant="caption" tone="secondary">{started ? PHASE_LABEL[state.phase] : 'Listo'}</AppText>
            <AppText variant="digitsLarge" accessibilityLiveRegion="polite">{display}</AppText>
            <AppText variant="callout" tone="secondary">
              {started && state.phase !== 'done' ? `Ronda ${Math.max(1, state.round)} de ${plan.rounds}` : `${plan.rounds} rondas`}
            </AppText>
          </View>
        </View>
        <AppText variant="callout" tone="secondary">
          Total: {formatClock(started ? state.totalRemainingMs : totalDurationMs(plan))}
        </AppText>
        <View style={styles.row}>
          {watch.running ? (
            <GlassButton label="Pausar" icon="pause.fill" variant="secondary" onPress={watch.pause} />
          ) : (
            <GlassButton label={finished ? 'Reiniciar' : started ? 'Seguir' : 'Empezar'} icon="play.fill" variant="primary" haptic="heavy" onPress={finished ? () => { watch.reset(); watch.start(); } : watch.start} />
          )}
          <GlassButton label="Reiniciar" icon="arrow.counterclockwise" variant="secondary" disabled={!started} onPress={watch.reset} />
        </View>
      </GlassCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {BUILT_IN_PRESETS.map((p) => (
          <Chip key={p.id} label={p.name} selected={presetId === p.id} onPress={() => choose(p.id, p.plan)} />
        ))}
        {savedPresets.map((p) => (
          <Chip
            key={p.id}
            label={p.name}
            selected={presetId === p.id}
            onPress={() => choose(p.id, { prepSeconds: p.prepSeconds, workSeconds: p.workSeconds, restSeconds: p.restSeconds, rounds: p.rounds })}
          />
        ))}
      </ScrollView>

      <GlassCard>
        <View style={styles.steppers}>
          <Stepper label="Preparación" value={plan.prepSeconds} min={0} max={60} step={5} unit="s" onChange={(v) => update({ prepSeconds: v })} />
          <Stepper label="Trabajo" value={plan.workSeconds} min={5} max={600} step={5} unit="s" onChange={(v) => update({ workSeconds: v })} />
          <Stepper label="Descanso" value={plan.restSeconds} min={0} max={600} step={5} unit="s" onChange={(v) => update({ restSeconds: v })} />
          <Stepper label="Rondas" value={plan.rounds} min={1} max={50} onChange={(v) => update({ rounds: v })} />
        </View>
        <View style={[styles.row, { marginTop: spacing.md }]}>
          {onSavePreset ? (
            <GlassButton
              label="Guardar como mío"
              icon="square.and.arrow.down"
              size="compact"
              haptic="success"
              onPress={() => onSavePreset(plan, `${plan.workSeconds}/${plan.restSeconds} × ${plan.rounds}`)}
            />
          ) : null}
          {onDeletePreset && savedPresets.some((p) => p.id === presetId) ? (
            <GlassButton label="Borrar" icon="trash" size="compact" variant="danger" haptic="warning" onPress={() => { onDeletePreset(presetId); setPresetId('tabata'); }} />
          ) : null}
        </View>
      </GlassCard>
    </View>
  );
}

function CountdownPanel(): React.JSX.Element {
  const { colors } = useTheme();
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const plan = useMemo<IntervalPlan>(() => ({ prepSeconds: 0, workSeconds: Math.max(1, minutes * 60 + seconds), restSeconds: 0, rounds: 1 }), [minutes, seconds]);
  const watch = useStopwatch();
  const state = computeIntervalState(plan, watch.elapsedMs);
  const started = watch.running || watch.elapsedMs > 0;
  const finished = state.finished && watch.elapsedMs > 0;

  useEffect(() => {
    if (finished && watch.running) watch.pause();
  }, [finished, watch]);
  useKeepAwakeWhile(watch.running);
  usePhaseHaptics(state.phase, state.phaseRemainingMs, watch.running);

  const remaining = started ? state.totalRemainingMs : plan.workSeconds * 1000;
  const fraction = started ? 1 - state.totalRemainingMs / state.totalDurationMs : 0;

  return (
    <GlassCard contentStyle={styles.center}>
      <View style={styles.ringBox}>
        <Ring fraction={fraction} color={colors.accent} />
        <View style={styles.ringCenter} pointerEvents="none">
          <AppText variant="digitsLarge">{formatClock(Math.ceil(remaining / 1000) * 1000)}</AppText>
        </View>
      </View>
      {!started ? (
        <View style={styles.steppers}>
          <Stepper label="Minutos" value={minutes} min={0} max={180} onChange={setMinutes} />
          <Stepper label="Segundos" value={seconds} min={0} max={55} step={5} onChange={setSeconds} />
        </View>
      ) : null}
      <View style={styles.row}>
        {watch.running ? (
          <GlassButton label="Pausar" icon="pause.fill" onPress={watch.pause} />
        ) : (
          <GlassButton label={finished ? 'Reiniciar' : started ? 'Seguir' : 'Empezar'} icon="play.fill" variant="primary" haptic="heavy" onPress={finished ? () => { watch.reset(); watch.start(); } : watch.start} />
        )}
        <GlassButton label="Reiniciar" icon="arrow.counterclockwise" disabled={!started} onPress={watch.reset} />
      </View>
    </GlassCard>
  );
}

function StopwatchPanel(): React.JSX.Element {
  const watch = useStopwatch(50);
  const [laps, setLaps] = useState<number[]>([]);
  useKeepAwakeWhile(watch.running);

  const lap = (): void => setLaps((l) => [watch.elapsedMs, ...l]);
  const reset = (): void => {
    watch.reset();
    setLaps([]);
  };

  return (
    <GlassCard contentStyle={styles.center}>
      <AppText variant="digitsLarge" accessibilityLabel={`Cronómetro ${formatClock(watch.elapsedMs)}`}>{formatClock(watch.elapsedMs, true)}</AppText>
      <View style={styles.row}>
        {watch.running ? (
          <GlassButton label="Pausar" icon="pause.fill" onPress={watch.pause} />
        ) : (
          <GlassButton label={watch.elapsedMs > 0 ? 'Seguir' : 'Empezar'} icon="play.fill" variant="primary" haptic="heavy" onPress={watch.start} />
        )}
        <GlassButton label="Vuelta" icon="flag.fill" haptic="medium" disabled={!watch.running} onPress={lap} />
        <GlassButton label="Reiniciar" icon="arrow.counterclockwise" disabled={watch.elapsedMs === 0} onPress={reset} />
      </View>
      {laps.length > 0 ? (
        <View style={styles.laps}>
          {laps.map((value, i) => {
            const previous = laps[i + 1] ?? 0;
            return (
              <View key={`${laps.length - i}`} style={styles.lapRow}>
                <AppText variant="callout" tone="secondary">Vuelta {laps.length - i}</AppText>
                <AppText variant="callout" style={styles.lapValue}>{formatClock(value - previous, true)}</AppText>
                <AppText variant="callout" tone="secondary" style={styles.lapValue}>{formatClock(value, true)}</AppText>
              </View>
            );
          })}
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  center: { alignItems: 'center', gap: spacing.lg },
  ringBox: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', gap: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  steppers: { gap: spacing.md, alignSelf: 'stretch' },
  laps: { alignSelf: 'stretch', gap: spacing.sm },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lapValue: { fontVariant: ['tabular-nums'] },
});
