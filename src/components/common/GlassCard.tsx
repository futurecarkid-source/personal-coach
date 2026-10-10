import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, spacing, useTheme } from '../../theme';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';

export interface GlassCardProps extends Omit<GlassSurfaceProps, 'radius'> {
  padding?: number;
  contentStyle?: StyleProp<ViewStyle>;
  /** Fuerza vidrio (por defecto las tarjetas de contenido son superficies sólidas, como en iOS 26; el vidrio es para controles). */
  glass?: boolean;
}

/**
 * Tarjeta de contenido. En iOS 26 el contenido va sobre superficies sólidas y el Liquid Glass se reserva para
 * lo que flota y se toca (botones, barra de pestañas, selectores), así que por defecto es sólida.
 */
export function GlassCard({ children, padding = spacing.lg, style, contentStyle, glass = false, tint, ...rest }: GlassCardProps): React.JSX.Element {
  const { colors } = useTheme();
  if (glass || tint) {
    return (
      <GlassSurface {...rest} tint={tint} radius={radii.card} style={style}>
        <View style={[{ padding, borderRadius: radii.card }, contentStyle]}>{children}</View>
      </GlassSurface>
    );
  }
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radii.card }, style]}>
      <View style={[{ padding, borderRadius: radii.card }, contentStyle]}>{children}</View>
    </View>
  );
}
