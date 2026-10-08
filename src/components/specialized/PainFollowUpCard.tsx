import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { askPainFollowup, buildProfileContext, describeAiError, type PainFollowupOutput } from '../../ai';
import { useAiAccess } from '../../ai/useAi';
import { BODY_ZONE_LABELS } from '../../content/attributeLabels';
import { useAppDispatch, useAppState } from '../../context';
import { assessProgress, dueFollowUp, type ProgressAssessment } from '../../core/painSafety';
import { spacing } from '../../theme';
import type { PainPhoto as PainPhotoValue, PainReport } from '../../types';
import { AppText } from '../common/AppText';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';
import { Stepper } from '../common/Stepper';
import { PainPhoto } from './PainPhoto';

const DAY_MS = 86_400_000;

export interface PainFollowUpCardProps {
  report: PainReport;
  allReports: readonly PainReport[];
  onFollowUp: (reportId: string, intensity: number, photo?: PainPhotoValue) => void;
  onResolve: (reportId: string) => void;
  onProfessionalCleared: (reportId: string) => void;
}

/** Seguimiento automático: a las 24, 48 y 72 h y luego cada semana pregunta cómo va el dolor. */
export function PainFollowUpCard({ report, allReports, onFollowUp, onResolve, onProfessionalCleared }: PainFollowUpCardProps): React.JSX.Element | null {
  const last = report.followUps[report.followUps.length - 1];
  const [intensity, setIntensity] = useState(last ? last.intensity : report.intensity);
  const [assessment, setAssessment] = useState<ProgressAssessment | null>(null);
  const [photo, setPhoto] = useState<PainPhotoValue | null>(null);
  const [aiOut, setAiOut] = useState<PainFollowupOutput | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const access = useAiAccess();
  // La hora se fija al abrir la tarjeta; se vuelve a leer al guardar.
  const [now] = useState(() => Date.now());
  const due = dueFollowUp(report, now) !== null;
  const recurrences = allReports.filter((r) => r.zone === report.zone && now - Date.parse(r.createdAt) <= 60 * DAY_MS).length;
  const blocked = report.level !== 'ok' && !report.clearedByProfessional;

  const save = (): void => {
    onFollowUp(report.id, intensity, photo ?? undefined);
    setPhoto(null);
    const saveTime = Date.now();
    const simulated = { ...report, followUps: [...report.followUps, { at: new Date(saveTime).toISOString(), intensity, note: '' }] };
    setAssessment(assessProgress(simulated, saveTime, recurrences));
  };

  const askAi = async (): Promise<void> => {
    const profile = buildProfileContext(state);
    if (!access.config || !profile) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const startedAt = Date.parse(report.createdAt);
      const out = await askPainFollowup(
        access.config,
        {
          profile,
          report: { zone: report.zone, side: report.side, intensity: last ? last.intensity : report.intensity, kind: report.kind, daysSinceOnset: Math.max(0, Math.round((now - startedAt) / DAY_MS)), canWalk: report.canUseNormally, swelling: report.swelling },
          history: [{ at: report.createdAt, intensity: report.intensity }, ...report.followUps].map((f) => ({ daysAgo: Math.max(0, Math.round((now - Date.parse(f.at)) / DAY_MS)), intensity: f.intensity })),
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

  const sideLabel = report.side === 'centro' ? '' : report.side === 'izquierdo' ? ' izquierda' : ' derecha';

  return (
    <GlassCard>
      <AppText variant="headline">{BODY_ZONE_LABELS[report.zone]}{sideLabel} · dolor {last ? last.intensity : report.intensity}/10</AppText>
      <AppText variant="caption" tone="secondary">
        {report.followUps.length === 0 ? 'Reportado hoy' : `${report.followUps.length} seguimiento${report.followUps.length === 1 ? '' : 's'}`}
        {blocked ? ' · zona protegida en tu plan' : ''}
      </AppText>
      {report.photo ? (
        <View style={styles.block}>
          <View style={{ aspectRatio: report.photo.aspect, maxWidth: 160, borderRadius: 16, overflow: 'hidden' }}>
            <Image source={{ uri: report.photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        </View>
      ) : null}
      {due ? (
        <View style={styles.block}>
          <AppText variant="callout">¿Te sigue doliendo? ¿Cuánto?</AppText>
          <Stepper label="Dolor ahora (0 a 10)" value={intensity} min={0} max={10} onChange={setIntensity} />
          <PainPhoto value={photo} onChange={setPhoto} hint="Opcional: una foto de hoy para comparar. Se queda solo en tu dispositivo." />
          <GlassButton label="Guardar seguimiento" icon="checkmark" variant="primary" haptic="success" onPress={save} />
        </View>
      ) : null}
      {assessment && assessment.level === 'consulta' ? (
        <View style={styles.block}>
          <AppText variant="callout" tone="danger">Conviene que te evalúe un profesional:</AppText>
          {assessment.reasons.map((r) => <AppText key={r} variant="callout">• {r}</AppText>)}
        </View>
      ) : null}
      {report.level === 'ok' && access.config ? (
        <View style={styles.block}>
          {aiOut ? (
            <View style={styles.block}>
              <AppText variant="callout">{aiOut.summary}</AppText>
              {aiOut.tips.map((t) => <AppText key={t} variant="callout" tone="secondary">• {t}</AppText>)}
              <AppText variant="caption" tone="secondary">Respuesta generada por IA. Puede contener errores y no es consejo médico.</AppText>
            </View>
          ) : (
            <GlassButton label={aiBusy ? 'Consultando…' : 'Orientación de la IA'} icon="sparkles" size="compact" disabled={aiBusy} onPress={() => { void askAi(); }} />
          )}
          {aiError ? <AppText variant="callout" tone="danger">{aiError}</AppText> : null}
        </View>
      ) : null}
      <View style={[styles.row, styles.block]}>
        <GlassButton label="Ya no me duele" size="compact" haptic="success" onPress={() => onResolve(report.id)} />
        {blocked ? <GlassButton label="Un profesional me evaluó" size="compact" haptic="medium" onPress={() => onProfessionalCleared(report.id)} /> : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, marginTop: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
