import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { describeAiError, explainTactic, type TacticExplainOutput } from '../ai';
import { useAiAccess } from '../ai/useAi';
import { AppText, Disclosure, GlassButton, GlassCard, Screen, SectionHeader, FieldSurface } from '../components/common';
import { TacticalBoard } from '../components/specialized/TacticalBoard';
import { useAppDispatch, useAppState } from '../context';
import { newId } from '../core/dates';
import { spacing, useTheme } from '../theme';
import type { GameFormat, Play, PlayFrame } from '../types';

interface Loaded {
  key: string;
  frame: PlayFrame;
  format: GameFormat;
  formation: string;
}

export function TacticsScreen(): React.JSX.Element {
  const { state } = useAppState();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const latest = useRef<{ frame: PlayFrame; format: GameFormat; formation: string } | null>(null);
  const access = useAiAccess();
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [explain, setExplain] = useState<TacticExplainOutput | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  const save = (): void => {
    if (!latest.current) return;
    const play: Play = {
      id: newId('play'),
      name: name.trim() || `Jugada ${state.plays.length + 1}`,
      format: latest.current.format,
      formation: latest.current.formation,
      frames: [latest.current.frame],
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SAVE_PLAY', play });
    setName('');
  };

  const askCoachAboutBoard = async (): Promise<void> => {
    setExplainError(null);
    if (!access.config) {
      setExplainError(access.gate.allowed ? 'La IA no está disponible.' : access.gate.message);
      return;
    }
    const current = latest.current;
    const frame = current?.frame ?? loaded?.frame;
    if (!frame) {
      setExplainError('Mueve o dibuja algo en la pizarra primero.');
      return;
    }
    const r2 = (n: number): number => Math.round(n * 100) / 100;
    const own = frame.tokens.filter((t) => t.team === 'propio');
    const rival = frame.tokens.filter((t) => t.team === 'rival');
    setBusy(true);
    try {
      const out = await explainTactic(access.config, {
        format: current?.format ?? loaded?.format ?? 'f11',
        formation: current?.formation ?? loaded?.formation ?? '4-3-3',
        rivalFormation: rival.length > 0 ? (current?.formation ?? loaded?.formation ?? null) : null,
        tokens: frame.tokens.slice(0, 40).map((t) => ({ team: t.team, x: r2(t.pos.x), y: r2(t.pos.y) })),
        drawings: frame.drawings.slice(0, 20).map((d) => ({ kind: d.kind, from: { x: r2(d.from.x), y: r2(d.from.y) }, to: { x: r2(d.to.x), y: r2(d.to.y) } })),
        question: question.trim() || (own.length > 0 ? 'Explícame esta jugada y qué debo vigilar.' : 'Explícame esta pizarra.'),
      });
      setExplain(out);
    } catch (e) {
      setExplainError(describeAiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen nativeHeader>
      <TacticalBoard
        key={loaded?.key ?? 'new'}
        initialFrame={loaded?.frame}
        initialFormat={loaded?.format}
        initialFormation={loaded?.formation}
        onChange={(frame, meta) => {
          latest.current = { frame, format: meta.format, formation: meta.formation };
        }}
      />

      <Disclosure title="Pregúntale al coach">
        <View style={styles.form}>
          <FieldSurface>
            <TextInput value={question} onChangeText={setQuestion} placeholder="Pregunta (opcional)" placeholderTextColor={colors.textSecondary} maxLength={300} style={[styles.input, { color: colors.text }]} accessibilityLabel="Pregunta sobre la pizarra" />
          </FieldSurface>
          <GlassButton label={busy ? 'Pensando…' : 'Explícame esta jugada'} icon="sparkles" variant="primary" disabled={busy} haptic="medium" onPress={() => { void askCoachAboutBoard(); }} />
          {explainError ? <AppText variant="callout" tone="danger">{explainError}</AppText> : null}
          {explain ? (
            <View style={styles.form}>
              <AppText variant="body">{explain.explanation}</AppText>
              {explain.strengths.length > 0 ? <AppText variant="callout">Fortalezas: {explain.strengths.join(' · ')}</AppText> : null}
              {explain.risks.length > 0 ? <AppText variant="callout" tone="danger">Riesgos: {explain.risks.join(' · ')}</AppText> : null}
              {explain.suggestions.length > 0 ? <AppText variant="callout">Sugerencias: {explain.suggestions.join(' · ')}</AppText> : null}
              <AppText variant="caption" tone="secondary">Respuesta generada por IA. Puede contener errores.</AppText>
            </View>
          ) : null}
        </View>
      </Disclosure>

      <Disclosure title="Guardar jugada" defaultOpen>
        <View style={styles.form}>
          <FieldSurface>
            <TextInput value={name} onChangeText={setName} placeholder="Nombre de la jugada" placeholderTextColor={colors.textSecondary} maxLength={40} style={[styles.input, { color: colors.text }]} accessibilityLabel="Nombre de la jugada" />
          </FieldSurface>
          <GlassButton label="Guardar" icon="square.and.arrow.down" variant="primary" haptic="success" onPress={save} />
        </View>
      </Disclosure>

      <SectionHeader title="Mis jugadas" />
      {state.plays.length === 0 ? (
        <AppText variant="callout" tone="secondary">Aún no guardaste jugadas.</AppText>
      ) : (
        state.plays.map((play) => (
          <GlassCard key={play.id}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <AppText variant="headline">{play.name}</AppText>
                <AppText variant="callout" tone="secondary">{play.formation} · {play.format.toUpperCase()}</AppText>
              </View>
              <View style={styles.row}>
                <GlassButton
                  label="Abrir"
                  size="compact"
                  haptic="light"
                  onPress={() => {
                    const frame = play.frames[0];
                    if (frame) setLoaded({ key: `${play.id}-${play.updatedAt}`, frame, format: play.format, formation: play.formation });
                  }}
                />
                <GlassButton label="Borrar" size="compact" variant="danger" haptic="warning" onPress={() => dispatch({ type: 'DELETE_PLAY', playId: play.id })} />
              </View>
            </View>
          </GlassCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginTop: spacing.md },
  input: { fontSize: 17, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
});
