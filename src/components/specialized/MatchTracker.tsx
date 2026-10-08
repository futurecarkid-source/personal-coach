import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { CATEGORY_LABELS, EVENT_DEF_BY_TYPE, MATCH_EVENT_DEFS, type MatchEventDef } from '../../content/matchEvents';
import { summarizeMatch, matchHeatmap } from '../../core/matchStats';
import { formatClock } from '../../core/timerEngine';
import { useStopwatch } from '../../hooks/useStopwatch';
import { radii, spacing, triggerHaptic, useTheme } from '../../theme';
import { EVENT_CATEGORIES, type EventCategory, type Match, type MatchEvent, type PitchPoint, type ShotBodyPart, type ShotContext, type ShotSituation } from '../../types';
import { AppText } from '../common/AppText';
import { Chip } from '../common/Chip';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';
import { GlassSurface } from '../common/GlassSurface';
import { HapticTouch } from '../common/HapticTouch';
import { HeatmapPitch } from './HeatmapPitch';
import { MiniPitch } from './MiniPitch';

export type NewMatchEvent = Omit<MatchEvent, 'id' | 'matchId'>;

export interface MatchTrackerProps {
  match: Match;
  onAddEvent: (event: NewMatchEvent) => void;
  onUndo: () => void;
  /** Tiempo externo en segundos (por ejemplo, la posición del video). Si no se da, se usa el reloj propio. */
  externalSeconds?: number | null;
}

const BODY_PARTS: readonly { value: ShotBodyPart; label: string }[] = [
  { value: 'pie', label: 'Pie' },
  { value: 'cabeza', label: 'Cabeza' },
  { value: 'otro', label: 'Otro' },
];
const SITUATIONS: readonly { value: ShotSituation; label: string }[] = [
  { value: 'jugada', label: 'Jugada' },
  { value: 'contraataque', label: 'Contraataque' },
  { value: 'balonParado', label: 'Balón parado' },
  { value: 'rebote', label: 'Rebote' },
  { value: 'penalti', label: 'Penalti' },
];
const PRESSURES: readonly { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: 'Sin presión' },
  { value: 1, label: 'Media' },
  { value: 2, label: 'Alta' },
];

/**
 * Tracker de partido: reloj propio (o tiempo del video), paleta de eventos por categoría, posición en un minicampo,
 * contexto de tiro para el xG, línea de tiempo con deshacer y resultados (xG, pases, sangre fría y mapa de calor).
 * Cada evento se guarda con su tiempo en segundos.
 */
export function MatchTracker({ match, onAddEvent, onUndo, externalSeconds = null }: MatchTrackerProps): React.JSX.Element {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const watch = useStopwatch(250);
  const [category, setCategory] = useState<EventCategory>('ataque');
  const [side, setSide] = useState<'propio' | 'rival'>('propio');
  const [usePosition, setUsePosition] = useState(true);
  const [position, setPosition] = useState<PitchPoint | null>(null);
  const [pendingShot, setPendingShot] = useState<MatchEventDef | null>(null);
  const [shotCtx, setShotCtx] = useState<ShotContext>({ bodyPart: 'pie', situation: 'jugada', pressure: 1 });

  const seconds = externalSeconds ?? watch.elapsedMs / 1000;
  const defs = useMemo(() => MATCH_EVENT_DEFS.filter((d) => d.category === category), [category]);
  const summary = useMemo(() => summarizeMatch(match.events), [match.events]);
  const heatmap = useMemo(() => matchHeatmap(match.events), [match.events]);
  const pitchWidth = Math.min(windowWidth - 2 * (spacing.lg + spacing.lg), 560);
  const markers = useMemo(() => match.events.flatMap((e) => (e.pos ? [e.pos] : [])).slice(-40), [match.events]);

  const commit = (def: MatchEventDef, shot: ShotContext | null): void => {
    onAddEvent({ type: def.type, atSeconds: seconds, pos: usePosition ? position : null, shot, side });
    if (def.type === 'gol' || def.type === 'penaltiParado') triggerHaptic('success');
    else if (def.type === 'amarilla' || def.type === 'roja') triggerHaptic('warning');
    else triggerHaptic('medium');
  };

  const onEvent = (def: MatchEventDef): void => {
    if (def.isShot) {
      triggerHaptic('selection');
      setPendingShot(def);
      return;
    }
    commit(def, null);
  };

  const recent = [...match.events].reverse().slice(0, 6);

  return (
    <View style={styles.wrapper}>
      <GlassCard>
        <View style={styles.clockRow}>
          <View>
            <AppText variant="caption" tone="secondary">{externalSeconds === null ? 'Reloj del partido' : 'Tiempo del video'}</AppText>
            <AppText variant="digits" style={styles.clock}>{formatClock(seconds * 1000)}</AppText>
          </View>
          {externalSeconds === null ? (
            <View style={styles.row}>
              {watch.running ? (
                <GlassButton label="Pausa" icon="pause.fill" size="compact" onPress={watch.pause} />
              ) : (
                <GlassButton label={watch.elapsedMs > 0 ? 'Seguir' : 'Iniciar'} icon="play.fill" variant="primary" size="compact" haptic="heavy" onPress={watch.start} />
              )}
            </View>
          ) : null}
        </View>
        <View style={[styles.row, { marginTop: spacing.md }]}>
          <Chip label="Mi equipo" selected={side === 'propio'} onPress={() => setSide('propio')} />
          <Chip label="Rival" selected={side === 'rival'} onPress={() => setSide('rival')} />
          <Chip label={usePosition ? 'Con posición' : 'Sin posición'} selected={usePosition} onPress={() => setUsePosition((v) => !v)} />
        </View>
      </GlassCard>

      {usePosition ? (
        <GlassCard padding={spacing.md}>
          <AppText variant="caption" tone="secondary" style={styles.hint}>Toca el campo donde ocurrió (atacas hacia la derecha)</AppText>
          <MiniPitch width={pitchWidth} markers={markers} selected={position} onSelect={setPosition} />
        </GlassCard>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {EVENT_CATEGORIES.map((c) => (
          <Chip key={c} label={CATEGORY_LABELS[c]} selected={c === category} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      {pendingShot ? (
        <GlassCard>
          <AppText variant="headline">{pendingShot.label}: contexto del tiro</AppText>
          <View style={styles.block}>
            <AppText variant="caption" tone="secondary">Parte del cuerpo</AppText>
            <View style={styles.row}>
              {BODY_PARTS.map((o) => (
                <Chip key={o.value} label={o.label} selected={shotCtx.bodyPart === o.value} onPress={() => setShotCtx((c) => ({ ...c, bodyPart: o.value }))} />
              ))}
            </View>
            <AppText variant="caption" tone="secondary">Situación</AppText>
            <View style={styles.row}>
              {SITUATIONS.map((o) => (
                <Chip key={o.value} label={o.label} selected={shotCtx.situation === o.value} onPress={() => setShotCtx((c) => ({ ...c, situation: o.value }))} />
              ))}
            </View>
            <AppText variant="caption" tone="secondary">Presión del defensor</AppText>
            <View style={styles.row}>
              {PRESSURES.map((o) => (
                <Chip key={o.value} label={o.label} selected={shotCtx.pressure === o.value} onPress={() => setShotCtx((c) => ({ ...c, pressure: o.value }))} />
              ))}
            </View>
          </View>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <GlassButton
              label="Guardar tiro"
              variant="primary"
              haptic="none"
              onPress={() => {
                commit(pendingShot, shotCtx);
                setPendingShot(null);
              }}
            />
            <GlassButton label="Cancelar" onPress={() => setPendingShot(null)} haptic="light" />
          </View>
          {usePosition && !position ? <AppText variant="caption" tone="secondary" style={styles.hint}>Sin posición no se calcula el xG de este tiro.</AppText> : null}
        </GlassCard>
      ) : (
        <View style={styles.grid}>
          {defs.map((def) => (
            <EventButton key={def.type} def={def} onPress={() => onEvent(def)} />
          ))}
        </View>
      )}

      <GlassCard>
        <View style={styles.clockRow}>
          <AppText variant="headline">Línea de tiempo</AppText>
          <GlassButton label="Deshacer" icon="arrow.uturn.backward" size="compact" haptic="light" disabled={match.events.length === 0} onPress={onUndo} />
        </View>
        {recent.length === 0 ? (
          <AppText variant="callout" tone="secondary" style={styles.hint}>Aún no hay eventos.</AppText>
        ) : (
          <View style={styles.block}>
            {recent.map((e) => (
              <View key={e.id} style={styles.timelineRow}>
                <AppText variant="callout" tone="secondary" style={styles.time}>{formatClock(e.atSeconds * 1000)}</AppText>
                <AppText variant="callout" style={styles.flex}>{EVENT_DEF_BY_TYPE.get(e.type)?.label ?? e.type}</AppText>
                <AppText variant="caption" tone="secondary">{e.side === 'rival' ? 'Rival' : 'Yo'}</AppText>
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      <GlassCard>
        <AppText variant="headline">Resultados</AppText>
        <View style={styles.stats}>
          <Stat label="Goles" value={String(summary.goals)} />
          <Stat label="Tiros" value={`${summary.shotsOnTarget}/${summary.shots}`} />
          <Stat label="xG" value={summary.xg.toFixed(2)} />
          <Stat label="Pases" value={summary.passAccuracy === null ? '–' : `${summary.passAccuracy}%`} />
          <Stat label="Duelos" value={`${summary.duelsWon}-${summary.duelsLost}`} />
          <Stat label="Sangre fría" value={summary.coldBlood === null ? '–' : `${summary.coldBlood}%`} />
        </View>
        <AppText variant="caption" tone="secondary" style={styles.hint}>
          El xG es una estimación heurística (versión 0) y todavía no está calibrada con datos abiertos.
        </AppText>
        {summary.positions.length > 0 ? (
          <View style={[styles.block, { borderRadius: radii.chip, overflow: 'hidden' }]}>
            <AppText variant="caption" tone="secondary">Mapa de calor de tus acciones</AppText>
            <HeatmapPitch heatmap={heatmap} width={pitchWidth} />
          </View>
        ) : null}
      </GlassCard>
      <View style={{ height: 1, backgroundColor: colors.separator, opacity: 0 }} />
    </View>
  );
}

function EventButton({ def, onPress }: { def: MatchEventDef; onPress: () => void }): React.JSX.Element {
  const { colors } = useTheme();
  const tint = def.tone === 'positivo' ? colors.success : def.tone === 'negativo' ? colors.danger : undefined;
  return (
    <HapticTouch haptic="none" onPress={onPress} accessibilityLabel={def.label} style={styles.eventCell}>
      <GlassSurface radius={radii.button} variant="regular" tint={tint} interactive flat>
        <View style={styles.eventInner}>
          <AppText variant="callout" tone={tint ? 'accent' : 'primary'} style={styles.eventLabel} numberOfLines={2}>
            {def.label}
          </AppText>
        </View>
      </GlassSurface>
    </HapticTouch>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.stat}>
      <AppText variant="digits">{value}</AppText>
      <AppText variant="caption" tone="secondary">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.lg },
  clockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  clock: { fontSize: 34, lineHeight: 40 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  block: { gap: spacing.sm, marginTop: spacing.sm },
  hint: { marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  eventCell: { width: '48.5%' },
  eventInner: { minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  eventLabel: { textAlign: 'center', fontWeight: '600' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  time: { width: 56, fontVariant: ['tabular-nums'] },
  flex: { flex: 1 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, rowGap: spacing.md },
  stat: { width: '33.33%', gap: 2 },
});
