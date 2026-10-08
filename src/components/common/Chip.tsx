import React from 'react';
import { StyleSheet } from 'react-native';
import { pressScale, radii, spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { HapticTouch } from './HapticTouch';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

/** Opción seleccionable (chip). Seleccionada se tiñe de naranja. */
export function Chip({ label, selected = false, onPress, disabled }: ChipProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <HapticTouch
      haptic="selection"
      pressedScale={pressScale.chip}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <GlassSurface radius={radii.chip} variant="regular" tint={selected ? colors.accent : undefined} flat interactive>
        <AppText variant="callout" tone={selected ? 'onAccent' : 'primary'} style={styles.label}>
          {label}
        </AppText>
      </GlassSurface>
    </HapticTouch>
  );
}

const styles = StyleSheet.create({
  label: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontWeight: '600' },
});
