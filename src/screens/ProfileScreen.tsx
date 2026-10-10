import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { describeAiError, refineScouting } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { AppText, Chip, Columns, Disclosure, GlassButton, GlassCard, Screen, SectionHeader, Stepper, showActionSheet } from '../components/common';
import { NativeSegmented, NativeToggle } from '../components/native/NativeControls';
import { ensureNotificationPermission, refreshReminders } from '../services/reminders';
import { shareCard } from '../services/share';
import { PlayerCard3D } from '../components/specialized/PlayerCard3D';
import { ATTRIBUTE_LABELS, LEVEL_LABELS, POSITION_LABELS } from '../content/attributeLabels';
import { useAppDispatch, useAppState } from '../context';
import { toISODate } from '../core/dates';
import { levelProgress } from '../core/gamification';
import { computeOvr, headlineKeys } from '../core/ovr';
import { rankFor } from '../core/progression';
import { isHapticsSupported, spacing } from '../theme';
import type { AttributeKey } from '../types';

const SOURCE_LABEL = { estimado: 'Estimado', medido: 'Medido', ajustado: 'Ajustado' } as const;

export function ProfileScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const { player, settings } = state;
  const router = useRouter();
  const progress = levelProgress(state.gamification.xp);
  const access = useAiAccess();
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const cardRef = useRef<View>(null);
  const plan = { enabled: settings.remindersEnabled, hour: settings.reminderHour, activeToday: state.gamification.lastActiveDate === toISODate(new Date()), streak: state.gamification.streak };
  useEffect(() => {
    void refreshReminders(plan);
    // Se reprograma cuando cambia algo relevante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.enabled, plan.hour, plan.activeToday, plan.streak]);
  if (!player) return <Screen><AppText variant="body">Crea tu tarjeta para empezar.</AppText></Screen>;

  const ovr = computeOvr(player.position, player.attributes);
  const main = headlineKeys(player.position);
  const others = (Object.keys(player.attributes) as AttributeKey[]).filter((k) => !main.includes(k));

  const refine = async (): Promise<void> => {
    setAiNote(null);
    if (!access.config) {
      setAiNote(access.gate.allowed ? 'La IA no está disponible.' : access.gate.message);
      return;
    }
    setAiBusy(true);
    try {
      const attributes = await refineScouting(access.config, state);
      dispatch({ type: 'APPLY_ESTIMATES', attributes });
      setAiNote('Cifras refinadas. Las que ajustaste a mano o mediste no se tocan.');
    } catch (e) {
      setAiNote(describeAiError(e));
    } finally {
      setAiBusy(false);
    }
  };

  // Se usa la hoja de acciones (funciona en iPhone y en la web); Alert.alert no hace nada en el navegador.
  const confirmReset = (): void => {
    showActionSheet({
      title: 'Se borrarán tu tarjeta, tus sesiones, partidos, jugadas y la clave de la IA de este dispositivo. No se puede deshacer.',
      options: [
        {
          label: 'Borrar todos mis datos',
          destructive: true,
          onPress: () => {
            void access.saveAccessCode('');
            dispatch({ type: 'RESET_ALL' });
          },
        },
      ],
    });
  };

  const renderAttr = (key: AttributeKey): React.JSX.Element | null => {
    const attr = player.attributes[key];
    if (!attr) return null;
    return (
      <View key={key} style={styles.attr}>
        <Stepper
          label={`${ATTRIBUTE_LABELS[key].full} · ${SOURCE_LABEL[attr.source]}`}
          value={Math.round(attr.value)}
          min={25}
          max={99}
          onChange={(v) => dispatch({ type: 'SET_ATTRIBUTE', key, value: v, source: 'ajustado' })}
        />
      </View>
    );
  };

  const rankCard = (
    <GlassCard>
      <View style={styles.rankRow}>
        <View style={styles.flex}>
          <AppText variant="label" tone="secondary">Rango</AppText>
          <AppText variant="title">{rankFor(progress.level).name} · nivel {progress.level}</AppText>
          <AppText variant="caption" tone="secondary">{state.gamification.xp} XP · {state.achievements.length} logros</AppText>
        </View>
        <GlassButton label="Logros" icon="trophy.fill" size="compact" haptic="light" onPress={() => router.push('/logros')} />
      </View>
    </GlassCard>
  );

  const left = (
    <>
      <View ref={cardRef} collapsable={false}>
        <PlayerCard3D player={player} effect={settings.cardEffect} reduceMotion={settings.reduceMotion} />
      </View>
      <GlassButton
        label="Compartir tarjeta"
        icon="square.and.arrow.up"
        size="compact"
        haptic="light"
        onPress={() => { void shareCard(cardRef.current, `Soy ${rankFor(progress.level).name} (nivel ${progress.level}) en Fulbito, con ${state.gamification.streak} de racha. ¿Me alcanzas?`); }}
      />

      <GlassCard>
        <SectionHeader title={`${POSITION_LABELS[player.position]} · ${ovr}`} subtitle={`${LEVEL_LABELS[player.level]} · pie ${player.foot} · #${player.number}`} />
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Atributos principales" />
        <View style={styles.list}>{main.map(renderAttr)}</View>
      </GlassCard>

      {others.length > 0 ? (
        <Disclosure title="Otros atributos" summary={`${others.length}`}>
          <View style={styles.list}>{others.map(renderAttr)}</View>
        </Disclosure>
      ) : null}
    </>
  );

  const right = (
    <>
      {rankCard}
      <Disclosure title="Ajustes">
        <View style={styles.list}>
          <View style={styles.block}>
            <AppText variant="headline">Sensibilidad de la Preparación</AppText>
            <NativeSegmented
              options={[
                { value: 'estricto', label: 'Estricto' },
                { value: 'equilibrado', label: 'Equilibrado' },
                { value: 'permisivo', label: 'Permisivo' },
              ]}
              value={settings.readinessSensitivity}
              onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { readinessSensitivity: v } })}
            />
          </View>
          <Stepper label="Horas de sueño que quieres dormir" value={settings.sleepGoalHours} min={5} max={12} step={0.5} unit="h" onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { sleepGoalHours: v } })} />
          <NativeToggle
            label="Recordatorios"
            description="Un aviso diario y otro si tu racha está en riesgo."
            value={settings.remindersEnabled}
            onChange={(v) => {
              if (!v) return dispatch({ type: 'SET_SETTINGS', patch: { remindersEnabled: false } });
              void ensureNotificationPermission().then((ok) => dispatch({ type: 'SET_SETTINGS', patch: { remindersEnabled: ok } }));
            }}
          />
          {settings.remindersEnabled ? <Stepper label="Hora del recordatorio" value={settings.reminderHour} min={5} max={22} unit="h" onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { reminderHour: v } })} /> : null}
          <NativeToggle
            label="Háptica"
            description={isHapticsSupported() ? 'Vibraciones finas en cada interacción.' : 'Este dispositivo (iPad) no tiene motor de vibración.'}
            value={settings.hapticsEnabled}
            onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { hapticsEnabled: v } })}
          />
          <View style={styles.block}>
            <AppText variant="headline">Brillo del efecto de la tarjeta</AppText>
            <NativeSegmented
              options={[
                { value: '0', label: 'Apagado' },
                { value: '1', label: 'Suave' },
                { value: '2', label: 'Medio' },
                { value: '3', label: 'Máximo' },
              ]}
              value={String(settings.cardEffect) as '0' | '1' | '2' | '3'}
              onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { cardEffect: Number(v) as 0 | 1 | 2 | 3 } })}
            />
          </View>
          <NativeToggle
            label="Reducir movimiento"
            description="Además del ajuste del sistema, la tarjeta se queda quieta."
            value={settings.reduceMotion}
            onChange={(v) => dispatch({ type: 'SET_SETTINGS', patch: { reduceMotion: v } })}
          />
        </View>
      </Disclosure>

      <Disclosure title="IA y Coach" summary={access.config ? 'Conectada' : 'Sin conectar'}>
        <View style={styles.list}>
          <AppText variant="callout" tone="secondary">Sin IA, el coach local sigue funcionando.</AppText>
          <GlassButton label={access.config ? 'Ver la conexión de la IA' : 'Conectar la IA'} icon="sparkles" variant={access.config ? 'secondary' : 'go'} haptic="medium" onPress={() => router.push('/ia')} />
          <AppText variant="caption" tone="secondary">Tono del coach</AppText>
          <View style={styles.wrapRow}>
            {(['exigente', 'motivador', 'cientifico', 'calmado'] as const).map((p) => (
              <Chip key={p} label={p === 'cientifico' ? 'Científico' : p.charAt(0).toUpperCase() + p.slice(1)} selected={settings.coachPersona === p} onPress={() => dispatch({ type: 'SET_SETTINGS', patch: { coachPersona: p } })} />
            ))}
          </View>
          <GlassButton label={aiBusy ? 'Refinando…' : 'Refinar mis cifras con IA'} icon="sparkles" size="compact" haptic="medium" disabled={aiBusy} onPress={() => { void refine(); }} />
          {aiNote ? <AppText variant="callout" tone="secondary">{aiNote}</AppText> : null}
        </View>
      </Disclosure>

      <Disclosure title="Tus datos" summary="En este dispositivo">
        <GlassButton label="Borrar todos mis datos" icon="trash" variant="danger" haptic="warning" onPress={confirmReset} />
      </Disclosure>
      <AppText variant="caption" tone="secondary" style={{ textAlign: 'center', marginTop: spacing.lg }}>
        © {new Date().getFullYear()} Fulbito. Todos los derechos reservados.
      </AppText>
    </>
  );

  return (
    <Screen nativeHeader wide title="Perfil">
      <Columns left={left} right={right} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  rankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  note: { marginTop: spacing.sm },
  list: { gap: spacing.md, marginTop: spacing.md },
  attr: { paddingVertical: 2 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  block: { gap: spacing.md, marginTop: spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: { fontSize: 17, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
