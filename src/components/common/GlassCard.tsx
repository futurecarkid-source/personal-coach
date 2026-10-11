import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, spacing, useTheme } from '../../theme';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';

export interface GlassCardProps extends Omit<GlassSurfaceProps, 'radius'> {
  padding?: number;
  contentStyle?: StyleProp<ViewStyle>;
  /** Vidrio (por defecto sí, por pedido de diseño). Con `false` la tarjeta es una superficie sólida, como las del contenido en iOS 26. */
  glass?: boolean;
}

/**
 * Tarjeta de contenido de vidrio líquido (con `glass={false}` pasa a superficie sólida).
 */
export function GlassCard({ children, padding = spacing.lg, style, contentStyle, glass = true, tint, ...rest }: GlassCardProps): React.JSX.Element {
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
