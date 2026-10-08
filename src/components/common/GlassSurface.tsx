import React from 'react';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { blur, getGlassTier, radii, useTheme } from '../../theme';

/** Aplica transparencia a un color hexadecimal (#RRGGBB); otros formatos se devuelven igual. */
export function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** `regular` es el vidrio estándar; `clear` es más transparente y va sobre contenido vistoso. */
  variant?: 'regular' | 'clear';
  /** Color con el que se tiñe el vidrio (por ejemplo el naranja de acento). */
  tint?: ColorValue;
  /** Reacciona al toque (brillo y deformación del vidrio nativo). */
  interactive?: boolean;
  radius?: number;
  /** Desactiva la sombra (útil dentro de otros contenedores de vidrio). */
  flat?: boolean;
}

/**
 * Material de vidrio. En iOS 26 o posterior usa el vidrio líquido real del sistema;
 * en versiones anteriores, desenfoque estándar con borde y brillo especular simulados.
 */
export function GlassSurface({
  children,
  style,
  variant = 'regular',
  tint,
  interactive = false,
  radius = radii.card,
  flat = false,
}: GlassSurfaceProps): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const tier = getGlassTier();
  // El color de acento solo "baña" el vidrio: se mantiene transparente para que se vea lo que hay detrás.
  const soft = typeof tint === 'string' ? withAlpha(tint, 0.34) : tint;
  const shadow: ViewStyle = flat
    ? {}
    : { shadowColor: colors.shadow, shadowOpacity: 1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } };

  if (tier === 'liquid') {
    return (
      <View style={[shadow, { borderRadius: radius }, style]}>
        <GlassView
          glassEffectStyle={variant}
          tintColor={soft}
          isInteractive={interactive}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[shadow, { borderRadius: radius }, style]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none">
        <BlurView intensity={variant === 'clear' ? blur.thin : blur.regular} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: soft ?? colors.glassFill }]} />
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.glassBorder }]}
      />
      {children}
    </View>
  );
}
