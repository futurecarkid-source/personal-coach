import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { AppText } from './AppText';
import { GlassButton } from './GlassButton';

export interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, min, max, step = 1, unit, onChange }: StepperProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <AppText variant="callout" tone="secondary">{label}</AppText>
        <AppText variant="digits">{value}{unit ? ` ${unit}` : ''}</AppText>
      </View>
      <View style={styles.buttons}>
        <GlassButton label="−" size="compact" haptic="selection" disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} accessibilityLabel={`Bajar ${label}`} />
        <GlassButton label="+" size="compact" haptic="selection" disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} accessibilityLabel={`Subir ${label}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  texts: { flex: 1, gap: 2 },
  buttons: { flexDirection: 'row', gap: spacing.sm },
});
