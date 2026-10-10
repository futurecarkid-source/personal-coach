import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Chip, GlassButton, GlassCard, Screen, SegmentedControl } from '../components/common';
import { useAppDispatch, useAppState } from '../context';
import { BREATH_PROTOCOLS, breathState, pulsesFor, type BreathPhase, type BreathProtocol } from '../core/breathing';
import { reflexTrend, summarizeReflex, type ReflexSummary, type ReflexTrial } from '../core/reflex';
import { haptics, radii, spacing, useTheme } from '../theme';

type Panel = 'respirar' | 'reflejos';

const PHASE_LABEL: Record<BreathPhase, string> = { inhale: 'Inhala', hold: 'Retén', exhale: 'Exhala', rest: 'Pausa' };
const PHASE_INDEX: Record<BreathPhase, number> = { inhale: 0, hold: 1, exhale: 2, rest: 3 };
const TICK_MS = 50;

export function MindScreen(): React.JSX.Element {
  const [panel, setPanel] = useState<Panel>('respirar');
  return (
    <Screen tabBarSpace={false} nativeHeader title="Mente" back>
      <SegmentedControl
        options={[
          { value: 'respirar', label: 'Respirar' },
          { value: 'reflejos', label: 'Reflejos' },
        ]}
        value={panel}
        onChange={setPanel}
      />
      {panel === 'respirar' ? <BreathPanel /> : <ReflexPanel />}
    </Screen>
  );
}

function BreathPanel(): React.JSX.Element {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [protocol, setProtocol] = useState<BreathProtocol>(BREATH_PROTOCOLS[1] ?? BREATH_PROTOCOLS[0]!);
  const [minutes, setMinutes] = useState<'1' | '3' | '5'>('3');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(0);
  const totalMs = Number(minutes) * 60_000;

  const st = breathState(protocol, elapsed);

  // Reloj: se calcula desde la hora de inicio, así un tick perdido no desfasa la respiración.
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const t = Date.now() - startedAt.current;
      if (t >= totalMs) {
        setElapsed(totalMs);
        setRunning(false);
        setFinished(true);
        haptics.success();
        dispatch({ type: 'LOG_MIND', log: { at: new Date().toISOString(), protocol: protocol.id, seconds: Math.round(totalMs / 1000) } });
      } else {
        setElapsed(t);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, totalMs, protocol.id, dispatch]);

  // Pulsos de háptica al empezar cada fase (solo iPhone; en iPad no hacen nada).
  const phase = running ? st.phase : null;
  const cycle = st.cycle;
  useEffect(() => {
    if (phase === null) return undefined;
    const ms = (protocol.seconds[PHASE_INDEX[phase]] ?? 0) * 1000;
    const timers = pulsesFor(phase, ms).map((p) =>
      setTimeout(() => (p.kind === 'medium' ? haptics.medium() : p.kind === 'light' ? haptics.light() : haptics.soft()), p.at),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, cycle, protocol]);

  const begin = (): void => {
    startedAt.current = Date.now();
    setElapsed(0);
    setFinished(false);
    setRunning(true);
    haptics.medium();
  };

  const scale = st.phase === 'inhale' ? st.progress : st.phase === 'hold' ? 1 : st.phase === 'exhale' ? 1 - st.progress : 0;
  const orb = 120 + 110 * (running ? scale : 0.2);
  const secondsLeft = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));

  return (
    <>
      <GlassCard>
        <View style={styles.orbArea}>
          <View style={[styles.orb, { width: orb, height: orb, borderRadius: orb / 2, backgroundColor: colors.accentSoft, borderColor: colors.volt }]}>
            <AppText variant="title" tone="accent">
              {running ? PHASE_LABEL[st.phase] : finished ? 'Listo' : 'Respira'}
            </AppText>
            {running ? <AppText variant="digits">{Math.ceil(st.remainingSeconds)}</AppText> : null}
          </View>
        </View>
        <AppText variant="callout" tone="secondary" style={styles.center}>
          {running ? `Quedan ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : finished ? 'Sesión guardada. Suma a tu racha.' : protocol.description}
        </AppText>
        <View style={styles.row}>
          {running ? (
            <GlassButton label="Terminar" onPress={() => setRunning(false)} haptic="light" />
          ) : (
            <GlassButton label={finished ? 'Otra vez' : 'Empezar'} icon="wind" variant="primary" onPress={begin} />
          )}
        </View>
      </GlassCard>

      {!running ? (
        <>
          <View style={styles.chips}>
            {BREATH_PROTOCOLS.map((p) => (
              <Chip key={p.id} label={p.name} selected={p.id === protocol.id} onPress={() => setProtocol(p)} />
            ))}
          </View>
          <SegmentedControl
            options={[
              { value: '1', label: '1 min' },
              { value: '3', label: '3 min' },
              { value: '5', label: '5 min' },
            ]}
            value={minutes}
            onChange={setMinutes}
          />
          <AppText variant="caption" tone="secondary">Entrenamiento de calma y foco, no un tratamiento. Si te mareas, respira normal.</AppText>
        </>
      ) : null}
    </>
  );
}

type ReflexMode = 'simple' | 'gonogo';
type ReflexPhase = 'idle' | 'waiting' | 'go' | 'nogo' | 'between' | 'done';

const GO_WINDOW_MS = 1000;
const NOGO_WINDOW_MS = 900;

interface RunnerHooks {
  onPhase: (phase: ReflexPhase, flash: string | null) => void;
  onDone: (trials: ReflexTrial[]) => void;
}

/** Máquina de estados del test; vive fuera de React para que el cronómetro no dependa de renders. */
class ReflexRunner {
  private trials: ReflexTrial[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stimulusAt = 0;
  private phase: ReflexPhase = 'idle';

  constructor(private readonly mode: ReflexMode, private readonly total: number, private readonly hooks: RunnerHooks) {}

  start(): void {
    this.trials = [];
    this.next();
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private set(phase: ReflexPhase, flash: string | null = null): void {
    this.phase = phase;
    this.hooks.onPhase(phase, flash);
  }

  private after(ms: number, fn: () => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(fn, ms);
  }

  private record(trial: ReflexTrial, flash: string): void {
    this.trials.push(trial);
    if (this.timer) clearTimeout(this.timer);
    if (this.trials.length >= this.total) {
      this.set('done');
      this.hooks.onDone(this.trials);
      return;
    }
    this.set('between', flash);
    this.after(700, () => this.next());
  }

  private next(): void {
    this.set('waiting');
    const delay = 1500 + Math.random() * 2500;
    this.after(delay, () => {
      const noGo = this.mode === 'gonogo' && Math.random() < 0.25;
      this.stimulusAt = performance.now();
      this.set(noGo ? 'nogo' : 'go');
      if (noGo) this.after(NOGO_WINDOW_MS, () => this.record({ rtMs: null, noGo: true, falseStart: false }, 'Bien: no tocaste'));
      else this.after(GO_WINDOW_MS, () => this.record({ rtMs: null, noGo: false, falseStart: false }, 'Muy lento'));
    });
  }

  tap(): void {
    const rt = Math.round(performance.now() - this.stimulusAt);
    if (this.phase === 'waiting') this.record({ rtMs: null, noGo: false, falseStart: true }, 'Te adelantaste');
    else if (this.phase === 'go') this.record({ rtMs: rt, noGo: false, falseStart: false }, `${rt} ms`);
    else if (this.phase === 'nogo') this.record({ rtMs: rt, noGo: true, falseStart: false }, 'Ese no se tocaba');
  }
}

function ReflexPanel(): React.JSX.Element {
  const { colors } = useTheme();
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<ReflexMode>('simple');
  const [phase, setPhase] = useState<ReflexPhase>('idle');
  const [flash, setFlash] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReflexSummary | null>(null);
  const [runner, setRunner] = useState<ReflexRunner | null>(null);

  useEffect(() => () => runner?.dispose(), [runner]);

  const history = state.reflexLogs.filter((l) => l.mode === mode && l.medianMs !== null).map((l) => l.medianMs as number);
  const trend = summary?.medianMs != null ? reflexTrend(history, summary.medianMs) : null;

  const begin = (): void => {
    runner?.dispose();
    const total = mode === 'simple' ? 8 : 12;
    const next = new ReflexRunner(mode, total, {
      onPhase: (p, f) => {
        setPhase(p);
        setFlash(f);
      },
      onDone: (trials) => {
        const s = summarizeReflex(trials);
        setSummary(s);
        haptics.success();
        dispatch({ type: 'LOG_REFLEX', log: { at: new Date().toISOString(), mode, medianMs: s.medianMs, sdMs: s.sdMs, anticipations: s.anticipations, omissions: s.omissions, commissions: s.commissions, lapses: s.lapses } });
      },
    });
    setSummary(null);
    setRunner(next);
    next.start();
  };

  const active = phase === 'waiting' || phase === 'go' || phase === 'nogo' || phase === 'between';
  const background = phase === 'go' ? colors.success : phase === 'nogo' ? colors.danger : phase === 'waiting' ? colors.surfaceStrong : colors.surface;
  const label = phase === 'waiting' ? 'Espera…' : phase === 'go' ? '¡Toca!' : phase === 'nogo' ? 'NO toques' : phase === 'between' ? (flash ?? '') : 'Toca para empezar';

  return (
    <>
      <SegmentedControl
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'gonogo', label: 'Toca / no toques' },
        ]}
        value={mode}
        onChange={(m) => { if (!active) setMode(m); }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => {
          if (active) runner?.tap();
          else begin();
        }}
        style={[styles.pad, { backgroundColor: background, borderColor: colors.separator }]}
      >
        <AppText variant="title" tone={phase === 'go' || phase === 'nogo' ? 'onAccent' : 'primary'}>{label}</AppText>
      </Pressable>
      <AppText variant="callout" tone="secondary">
        {mode === 'simple' ? '8 intentos: toca en cuanto se ponga verde. Si te adelantas, no cuenta.' : '12 intentos: toca en el verde y NO toques en el rojo.'}
      </AppText>

      {summary ? (
        <GlassCard>
          <AppText variant="headline">Resultado</AppText>
          <AppText variant="digitsLarge" tone="accent">{summary.medianMs ?? '—'}<AppText variant="callout" tone="secondary"> ms</AppText></AppText>
          <AppText variant="callout" tone="secondary">
            Mediana de tus tiempos válidos{summary.sdMs !== null ? ` (variación ±${summary.sdMs} ms)` : ''}. Adelantos: {summary.anticipations}. Omisiones: {summary.omissions}.
            {mode === 'gonogo' ? ` Toques de más: ${summary.commissions}.` : ''} Lentos (más de 500 ms): {summary.lapses}.
          </AppText>
          {trend ? (
            <AppText variant="callout" tone={trend.deltaMs <= 0 ? 'success' : 'secondary'}>
              {trend.deltaMs <= 0 ? `${Math.abs(trend.deltaMs)} ms más rápido` : `${trend.deltaMs} ms más lento`} que tu línea base ({trend.baseline} ms).
            </AppText>
          ) : (
            <AppText variant="caption" tone="secondary">Tu línea base se arma con 3 sesiones.</AppText>
          )}
        </GlassCard>
      ) : null}

      <AppText variant="caption" tone="secondary">Entrenamiento, no evaluación clínica ni prueba de conmoción. Compárate solo contigo y con el mismo dispositivo.</AppText>
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  orbArea: { height: 260, alignItems: 'center', justifyContent: 'center' },
  orb: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  center: { textAlign: 'center', marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  list: { gap: spacing.sm },
  pad: { height: 240, borderRadius: radii.card, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});
