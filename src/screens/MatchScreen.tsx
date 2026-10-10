import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { describeAiError, reviewMatch, type MatchReviewOutput } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { EXERCISE_BY_ID } from '../content/exercises';
import { AppText, Chip, FaceRating, GlassButton, GlassCard, Screen, SectionHeader, Stepper, SwipeRow, FieldSurface } from '../components/common';
import { MatchTracker, type NewMatchEvent } from '../components/specialized/MatchTracker';
import { useAppDispatch, useAppState } from '../context';
import { newId, toISODate } from '../core/dates';
import { spacing, useTheme } from '../theme';
import type { Match } from '../types';

export function MatchScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState('');
  const [competition, setCompetition] = useState('');
  const [venue, setVenue] = useState<Match['venue']>('local');
  const access = useAiAccess();
  const [reviewBusy, setReviewBusy] = useState(false);
  const [review, setReview] = useState<MatchReviewOutput | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const selected = state.matches.find((m) => m.id === selectedId) ?? null;

  const create = (): void => {
    const match: Match = {
      id: newId('match'),
      opponent: opponent.trim() || 'Rival',
      date: toISODate(new Date()),
      competition: competition.trim() || 'Amistoso',
      venue,
      surface: 'cesped',
      goalsFor: 0,
      goalsAgainst: 0,
      minutesPlayed: 0,
      selfRating: null,
      rpe: null,
      events: [],
    };
    dispatch({ type: 'UPSERT_MATCH', match });
    setSelectedId(match.id);
    setOpponent('');
    setCompetition('');
  };

  if (selected) {
    const askReview = async (): Promise<void> => {
      setReviewError(null);
      if (!access.config || !state.player) {
        setReviewError(access.gate.allowed ? 'La IA no está disponible.' : access.gate.message);
        return;
      }
      setReviewBusy(true);
      try {
        setReview(await reviewMatch(access.config, selected, state.player));
      } catch (e) {
        setReviewError(describeAiError(e));
      } finally {
        setReviewBusy(false);
      }
    };
    const update = (patch: Partial<Match>): void => dispatch({ type: 'UPSERT_MATCH', match: { ...selected, ...patch } });
    const addEvent = (event: NewMatchEvent): void =>
      dispatch({ type: 'ADD_MATCH_EVENT', matchId: selected.id, event: { ...event, id: newId('ev'), matchId: selected.id } });
    return (
      <Screen nativeHeader title="Partido">
        <View style={styles.rowBetween}>
          <GlassButton label="Partidos" icon="chevron.left" size="compact" haptic="light" onPress={() => setSelectedId(null)} />
          <GlassButton
            label="Borrar"
            icon="trash"
            variant="danger"
            size="compact"
            haptic="warning"
            onPress={() => {
              dispatch({ type: 'DELETE_MATCH', matchId: selected.id });
              setSelectedId(null);
            }}
          />
        </View>
        <View>
          <AppText variant="caption" tone="secondary">{selected.competition} · {selected.date}</AppText>
          <AppText variant="title">vs {selected.opponent}</AppText>
        </View>
        <GlassCard>
          <Stepper label="Goles a favor" value={selected.goalsFor} min={0} max={30} onChange={(v) => update({ goalsFor: v })} />
          <View style={styles.gap} />
          <Stepper label="Goles en contra" value={selected.goalsAgainst} min={0} max={30} onChange={(v) => update({ goalsAgainst: v })} />
          <View style={styles.gap} />
          <Stepper label="Minutos jugados" value={selected.minutesPlayed} min={0} max={120} step={5} onChange={(v) => update({ minutesPlayed: v })} />
        </GlassCard>
        <MatchTracker match={selected} onAddEvent={addEvent} onUndo={() => dispatch({ type: 'UNDO_MATCH_EVENT', matchId: selected.id })} />
        <GlassCard>
          <FaceRating label="Mi nota del partido" value={selected.selfRating} onChange={(v) => update({ selfRating: v })} />
          <View style={styles.gap} />
          <FaceRating label="Esfuerzo percibido" value={selected.rpe} onChange={(v) => update({ rpe: v })} />
        </GlassCard>
        <GlassCard>
          <SectionHeader title="Revisión con IA" />
          <View style={styles.form}>
            <GlassButton label={reviewBusy ? 'Revisando…' : 'Revisar mi partido'} icon="sparkles" variant="primary" disabled={reviewBusy || selected.events.length === 0} haptic="medium" onPress={() => { void askReview(); }} />
            {selected.events.length === 0 ? <AppText variant="caption" tone="secondary">Registra algunas acciones primero.</AppText> : null}
            {reviewError ? <AppText variant="callout" tone="danger">{reviewError}</AppText> : null}
            {review ? (
              <View style={styles.form}>
                <AppText variant="headline">{review.headline}</AppText>
                {review.positives.map((t) => <AppText key={t} variant="callout">+ {t}</AppText>)}
                {review.toImprove.map((t) => <AppText key={t} variant="callout" tone="secondary">→ {t}</AppText>)}
                {review.drills.length > 0 ? <AppText variant="callout">Para trabajarlo: {review.drills.map((id) => EXERCISE_BY_ID.get(id)?.name ?? id).join(', ')}</AppText> : null}
                <AppText variant="caption" tone="secondary">Respuesta generada por IA. Puede contener errores.</AppText>
              </View>
            ) : null}
          </View>
        </GlassCard>
      </Screen>
    );
  }

  return (
    <Screen nativeHeader title="Partido">
      <GlassCard>
        <SectionHeader title="Nuevo partido" />
        <View style={styles.form}>
          <FieldSurface>
            <TextInput value={opponent} onChangeText={setOpponent} placeholder="Rival" placeholderTextColor={colors.textSecondary} maxLength={40} style={[styles.input, { color: colors.text }]} accessibilityLabel="Rival" />
          </FieldSurface>
          <FieldSurface>
            <TextInput value={competition} onChangeText={setCompetition} placeholder="Competición (por ejemplo, Liga)" placeholderTextColor={colors.textSecondary} maxLength={40} style={[styles.input, { color: colors.text }]} accessibilityLabel="Competición" />
          </FieldSurface>
          <View style={styles.row}>
            <Chip label="Local" selected={venue === 'local'} onPress={() => setVenue('local')} />
            <Chip label="Visitante" selected={venue === 'visitante'} onPress={() => setVenue('visitante')} />
          </View>
          <GlassButton label="Crear y registrar" icon="plus" variant="primary" haptic="medium" onPress={create} />
        </View>
      </GlassCard>

      {state.matches.length > 0 ? (
        <GlassCard>
          <AppText variant="label" tone="secondary">Tu temporada</AppText>
          <View style={styles.seasonRow}>
            {(() => {
              const w = state.matches.filter((m) => m.goalsFor > m.goalsAgainst).length;
              const d = state.matches.filter((m) => m.goalsFor === m.goalsAgainst).length;
              const l = state.matches.length - w - d;
              const goals = state.matches.reduce((n, m) => n + m.events.filter((e) => e.type === 'gol' && e.side === 'propio').length, 0);
              return [
                { v: w, t: 'Ganados' },
                { v: d, t: 'Empates' },
                { v: l, t: 'Perdidos' },
                { v: goals, t: 'Tus goles' },
              ].map((x) => (
                <View key={x.t} style={styles.seasonCell}>
                  <AppText variant="digits">{x.v}</AppText>
                  <AppText variant="caption" tone="secondary">{x.t}</AppText>
                </View>
              ));
            })()}
          </View>
        </GlassCard>
      ) : null}

      <SectionHeader title="Tus partidos" subtitle={state.matches.length > 0 ? 'Desliza a la izquierda para borrar' : undefined} />
      {state.matches.length === 0 ? (
        <AppText variant="callout" tone="secondary">Aún no registraste partidos.</AppText>
      ) : (
        [...state.matches].reverse().map((m) => (
          <SwipeRow key={m.id} onDelete={() => dispatch({ type: 'DELETE_MATCH', matchId: m.id })}>
            <GlassCard>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <AppText variant="headline">vs {m.opponent}</AppText>
                  <AppText variant="callout" tone="secondary">{m.date} · {m.goalsFor}-{m.goalsAgainst} · {m.events.length} eventos</AppText>
                </View>
                <GlassButton label="Abrir" size="compact" haptic="light" onPress={() => setSelectedId(m.id)} />
              </View>
            </GlassCard>
          </SwipeRow>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  seasonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  seasonCell: { alignItems: 'center', flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', gap: spacing.sm },
  gap: { height: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.md },
  input: { fontSize: 17, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
