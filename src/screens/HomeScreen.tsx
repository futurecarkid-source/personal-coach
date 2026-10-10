import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { describeAiError, requestAiPlan } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { AppText, Columns, GlassButton, GlassCard, Icon, Screen } from '../components/common';
import { HydrationCard } from '../components/specialized/HydrationCard';
import { HeroCard } from '../components/specialized/HeroCard';
import { PainFollowUpCard } from '../components/specialized/PainFollowUpCard';
import { QuestsCard } from '../components/specialized/QuestsCard';
import { QuickCheckIn } from '../components/specialized/QuickCheckIn';
import { ReadinessRing } from '../components/specialized/ReadinessRing';
import { useReadiness } from '../hooks/useReadiness';
import { EXERCISE_BY_ID } from '../content/exercises';
import { useAppDispatch, useAppState } from '../context';
import { weekdayMonday0 } from '../core/dates';
import { useWeekPlan } from '../hooks/useTodayPlan';
import { deletePhoto } from '../services/photoStore';
import { spacing, useTheme } from '../theme';
import { isMinor, type PlannedSession } from '../types';

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
  const { today, week, todaySession, usingAi } = useWeekPlan();
  const access = useAiAccess();
  const readiness = useReadiness();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const player = state.player;
  const weekly = player ? isMinor(player.ageBand) : false;

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

  const left = (
    <>
      <HeroCard gamification={state.gamification} weekly={weekly} achievementCount={state.achievements.length} onPress={() => router.push('/logros')} />

      <GlassCard>
        <AppText variant="label" tone="secondary">Hoy</AppText>
        {todaySession ? (
          <View style={styles.block}>
            <AppText variant="title">{todaySession.title}</AppText>
            {sessionIsRest ? (
              <>
                <AppText variant="callout" tone="secondary">Descanso programado.</AppText>
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
                  {todaySession.exerciseIds.slice(0, 4).map((id) => (
                    <AppText key={id} variant="callout">• {EXERCISE_BY_ID.get(id)?.name ?? id}</AppText>
                  ))}
                  {todaySession.exerciseIds.length > 4 ? <AppText variant="callout" tone="secondary">y {todaySession.exerciseIds.length - 4} más</AppText> : null}
                </View>
                <GlassButton label="Empezar" icon="play.fill" variant="go" haptic="heavy" fullWidth onPress={() => router.push('/workout')} />
              </>
            )}
          </View>
        ) : null}
        <View style={styles.block}>
          <GlassButton label={aiBusy ? 'Creando tu plan…' : usingAi ? 'Plan con IA ✓' : 'Plan con IA'} icon="sparkles" variant="ghost" size="compact" haptic="medium" disabled={aiBusy} onPress={() => { void generateAiPlan(); }} />
          {aiMessage ? <AppText variant="caption" tone="secondary">{aiMessage}</AppText> : null}
        </View>
      </GlassCard>

      <ReadinessRing readiness={readiness} />
    </>
  );

  const right = (
    <>
      <QuestsCard state={state} date={today} onClaim={(key, xp) => dispatch({ type: 'CLAIM_QUEST', key, xp })} />

      <QuickCheckIn today={today} />

      <HydrationCard glasses={state.waterLogs.find((w) => w.date === today)?.glasses ?? 0} onChange={(g) => dispatch({ type: 'SET_WATER', date: today, glasses: g })} />

      <GlassCard>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <AppText variant="label" tone="secondary">Cuerpo</AppText>
            <AppText variant="headline">{activePain.length === 0 ? 'Sin dolores activos' : `${activePain.length} dolor${activePain.length === 1 ? '' : 'es'} en seguimiento`}</AppText>
          </View>
          <GlassButton label="Tengo un dolor" icon="cross.case.fill" size="compact" haptic="medium" onPress={() => router.push('/pain')} />
        </View>
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
        <AppText variant="label" tone="secondary">Tu semana</AppText>
        <View style={styles.weekRow}>
          {week.map((s) => (
            <DayDot key={s.date} session={s} isToday={s.date === today} done={state.sessionLogs.some((l) => l.date === s.date)} />
          ))}
        </View>
      </GlassCard>
    </>
  );

  return (
    <Screen nativeHeader wide title="Hoy">
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <AppText variant="caption" tone="secondary">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
          <AppText variant="title">Hola, {player?.nickname ?? 'jugador'}</AppText>
        </View>
        <GlassButton label="Coach" icon="bubble.left.fill" size="compact" haptic="medium" onPress={() => router.push('/coach')} />
      </View>
      <Columns left={left} right={right} />
    </Screen>
  );
}

function DayDot({ session, isToday, done }: { session: PlannedSession; isToday: boolean; done: boolean }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.day}>
      <AppText variant="caption" tone="secondary">{DAY_LETTERS[weekdayMonday0(session.date)]}</AppText>
      <View style={[styles.dot, { backgroundColor: done ? colors.success : isToday ? colors.volt : colors.surfaceStrong }]}>
        <Icon name={done ? 'checkmark' : KIND_ICON[session.kind]} size={16} color={done || isToday ? colors.textOnAccent : colors.textSecondary} />
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
