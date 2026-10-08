import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BODY_ZONE_LABELS } from '../../content/attributeLabels';
import { assessProgress, dueFollowUp, type ProgressAssessment } from '../../core/painSafety';
import { spacing } from '../../theme';
import type { PainReport } from '../../types';
import { AppText } from '../common/AppText';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';
import { Stepper } from '../common/Stepper';

const DAY_MS = 86_400_000;

export interface PainFollowUpCardProps {
  report: PainReport;
  allReports: readonly PainReport[];
  onFollowUp: (reportId: string, intensity: number) => void;
  onResolve: (reportId: string) => void;
  onProfessionalCleared: (reportId: string) => void;
}

/** Seguimiento automático: a las 24, 48 y 72 h y luego cada semana pregunta cómo va el dolor. */
export function PainFollowUpCard({ report, allReports, onFollowUp, onResolve, onProfessionalCleared }: PainFollowUpCardProps): React.JSX.Element | null {
  const last = report.followUps[report.followUps.length - 1];
  const [intensity, setIntensity] = useState(last ? last.intensity : report.intensity);
  const [assessment, setAssessment] = useState<ProgressAssessment | null>(null);
  // La hora se fija al abrir la tarjeta; se vuelve a leer al guardar.
  const [now] = useState(() => Date.now());
  const due = dueFollowUp(report, now) !== null;
  const recurrences = allReports.filter((r) => r.zone === report.zone && now - Date.parse(r.createdAt) <= 60 * DAY_MS).length;
  const blocked = report.level !== 'ok' && !report.clearedByProfessional;

  const save = (): void => {
    onFollowUp(report.id, intensity);
    const saveTime = Date.now();
    const simulated = { ...report, followUps: [...report.followUps, { at: new Date(saveTime).toISOString(), intensity, note: '' }] };
    setAssessment(assessProgress(simulated, saveTime, recurrences));
  };

  return (
    <GlassCard>
      <AppText variant="headline">{BODY_ZONE_LABELS[report.zone]} · dolor {last ? last.intensity : report.intensity}/10</AppText>
      <AppText variant="caption" tone="secondary">
        {report.followUps.length === 0 ? 'Reportado hoy' : `${report.followUps.length} seguimiento${report.followUps.length === 1 ? '' : 's'}`}
        {blocked ? ' · zona protegida en tu plan' : ''}
      </AppText>
      {due ? (
        <View style={styles.block}>
          <AppText variant="callout">¿Te sigue doliendo? ¿Cuánto?</AppText>
          <Stepper label="Dolor ahora (0 a 10)" value={intensity} min={0} max={10} onChange={setIntensity} />
          <GlassButton label="Guardar seguimiento" icon="checkmark" variant="primary" haptic="success" onPress={save} />
        </View>
      ) : null}
      {assessment && assessment.level === 'consulta' ? (
        <View style={styles.block}>
          <AppText variant="callout" tone="danger">Conviene que te evalúe un profesional:</AppText>
          {assessment.reasons.map((r) => <AppText key={r} variant="callout">• {r}</AppText>)}
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
