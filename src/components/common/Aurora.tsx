import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

const LIGHT = require('../../../assets/aurora-light.png');
const DARK = require('../../../assets/aurora-dark.png');

/**
 * Fondo con un resplandor verde muy suave arriba y abajo. Es una imagen ya difuminada (no un desenfoque en vivo):
 * cuesta casi nada de rendimiento y le da algo que refractar al vidrio líquido de las tarjetas y la barra.
 */
export function Aurora(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, overflow: 'hidden' }]}>
      <Image source={isDark ? DARK : LIGHT} style={styles.img} resizeMode="stretch" fadeDuration={0} />
    </View>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
});
