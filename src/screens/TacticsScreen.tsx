import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText, GlassButton, GlassCard, GlassSurface, Screen, SectionHeader } from '../components/common';
import { TacticalBoard } from '../components/specialized/TacticalBoard';
import { useAppDispatch, useAppState } from '../context';
import { newId } from '../core/dates';
import { radii, spacing, useTheme } from '../theme';
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

  return (
    <Screen>
      <AppText variant="largeTitle">Táctica</AppText>
      <TacticalBoard
        key={loaded?.key ?? 'new'}
        initialFrame={loaded?.frame}
        initialFormat={loaded?.format}
        initialFormation={loaded?.formation}
        onChange={(frame, meta) => {
          latest.current = { frame, format: meta.format, formation: meta.formation };
        }}
      />

      <GlassCard>
        <SectionHeader title="Guardar jugada" />
        <View style={styles.form}>
          <GlassSurface radius={radii.button} flat>
            <TextInput value={name} onChangeText={setName} placeholder="Nombre de la jugada" placeholderTextColor={colors.textSecondary} maxLength={40} style={[styles.input, { color: colors.text }]} accessibilityLabel="Nombre de la jugada" />
          </GlassSurface>
          <GlassButton label="Guardar" icon="square.and.arrow.down" variant="primary" haptic="success" onPress={save} />
        </View>
      </GlassCard>

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
