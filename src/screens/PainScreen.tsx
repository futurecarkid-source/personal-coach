import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { askPainFollowup, buildProfileContext, describeAiError, type PainFollowupOutput } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { AppText, Chip, GlassButton, GlassCard, Screen, SectionHeader, Stepper } from '../components/common';
import { BODY_ZONE_LABELS } from '../content/attributeLabels';
import { useAppDispatch, useAppState } from '../context';
import { newId } from '../core/dates';
import {
  EMPTY_SCREENING_INPUT,
  PAIN_KINDS,
  PAIN_MECHANISMS,
  SCREENING_DISCLAIMER,
  screenPain,
  type PainKind,
  type PainMechanism,
  type PainScreening,
  type PainScreeningInput,
} from '../core/painSafety';
import { BACK_ONLY, BodyMap } from '../components/specialized/BodyMap';
import { PainPhoto } from '../components/specialized/PainPhoto';
import { haptics, spacing } from '../theme';
import { BODY_ZONES, type BodyZone, type PainPhoto as PainPhotoValue, type PainReport, type PainSide } from '../types';

const MECHANISM_LABEL: Record<PainMechanism, string> = { golpe: 'Un golpe', giro: 'Un giro o torcedura', sobrecarga: 'Sobrecarga o repetición', sin_causa: 'No sé / sin causa' };
const KIND_LABEL: Record<PainKind, string> = { punzante: 'Punzante', tiron: 'Tirón', ardor: 'Ardor', rigidez: 'Rigidez', sordo: 'Sordo o constante' };

type Flag = Exclude<keyof PainScreeningInput, 'zone' | 'intensity' | 'mechanism' | 'canUseNormally' | 'daysSinceOnset'>;

interface FlagDef {
  key: Flag;
  label: string;
  zones?: readonly BodyZone[];
}

const FLAGS: readonly FlagDef[] = [
  { key: 'visibleDeformity', label: 'Hay una deformidad visible' },
  { key: 'numbnessOrWeakness', label: 'Perdí fuerza o sensibilidad de golpe' },
  { key: 'rapidSwelling', label: 'Se hinchó mucho en menos de 2 horas' },
  { key: 'heardCrack', label: 'Sentí un “crack” o un desgarro' },
  { key: 'boneTenderness', label: 'Duele al presionar un punto del hueso' },
  { key: 'nightOrRestPain', label: 'Duele en reposo o por la noche' },
  { key: 'fever', label: 'Tengo fiebre o malestar general' },
  { key: 'chestOrBreathing', label: 'Tengo dolor en el pecho o falta de aire' },
  { key: 'calfSwellingHeat', label: 'La pantorrilla está hinchada, caliente o enrojecida', zones: ['gemelo', 'aquiles', 'tobillo'] },
  { key: 'jointLockedOrGivingWay', label: 'La rodilla se bloquea o se “sale”', zones: ['rodilla'] },
  { key: 'headBlowWithSymptoms', label: 'Tras un golpe: dolor de cabeza, mareo, confusión, visión borrosa o náuseas', zones: ['cabeza', 'cuello'] },
  { key: 'headEmergencySigns', label: 'Perdí el conocimiento, tuve convulsión, vomito repetidamente o veo doble', zones: ['cabeza', 'cuello'] },
  { key: 'saddleOrBladder', label: 'Entumecimiento en entrepierna o glúteos, o no controlo orina o heces', zones: ['lumbar'] },
  { key: 'legWeaknessWorsening', label: 'Debilidad o entumecimiento que empeora en las piernas', zones: ['lumbar'] },
];

const GENERAL_TIPS = [
  'Reduce la carga de esa zona y evita lo que aumente el dolor.',
  'Muévete con suavidad y sin dolor; no fuerces el rango.',
  'Vuelve a la actividad poco a poco, solo si el dolor no aumenta durante ni después.',
  'Te preguntaré cómo vas en 24 horas, 48 y 72.',
];

/**
 * Reporte de dolor nuevo. Primero se evalúan reglas locales de alerta (sin IA).
 * Con urgencias o alerta no se ofrecen ejercicios ni IA; la zona queda protegida en tu plan.
 */
export function PainScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const access = useAiAccess();
  const params = useLocalSearchParams<{ zone?: string }>();
  const presetZone = BODY_ZONES.find((z) => z === params.zone);
  const [input, setInput] = useState<PainScreeningInput>({ ...EMPTY_SCREENING_INPUT, intensity: 3, ...(presetZone ? { zone: presetZone } : {}) });
  const [kind, setKind] = useState<PainKind>('sordo');
  const [side, setSide] = useState<PainSide>('centro');
  const [view, setView] = useState<'frente' | 'espalda'>(presetZone && BACK_ONLY.includes(presetZone) ? 'espalda' : 'frente');
  const [photo, setPhoto] = useState<PainPhotoValue | null>(null);
  const [result, setResult] = useState<PainScreening | null>(null);
  const [report, setReport] = useState<PainReport | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOut, setAiOut] = useState<PainFollowupOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const set = <K extends keyof PainScreeningInput>(key: K, value: PainScreeningInput[K]): void => setInput((p) => ({ ...p, [key]: value }));
  const visibleFlags = FLAGS.filter((f) => !f.zones || f.zones.includes(input.zone));

  const submit = (): void => {
    const screening = screenPain(input);
    const saved: PainReport = {
      id: newId('pain'),
      zone: input.zone,
      side,
      photo,
      createdAt: new Date().toISOString(),
      intensity: input.intensity,
      mechanism: input.mechanism,
      kind,
      canUseNormally: input.canUseNormally,
      swelling: input.rapidSwelling,
      level: screening.level,
      ruleIds: screening.ruleIds,
      followUps: [],
      status: 'activo',
      clearedByProfessional: false,
    };
    dispatch({ type: 'ADD_PAIN_REPORT', report: saved });
    setResult(screening);
    setReport(saved);
    if (screening.level === 'urgencias') haptics.error();
    else if (screening.level === 'consulta') haptics.warning();
    else haptics.success();
  };

  const askAi = async (): Promise<void> => {
    const profile = buildProfileContext(state);
    if (!access.config || !profile || !report) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const out = await askPainFollowup(
        access.config,
        {
          profile,
          report: { zone: report.zone, side: report.side, intensity: report.intensity, kind: report.kind, daysSinceOnset: input.daysSinceOnset, canWalk: report.canUseNormally, swelling: report.swelling },
          history: [],
          question: '',
        },
        report.level,
      );
      setAiOut(out);
      if (out.level === 'descansar' || out.level === 'consultar') dispatch({ type: 'RAISE_PAIN_LEVEL', reportId: report.id, level: 'consulta' });
    } catch (e) {
      setAiError(describeAiError(e));
    } finally {
      setAiBusy(false);
    }
  };

  if (result && report) {
    const urgent = result.level === 'urgencias';
    const alert = result.level === 'consulta';
    return (
      <Screen tabBarSpace={false} plain>
        <SectionHeader title={urgent ? 'Busca atención ahora' : alert ? 'Conviene que te evalúe un profesional' : 'Dolor registrado'} />
        <GlassCard tint={urgent ? '#B3261E' : alert ? '#E0A100' : undefined}>
          {urgent || alert ? (
            <View style={styles.block}>
              <AppText variant="body" tone={urgent || alert ? 'primary' : 'primary'}>
                Por lo que cuentas, te recomendamos que te evalúe un profesional{urgent ? ' cuanto antes (urgencias si empeora)' : ''}. No entrenes esa zona hasta entonces. En una emergencia llama al número de emergencias de tu país.
              </AppText>
              {result.reasons.map((r) => (
                <AppText key={r} variant="callout">• {r}</AppText>
              ))}
              {result.stopTrainingToday ? <AppText variant="callout" tone="danger">Hoy no entrenes. Si hubo un golpe en la cabeza, no te quedes solo.</AppText> : null}
              <AppText variant="caption" tone="secondary">{SCREENING_DISCLAIMER}</AppText>
            </View>
          ) : (
            <View style={styles.block}>
              <AppText variant="body">Tu plan evitará esa zona mientras haya dolor. Mientras tanto:</AppText>
              {GENERAL_TIPS.map((t) => (
                <AppText key={t} variant="callout">• {t}</AppText>
              ))}
              <AppText variant="caption" tone="secondary">Esto te ayuda a decidir próximos pasos, no es un diagnóstico. Si el dolor es fuerte, no mejora o aparece alguna señal de alarma, busca atención presencial.</AppText>
            </View>
          )}
        </GlassCard>

        {result.level === 'ok' ? (
          <GlassCard>
            <SectionHeader title="Orientación con IA" subtitle="Opcional" />
            {aiOut ? (
              <View style={styles.block}>
                <AppText variant="body">{aiOut.summary}</AppText>
                {aiOut.tips.map((t) => <AppText key={t} variant="callout">• {t}</AppText>)}
                {aiOut.questions.length > 0 ? <AppText variant="callout" tone="secondary">Preguntas para mañana: {aiOut.questions.join(' · ')}</AppText> : null}
                <AppText variant="callout" tone={aiOut.level === 'seguir' ? 'success' : 'danger'}>
                  Nivel sugerido: {aiOut.level === 'seguir' ? 'puedes seguir con cuidado' : aiOut.level === 'moderar' ? 'carga menos' : aiOut.level === 'descansar' ? 'descansa esa zona' : 'consulta a un profesional'}
                </AppText>
                <AppText variant="caption" tone="secondary">Respuesta generada por IA. Puede contener errores y no es consejo médico.</AppText>
              </View>
            ) : access.config ? (
              <View style={styles.block}>
                <AppText variant="callout" tone="secondary">Se envían a la IA solo la zona, el lado, la intensidad, el tipo de dolor y tus datos mínimos de perfil. Nunca fotos.</AppText>
                {aiError ? <AppText variant="callout" tone="danger">{aiError}</AppText> : null}
                <GlassButton label={aiBusy ? 'Consultando…' : 'Pedir orientación a la IA'} icon="sparkles" disabled={aiBusy} onPress={() => { void askAi(); }} />
              </View>
            ) : (
              <AppText variant="callout" tone="secondary">{access.gate.allowed ? '' : access.gate.message}</AppText>
            )}
          </GlassCard>
        ) : null}

        <GlassButton label="Listo" variant="primary" icon="checkmark" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen tabBarSpace={false} plain>
      <SectionHeader title="Reportar un dolor" />
      <GlassCard>
        <AppText variant="caption" tone="secondary">¿Dónde duele?</AppText>
        <BodyMap
          zone={input.zone}
          side={side}
          view={view}
          onViewChange={setView}
          onSelect={(z, sd) => {
            haptics.selection();
            set('zone', z);
            setSide(sd);
          }}
        />
        <AppText variant="caption" tone="secondary" style={styles.label}>O elige de la lista</AppText>
        <View style={styles.wrap}>
          {BODY_ZONES.map((z) => (
            <Chip
              key={z}
              label={BODY_ZONE_LABELS[z]}
              selected={input.zone === z}
              onPress={() => {
                set('zone', z);
                setSide('centro');
                if (BACK_ONLY.includes(z)) setView('espalda');
              }}
            />
          ))}
        </View>
        <View style={styles.gap} />
        <Stepper label="Intensidad (0 nada, 10 insoportable)" value={input.intensity} min={0} max={10} onChange={(v) => set('intensity', v)} />
        <View style={styles.gap} />
        <Stepper label="Días desde que empezó" value={input.daysSinceOnset} min={0} max={60} onChange={(v) => set('daysSinceOnset', v)} />
        <AppText variant="caption" tone="secondary" style={styles.label}>¿Qué lo causó?</AppText>
        <View style={styles.wrap}>
          {PAIN_MECHANISMS.map((m) => (
            <Chip key={m} label={MECHANISM_LABEL[m]} selected={input.mechanism === m} onPress={() => set('mechanism', m)} />
          ))}
        </View>
        <AppText variant="caption" tone="secondary" style={styles.label}>¿Cómo se siente?</AppText>
        <View style={styles.wrap}>
          {PAIN_KINDS.map((k) => (
            <Chip key={k} label={KIND_LABEL[k]} selected={kind === k} onPress={() => setKind(k)} />
          ))}
        </View>
      </GlassCard>

      <GlassCard>
        <AppText variant="headline">Foto (opcional)</AppText>
        <View style={styles.top}>
          <PainPhoto value={photo} onChange={setPhoto} />
        </View>
      </GlassCard>

      <GlassCard>
        <AppText variant="headline">Marca lo que aplique</AppText>
        <View style={[styles.wrap, styles.top]}>
          <Chip label="No puedo apoyar o mover con normalidad" selected={!input.canUseNormally} onPress={() => set('canUseNormally', !input.canUseNormally)} />
          {visibleFlags.map((f) => (
            <Chip key={f.key} label={f.label} selected={Boolean(input[f.key])} onPress={() => set(f.key, !input[f.key])} />
          ))}
        </View>
      </GlassCard>

      <GlassButton label="Revisar mi dolor" icon="checkmark.shield" variant="primary" haptic="medium" onPress={submit} />
      <AppText variant="caption" tone="secondary">
        Fulbito no diagnostica ni trata lesiones. Si es una emergencia, llama al número de emergencias de tu país.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  top: { marginTop: spacing.md },
  block: { gap: spacing.sm },
  gap: { height: spacing.md },
  label: { marginTop: spacing.lg },
});
