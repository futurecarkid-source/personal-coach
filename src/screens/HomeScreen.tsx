import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { describeAiError, requestAiPlan } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { AppText, Chip, FaceRating, GlassButton, GlassCard, Icon, ProgressBar, Screen, SectionHeader, Stepper } from '../components/common';
import { PainFollowUpCard } from '../components/specialized/PainFollowUpCard';
import { ReadinessRing } from '../components/specialized/ReadinessRing';
import { useReadiness } from '../hooks/useReadiness';
import { BODY_ZONE_LABELS } from '../content/attributeLabels';
import { EXERCISE_BY_ID } from '../content/exercises';
import { useAppDispatch, useAppState } from '../context';
import { newId, weekdayMonday0 } from '../core/dates';
import { levelProgress } from '../core/gamification';
import { useWeekPlan } from '../hooks/useTodayPlan';
import { deletePhoto } from '../services/photoStore';
import { spacing, useTheme } from '../theme';
import { BODY_ZONES, isMinor, type BodyZone, type CheckIn, type PlannedSession } from '../types';

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

const KIND_ICON = {
  fuerza: 'dumbbell.fill',
  prevencion: 'shield.fill',
  velocidad: 'bolt.fill',
  tecnica: 'soccerball',
  recuperacion: 'leaf.fill',
  descanso: 'moon.fill',
} as const;

export function HomeScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { colors } = useTheme();
  const { today, week, todaySession, usingAi } = useWeekPlan();
  const access = useAiAccess();
  const readiness = useReadiness();
  const todaySleep = state.sleepLogs.find((l) => l.date === today) ?? null;
  const [sleepHours, setSleepHours] = useState(todaySleep?.hours ?? state.settings.sleepGoalHours - 0.5);
  const [sleepQuality, setSleepQuality] = useState<number | null>(todaySleep ? todaySleep.quality * 2 : null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const player = state.player;
  const todayCheckIn = state.checkIns.find((c) => c.date === today) ?? null;
  const [mood, setMood] = useState<number | null>(todayCheckIn?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(todayCheckIn?.energy ?? null);
  const [soreness, setSoreness] = useState<number>(todayCheckIn?.soreness ?? 2);
  const [zones, setZones] = useState<BodyZone[]>(todayCheckIn?.zones ?? []);
  const [editing, setEditing] = useState(todayCheckIn === null);
  const progress = levelProgress(state.gamification.xp);
  const weekly = player ? isMinor(player.ageBand) : false;

  const saveCheckIn = (): void => {
    if (mood === null || energy === null) return;
    const checkIn: CheckIn = { id: newId('ci'), date: today, mood, energy, soreness, zones };
    dispatch({ type: 'ADD_CHECKIN', checkIn });
    setEditing(false);
  };

  const generateAiPlan = async (): Promise<void> => {
    setAiMessage(null);
    if (!access.config) {
      setAiMessage(access.gate.allowed ? 'La IA no está disponible.' : access.gate.message);
      return;
    }
    setAiBusy(true);
    try {
      const { plan } = await requestAiPlan(access.config, state, today, todaySession, new Date().toISOString());
      dispatch({ type: 'SET_AI_PLAN', plan });
      setAiMessage(plan.rationale || 'Plan con IA listo.');
    } catch (e) {
      setAiMessage(describeAiError(e));
    } finally {
      setAiBusy(false);
    }
  };

  const activePain = state.painReports.filter((r) => r.status === 'activo');
  const sessionIsRest = todaySession?.kind === 'descanso';
  const restRegistered = state.gamification.lastActiveDate === today;

  return (
    <Screen nativeHeader>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <AppText variant="caption" tone="secondary">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
          <AppText variant="title">Hola, {player?.nickname ?? 'jugador'}</AppText>
        </View>
        <GlassButton label="Coach" icon="bubble.left.fill" size="compact" haptic="medium" onPress={() => router.push('/coach')} />
      </View>

      <GlassCard>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Icon name="flame.fill" size={28} color={colors.accent} />
            <View>
              <AppText variant="digits">{state.gamification.streak} {weekly ? (state.gamification.streak === 1 ? 'semana' : 'semanas') : state.gamification.streak === 1 ? 'día' : 'días'}</AppText>
              <AppText variant="caption" tone="secondary">Racha de compromiso · mejor {state.gamification.bestStreak}</AppText>
            </View>
          </View>
          <View style={styles.right}>
            <AppText variant="headline">Nivel {progress.level}</AppText>
            <AppText variant="caption" tone="secondary">{state.gamification.xp} XP</AppText>
          </View>
        </View>
        <View style={styles.spacer} />
        <ProgressBar fraction={progress.fraction} />
        <AppText variant="caption" tone="secondary" style={styles.caption}>
          {state.gamification.freezes} congelador{state.gamification.freezes === 1 ? '' : 'es'} de racha · el descanso programado no rompe tu racha
        </AppText>
      </GlassCard>

      <ReadinessRing readiness={readiness} />

      <GlassCard>
        <SectionHeader title="Sueño de anoche" subtitle={`Tu meta: ${state.settings.sleepGoalHours} h`} />
        <View style={styles.block}>
          <Stepper label="Horas dormidas" value={sleepHours} min={0} max={14} step={0.5} unit="h" onChange={setSleepHours} />
          <FaceRating label="Calidad del sueño" value={sleepQuality} onChange={setSleepQuality} />
          <GlassButton
            label={todaySleep ? 'Actualizar sueño' : 'Guardar sueño'}
            icon="moon.zzz.fill"
            size="compact"
            haptic="success"
            disabled={sleepQuality === null}
            onPress={() => sleepQuality !== null && dispatch({ type: 'LOG_SLEEP', log: { date: today, hours: sleepHours, quality: Math.max(1, Math.min(5, Math.round(sleepQuality / 2))) } })}
          />
          {sleepHours < state.settings.sleepGoalHours - 1.5 ? <AppText variant="caption" tone="secondary">Dormir menos de lo que necesitas baja tu Preparación. Hoy protege tu descanso de esta noche.</AppText> : null}
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Sesión de hoy" />
        {todaySession ? (
          <View style={styles.block}>
            <AppText variant="headline">{todaySession.title}</AppText>
            {sessionIsRest ? (
              <>
                <AppText variant="callout" tone="secondary">Descanso programado. Descansar también es entrenar.</AppText>
                <GlassButton
                  label={restRegistered ? 'Descanso registrado' : 'Registrar descanso'}
                  icon="moon.fill"
                  variant="secondary"
                  haptic="success"
                  disabled={restRegistered}
                  onPress={() => dispatch({ type: 'REGISTER_REST_DAY', date: today })}
                />
              </>
            ) : (
              <>
                <AppText variant="callout" tone="secondary">
                  {todaySession.exerciseIds.length} ejercicios · unos {todaySession.estimatedMinutes} min
                </AppText>
                <View style={styles.list}>
                  {todaySession.exerciseIds.slice(0, 5).map((id) => (
                    <AppText key={id} variant="callout">• {EXERCISE_BY_ID.get(id)?.name ?? id}</AppText>
                  ))}
                  {todaySession.exerciseIds.length > 5 ? <AppText variant="callout" tone="secondary">y {todaySession.exerciseIds.length - 5} más</AppText> : null}
                </View>
                <GlassButton label="Empezar ejercicio" icon="play.fill" variant="primary" haptic="heavy" onPress={() => router.push('/workout')} />
              </>
            )}
          </View>
        ) : null}
        <View style={styles.block}>
          <GlassButton label={aiBusy ? 'Creando tu plan…' : usingAi ? 'Actualizar plan con IA' : 'Plan con IA'} icon="sparkles" size="compact" haptic="medium" disabled={aiBusy} onPress={() => { void generateAiPlan(); }} />
          {usingAi ? <AppText variant="caption" tone="secondary">Estás usando un plan hecho con IA y revisado por las reglas de seguridad.</AppText> : null}
          {aiMessage ? <AppText variant="callout" tone="secondary">{aiMessage}</AppText> : null}
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="¿Cómo te sientes hoy?" right={!editing ? <GlassButton label="Editar" size="compact" haptic="light" onPress={() => setEditing(true)} /> : undefined} />
        {editing ? (
          <View style={styles.block}>
            <FaceRating label="Ánimo" value={mood} onChange={setMood} />
            <FaceRating label="Energía" value={energy} onChange={setEnergy} />
            <AppText variant="callout" tone="secondary">Molestias o dolor muscular</AppText>
            <View style={styles.wrap}>
              <Chip label="Nada" selected={soreness <= 2} onPress={() => { setSoreness(2); setZones([]); }} />
              <Chip label="Leve" selected={soreness > 2 && soreness < 7} onPress={() => setSoreness(5)} />
              <Chip label="Fuerte" selected={soreness >= 7} onPress={() => setSoreness(8)} />
            </View>
            {soreness > 2 ? (
              <View style={styles.wrap}>
                {BODY_ZONES.map((z) => (
                  <Chip key={z} label={BODY_ZONE_LABELS[z]} selected={zones.includes(z)} onPress={() => setZones((l) => (l.includes(z) ? l.filter((x) => x !== z) : [...l, z]))} />
                ))}
              </View>
            ) : null}
            {soreness >= 7 ? (
              <AppText variant="callout" tone="danger">Si el dolor es fuerte, no mejora o limita tu movimiento, busca evaluación de un profesional. Hoy te proponemos recuperación.</AppText>
            ) : null}
            <GlassButton label="Guardar check-in" icon="checkmark" variant="primary" haptic="success" disabled={mood === null || energy === null} onPress={saveCheckIn} />
          </View>
        ) : (
          <AppText variant="callout" tone="secondary">
            Registrado hoy: ánimo {todayCheckIn?.mood}/10, energía {todayCheckIn?.energy}/10{todayCheckIn && todayCheckIn.soreness > 2 ? `, molestias ${todayCheckIn.soreness}/10` : ''}.
          </AppText>
        )}
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Dolor y lesiones" right={<GlassButton label="Tengo un dolor" icon="cross.case.fill" size="compact" haptic="medium" onPress={() => router.push('/pain')} />} />
        {activePain.length === 0 ? <AppText variant="callout" tone="secondary" style={styles.caption}>Sin dolores activos. Si algo te molesta, repórtalo: revisamos señales de alarma y cuidamos tu plan.</AppText> : null}
      </GlassCard>
      {activePain.map((report) => (
        <PainFollowUpCard
          key={report.id}
          report={report}
          allReports={state.painReports}
          onFollowUp={(id, intensity, photo) => dispatch({ type: 'ADD_PAIN_FOLLOWUP', reportId: id, followUp: { at: new Date().toISOString(), intensity, note: '', ...(photo ? { photo } : {}) } })}
          onResolve={(id) => {
            // Al resolverse el dolor, las fotos asociadas se borran del dispositivo.
            const target = state.painReports.find((r) => r.id === id);
            if (target?.photo) deletePhoto(target.photo.uri);
            target?.followUps.forEach((f) => f.photo && deletePhoto(f.photo.uri));
            dispatch({ type: 'RESOLVE_PAIN', reportId: id });
          }}
          onProfessionalCleared={(id) => dispatch({ type: 'CLEAR_PAIN_BLOCK', reportId: id })}
        />
      ))}

      <GlassCard>
        <SectionHeader title="Tu semana" />
        <View style={styles.weekRow}>
          {week.map((s) => (
            <DayDot key={s.date} session={s} isToday={s.date === today} />
          ))}
        </View>
      </GlassCard>
    </Screen>
  );
}

function DayDot({ session, isToday }: { session: PlannedSession; isToday: boolean }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.day}>
      <AppText variant="caption" tone="secondary">{DAY_LETTERS[weekdayMonday0(session.date)]}</AppText>
      <View style={[styles.dot, { backgroundColor: isToday ? colors.accent : colors.surfaceStrong }]}>
        <Icon name={KIND_ICON[session.kind]} size={16} color={isToday ? colors.textOnAccent : colors.textSecondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  right: { alignItems: 'flex-end' },
  spacer: { height: spacing.md },
  caption: { marginTop: spacing.sm },
  block: { gap: spacing.md, marginTop: spacing.md },
  list: { gap: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  day: { alignItems: 'center', gap: 6 },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
