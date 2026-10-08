import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radii, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { HapticTouch } from './HapticTouch';

const FACES = ['😣', '😕', '😐', '🙂', '😄'] as const;
/** Cada carita equivale a dos puntos de la escala 1 a 10. */
const VALUES = [2, 4, 6, 8, 10] as const;

export interface FaceRatingProps {
  label: string;
  /** Valor de 1 a 10, o null si aún no se elige. */
  value: number | null;
  onChange: (value: number) => void;
}

/** Selector con caritas (escala interna 1 a 10). */
export function FaceRating({ label, value, onChange }: FaceRatingProps): React.JSX.Element {
  const { colors } = useTheme();
  const selectedIndex = value === null ? -1 : VALUES.findIndex((v) => value <= v);
  return (
    <View style={styles.wrapper}>
      <AppText variant="callout" tone="secondary">{label}</AppText>
      <View style={styles.row}>
        {FACES.map((face, i) => {
          const selected = i === selectedIndex;
          return (
            <HapticTouch
              key={face}
              haptic="selection"
              pressedScale={0.9}
              accessibilityLabel={`${label}: ${VALUES[i]} de 10`}
              accessibilityState={{ selected }}
              onPress={() => onChange(VALUES[i] ?? 6)}
              style={styles.cell}
            >
              <GlassSurface radius={radii.button} flat variant="regular" tint={selected ? colors.accent : undefined} interactive>
                <View style={styles.face}>
                  <AppText style={styles.emoji}>{face}</AppText>
                </View>
              </GlassSurface>
            </HapticTouch>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
  face: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  emoji: { fontSize: 26, lineHeight: 32 },
});
