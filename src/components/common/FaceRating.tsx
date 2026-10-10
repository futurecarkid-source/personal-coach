import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import { radii, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { HapticTouch } from './HapticTouch';

/** Boca de cada carita (de muy mal a muy bien), dibujada en vectores para que no dependa de los emojis del sistema. */
const MOUTHS = ['M8 17c1-2.2 7-2.2 8 0', 'M8.5 16.2c1-1.3 6-1.3 7 0', 'M8.5 15.5h7', 'M8 14.5c1 2 7 2 8 0', 'M7.500 14c1 3.500 8 3.500 9 0z'] as const;
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
        {MOUTHS.map((mouth, i) => {
          const selected = i === selectedIndex;
          return (
            <HapticTouch
              key={mouth}
              haptic="selection"
              pressedScale={0.9}
              accessibilityLabel={`${label}: ${VALUES[i]} de 10`}
              accessibilityState={{ selected }}
              onPress={() => onChange(VALUES[i] ?? 6)}
              style={styles.cell}
            >
              <GlassSurface radius={radii.button} flat variant="regular" tint={selected ? colors.accent : undefined} interactive>
                <View style={styles.face}>
                  <Svg width={34} height={34} viewBox="0 0 24 24">
                    <Circle cx={12} cy={12} r={9.500} fill="none" stroke={selected ? colors.pitch : colors.text} strokeWidth={1.8} />
                    <Circle cx={9} cy={10} r={1.200} fill={selected ? colors.pitch : colors.text} />
                    <Circle cx={15} cy={10} r={1.200} fill={selected ? colors.pitch : colors.text} />
                    <Path d={mouth} fill={i === 4 ? (selected ? colors.pitch : colors.text) : 'none'} stroke={selected ? colors.pitch : colors.text} strokeWidth={1.800} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
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
});
