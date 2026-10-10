import React from 'react';
import { Text, type ColorValue } from 'react-native';
import type { IconName } from './Icon.types';

/** Vista previa en navegador: sin SF Symbols, se usan caracteres equivalentes. En iPhone y iPad se usan los iconos reales de Apple. */
const GLYPHS: Record<string, string> = {
  'arrow.counterclockwise': '↺', 'arrow.up': '↑', 'arrow.up.circle.fill': '⬆', 'arrow.uturn.backward': '↶',
  'bolt.fill': '⚡', 'bolt.heart.fill': '⚡', 'brain.head.profile': '🧠', 'bubble.left.fill': '💬', 'camera.fill': '📷',
  checkmark: '✓', 'checkmark.shield': '✓', 'chevron.left': '‹', 'chevron.right': '›', 'chevron.up': '⌃', 'chevron.down': '⌄', 'circle.fill': '●',
  'cross.case.fill': '✚', 'crown.fill': '♛', 'dumbbell.fill': '🏋', 'figure.run': '🏃', 'flag.fill': '⚑', 'flame.fill': '🔥',
  'forward.fill': '⏭', 'heart.text.square.fill': '♥', 'house.fill': '⌂', 'leaf.fill': '🍃', 'lock.fill': '🔒',
  'moon.fill': '☾', 'moon.zzz.fill': '☾', 'pause.fill': '⏸', photo: '🖼', 'play.fill': '▶', 'play.rectangle.fill': '▶',
  'person.fill': '●', 'person.crop.square': '▢', 'person.crop.square.fill': '▣', 'rectangle.and.pencil.and.ellipsis': '✎',
  'shield.fill': '⛨', 'shippingbox.fill': '🎁', soccerball: '⚽', 'sportscourt.fill': '▭', 'square.and.arrow.down': '⤓',
  'square.grid.3x3': '▦', 'square.grid.3x3.fill': '▦', 'star.circle.fill': '★', 'star.fill': '★', sparkles: '✦', target: '◎',
  'trash.fill': '🗑', 'square.and.arrow.up': '⤴', 'triangle.fill': '▲', 'trophy.fill': '🏆', wind: '≋', 'figure.core.training': '🏃',
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: string;
}

export function Icon({ name, size = 22, color }: IconProps): React.JSX.Element {
  return (
    <Text accessibilityElementsHidden style={{ width: size, height: size, lineHeight: size, fontSize: size * 0.82, textAlign: 'center', color }}>
      {GLYPHS[name] ?? '•'}
    </Text>
  );
}
