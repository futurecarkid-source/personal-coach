import React from 'react';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

export type IconName = Extract<SymbolViewProps['name'], string>;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: SymbolViewProps['weight'];
}

/** Icono SF Symbols (los mismos que usa iOS). */
export function Icon({ name, size = 22, color, weight = 'semibold' }: IconProps): React.JSX.Element {
  return <SymbolView name={name} size={size} tintColor={color} weight={weight} resizeMode="scaleAspectFit" style={{ width: size, height: size }} />;
}
