import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';
import { withAlpha } from './GlassSurface';

/**
 * Fondo con manchas de color suaves (verde deportivo y azul) bajo un desenfoque grande.
 * Es lo que da algo que refractar al vidrio líquido de las tarjetas y la barra; sobre un fondo liso el vidrio no se nota.
 */
export function Aurora(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const a = isDark ? 0.16 : 0.12;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, overflow: 'hidden' }]}>
      <View style={[styles.blob, { top: -200, left: -80, backgroundColor: withAlpha(isDark ? '#32D583' : '#12A868', a) }]} />
      <View style={[styles.blob, { bottom: -160, left: -100, width: 380, height: 380, borderRadius: 190, backgroundColor: withAlpha(isDark ? '#32D583' : '#12A868', a) }]} />
      <BlurView intensity={isDark ? 90 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', width: 400, height: 400, borderRadius: 200 },
});
