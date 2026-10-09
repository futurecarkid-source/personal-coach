import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BODY_ZONE_LABELS } from '../../content/attributeLabels';
import { useAppDispatch, useAppState } from '../../context';
import { newId } from '../../core/dates';
import { spacing } from '../../theme';
import { BODY_ZONES, type BodyZone, type CheckIn } from '../../types';
import { AppText } from '../common/AppText';
import { Chip } from '../common/Chip';
import { FaceRating } from '../common/FaceRating';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';
import { Stepper } from '../common/Stepper';

/**
 * Check-in rápido del día: sueño de anoche y cómo te sientes. Una sola tarjeta que se
 * pliega a un resumen cuando ya la completaste (menos ruido en la pantalla de inicio).
 */
export function QuickCheckIn({ today }: { today: string }): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const sleep = state.sleepLogs.find((l) => l.date === today) ?? null;
  const checkIn = state.checkIns.find((c) => c.date === today) ?? null;
  const complete = sleep !== null && checkIn !== null;
  const [open, setOpen] = useState(!complete);

  const [hours, setHours] = useState(sleep?.hours ?? state.settings.sleepGoalHours - 0.5);
  const [quality, setQuality] = useState<number | null>(sleep ? sleep.quality * 2 : null);
  const [mood, setMood] = useState<number | null>(checkIn?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(checkIn?.energy ?? null);
  const [soreness, setSoreness] = useState<number>(checkIn?.soreness ?? 2);
  const [zones, setZones] = useState<BodyZone[]>(checkIn?.zones ?? []);

  const ready = quality !== null && mood !== null && energy !== null;

  const save = (): void => {
    if (quality === null || mood === null || energy === null) return;
    dispatch({ type: 'LOG_SLEEP', log: { date: today, hours, quality: Math.max(1, Math.min(5, Math.round(quality / 2))) } });
    const ci: CheckIn = { id: checkIn?.id ?? newId('ci'), date: today, mood, energy, soreness, zones };
    dispatch({ type: 'ADD_CHECKIN', checkIn: ci });
    setOpen(false);
  };

  if (!open && complete) {
    return (
      <GlassCard>
        <View style={styles.summary}>
          <View style={styles.flex}>
            <AppText variant="label" tone="secondary">Check-in de hoy</AppText>
            <AppText variant="headline">Sueño {sleep.hours} h · ánimo {checkIn.mood}/10 · energía {checkIn.energy}/10</AppText>
            {checkIn.soreness > 2 ? <AppText variant="caption" tone="secondary">Molestias {checkIn.soreness}/10</AppText> : null}
          </View>
          <GlassButton label="Editar" size="compact" haptic="light" onPress={() => setOpen(true)} />
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <AppText variant="label" tone="secondary">Check-in de hoy</AppText>
      <AppText variant="title">¿Cómo amaneciste?</AppText>
      <View style={styles.block}>
        <Stepper label={`Horas dormidas (meta ${state.settings.sleepGoalHours} h)`} value={hours} min={0} max={14} step={0.5} unit="h" onChange={setHours} />
        <FaceRating label="Calidad del sueño" value={quality} onChange={setQuality} />
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
        {soreness >= 7 ? <AppText variant="callout" tone="danger">Si el dolor es fuerte, no mejora o limita tu movimiento, busca evaluación de un profesional. Hoy te proponemos recuperación.</AppText> : null}
        {hours < state.settings.sleepGoalHours - 1.5 ? <AppText variant="caption" tone="secondary">Dormir menos de lo que necesitas baja tu Preparación. Hoy protege tu descanso de esta noche.</AppText> : null}
        <GlassButton label="Guardar check-in" icon="checkmark" variant="primary" haptic="success" disabled={!ready} onPress={save} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  block: { gap: spacing.lg, marginTop: spacing.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
