import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { radii, spacing } from '../../theme';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';

export interface GlassCardProps extends Omit<GlassSurfaceProps, 'radius'> {
  padding?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Panel de vidrio para agrupar información sobre el fondo. */
export function GlassCard({ children, padding = spacing.lg, style, contentStyle, ...rest }: GlassCardProps): React.JSX.Element {
  return (
    <GlassSurface {...rest} radius={radii.card} style={style}>
      <View style={[{ padding, borderRadius: radii.card }, contentStyle]}>{children}</View>
    </GlassSurface>
  );
}
