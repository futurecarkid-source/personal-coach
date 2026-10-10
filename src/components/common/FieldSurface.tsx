import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, useTheme } from '../../theme';

/**
 * Fondo de los campos de texto. Es un color sólido (no vidrio) para que lo que escribes
 * siempre se vea con contraste, tanto en modo claro como oscuro.
 */
export function FieldSurface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }): React.JSX.Element {
  const { colors } = useTheme();
  return <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.separator }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  box: { borderRadius: radii.button, borderWidth: StyleSheet.hairlineWidth * 2, overflow: 'hidden' },
});
