import React from 'react';
import { useColorScheme, type ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { IconName } from './Icon.types';

/**
 * Vista en navegador: SF Symbols no existe en la web, así que se dibujan iconos vectoriales con el mismo estilo
 * (trazo redondeado, formas llenas). En iPhone y iPad se usan los iconos reales de Apple.
 * Cada icono es una lista de trazos: 'f' = relleno (con huecos), 's' = línea, 'c' = círculo relleno.
 */
type Part = readonly ['f' | 's', string] | readonly ['c', number, number, number];
const f = (d: string): Part => ['f', d];
const s = (d: string): Part => ['s', d];
const c = (x: number, y: number, r: number): Part => ['c', x, y, r];

const HEART = 'M12 20.5C5 15.5 3 12 3 8.8A4.8 4.8 0 0 1 12 6.6 4.8 4.8 0 0 1 21 8.8c0 3.2-2 6.7-9 11.7z';
const STAR = 'M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4-4.9-4.4 6.5-.7z';
const GRID = [0, 1, 2].flatMap((r) => [0, 1, 2].map((q) => f(`M${4 + q * 6} ${4 + r * 6}h4v4h-4z`)));
const GRID_OUTLINE = [0, 1, 2].flatMap((r) => [0, 1, 2].map((q) => s(`M${4.5 + q * 6} ${4.5 + r * 6}h3v3h-3z`)));

const SHAPES: Record<string, readonly Part[]> = {
  'arrow.counterclockwise': [s('M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5')],
  'arrow.up': [s('M12 19V5M6 11l6-6 6 6')],
  'arrow.up.circle.fill': [s('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 16V8M8.5 11.5L12 8l3.5 3.5')],
  'arrow.uturn.backward': [s('M8 6L3.5 10.5 8 15M4 10.5h9a5.5 5.5 0 0 1 0 11h-3')],
  'atom': [s('M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM12 4c4.5 0 9 3.5 9 8s-4.5 8-9 8M12 4c-4.5 0-9 3.5-9 8s4.5 8 9 8'), s('M5 5.5c3-3 11-3 14 0M19 18.5c-3 3-11 3-14 0')],
  'applewatch': [s('M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM9 6l.5-3h5L15 6M9 18l.5 3h5L15 18')],
  'bell.fill': [f('M12 3a6 6 0 0 0-6 6v4l-2 3.5h16L18 13V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0z')],
  'bell.slash.fill': [f('M12 3a6 6 0 0 0-6 6v4l-2 3.5h16L18 13V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0z'), s('M4 4l16 16')],
  'bolt.fill': [f('M13 2L5 13.5h6L10 22l9-12h-6.5z')],
  'bolt.heart.fill': [f(HEART)],
  'brain.head.profile': [s('M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 3 3 3 0 0 0 1 2.5A3.5 3.5 0 0 0 9 18a3 3 0 0 0 3 2V4a3 3 0 0 0-3 0zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 3 3 3 0 0 1-1 2.5A3.5 3.5 0 0 1 15 18a3 3 0 0 1-3 2')],
  'bubble.left.fill': [f('M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z')],
  'building.2.fill': [f('M4 21V6l8-3v18zM12 9h8v12h-8z')],
  'camera.fill': [f('M4 8a2 2 0 0 1 2-2h2l1.2-2h5.6L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM12 9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z')],
  'chart.bar.fill': [f('M4 13h4v8H4zM10 4h4v17h-4zM16 9h4v12h-4z')],
  'checkmark': [s('M4.5 12.5l5 5 10-11')],
  'checkmark.circle.fill': [s('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM7.5 12.5l3 3 6-7')],
  'checkmark.shield': [s('M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6zM8.5 12l2.5 2.5 4.5-5')],
  'chevron.left': [s('M15 5l-7 7 7 7')],
  'chevron.right': [s('M9 5l7 7-7 7')],
  'chevron.up': [s('M5 15l7-7 7 7')],
  'chevron.down': [s('M5 9l7 7 7-7')],
  'circle.fill': [c(12, 12, 7)],
  'cross.case.fill': [f('M9 4h6a1 1 0 0 1 1 1v2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V5a1 1 0 0 1 1-1zm1 2v1h4V6zm1.2 5h1.6v1.7h1.7v1.6h-1.7V16h-1.6v-1.7H9.5v-1.6h1.7z')],
  'crown.fill': [f('M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z')],
  'drop.fill': [f('M12 2.5C8 8 5.5 11 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 11 16 8 12 2.5z')],
  'dumbbell.fill': [f('M2.5 9.5h2v5h-2zM5 7h2.5v10H5zM16.5 7H19v10h-2.5zM19.5 9.5h2v5h-2zM7.5 11h9v2h-9z')],
  'eraser': [s('M4 15l8-9 7 6-6 7H8zM9 20h11')],
  'exclamationmark.triangle.fill': [f('M12 3.5l10 17.5H2zM11 10h2v5h-2zM11 16.5h2v2h-2z')],
  'figure.run': [c(15.2, 4.6, 2.3), s('M13.2 8.6l-3 5.6M13.4 9.2l3.600 2.600 2.600-.9M12.600 9.400L8.800 9.800 7 12.400M10.200 14.200l3.800 2.200-.8 4.600M10.200 14.200l-3.600 3.400-2.400-.6')],
  'figure.core.training': [c(15.2, 4.6, 2.3), s('M13.2 8.6l-3 5.6M13.4 9.2l3.600 2.600 2.600-.9M12.600 9.400L8.800 9.800 7 12.400M10.200 14.200l3.800 2.200-.8 4.600M10.200 14.200l-3.600 3.400-2.400-.6')],
  'flag.fill': [f('M5 3h1.8v18H5zM8 4h11l-3 4.5 3 4.5H8z')],
  'flame.fill': [f('M12 2.5c.6 3.2 5.8 5.8 5.8 11A5.8 5.8 0 0 1 12 19.3 5.8 5.8 0 0 1 6.2 13.5c0-2 .9-3.4 1.9-4.4.2 1.6.9 2.4 1.7 2.8C9.4 8.6 10 5 12 2.5z')],
  'forward.fill': [f('M3 6l9 6-9 6zM12 6l9 6-9 6z')],
  'hand.raised.fill': [s('M8 11V5.5a1.5 1.5 0 0 1 3 0V10M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5a1.5 1.5 0 0 1 3 0v8c0 4-2 7-6 7-3 0-4.5-2-6-5L4 12a1.5 1.5 0 0 1 3-1l1 2')],
  'heart.text.square.fill': [f(HEART)],
  'house': [s('M4 11l8-7 8 7M6 9.500V20h4.500v-5.500h3V20H18V9.500')],
  'sportscourt': [s('M3 5.500h18v13H3zM12 5.500v13M3 9.500h3.500v5H3zM21 9.500h-3.500v5H21zM12 9.800a2.200 2.200 0 1 0 0 4.400 2.200 2.200 0 0 0 0-4.400z')],
  'house.fill': [f('M12 3l9 8h-2.5v9h-5v-6h-3v6h-5v-9H3z')],
  'lasso': [s('M12 5c-5 0-9 2-9 5s4 5 9 5 9-2 9-5-4-5-9-5zM9 15c0 3 1 5 4 5')],
  'leaf.fill': [f('M20 4C10 4 4 9 4 15c0 1.7.6 3 1.5 4C6 14 9 11 13 9c-3 3-5 6-5.5 11 7 .5 12.5-5 12.5-16z')],
  'line.3.horizontal': [s('M4 7h16M4 12h16M4 17h16')],
  'lock.fill': [f('M6 10h12a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 6 10z'), s('M8 10V7.5a4 4 0 0 1 8 0V10')],
  'mic': [f('M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z'), s('M6 11a6 6 0 0 0 12 0M12 17v4')],
  'mic.fill': [f('M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z'), s('M6 11a6 6 0 0 0 12 0M12 17v4')],
  'moon.fill': [f('M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z')],
  'moon.zzz.fill': [f('M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z')],
  'paperplane.fill': [f('M3 11L21 3l-8 18-2.5-7.5z')],
  'pause.fill': [f('M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z')],
  'person.fill': [f('M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z')],
  'person.crop.square': [s('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7 18c.5-3 2.5-4.5 5-4.5s4.5 1.500 5 4.5')],
  'person.crop.square.fill': [s('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7 18c.5-3 2.5-4.5 5-4.5s4.5 1.500 5 4.5')],
  'photo': [s('M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 16l5-5 4 4 3-3 4 4'), c(9, 8.5, 1.4)],
  'play.fill': [f('M7 4.5v15l13-7.5z')],
  'play.rectangle.fill': [f('M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm4.5 3.500v7l6-3.500z')],
  'plus': [s('M12 5v14M5 12h14')],
  'rectangle.and.pencil.and.ellipsis': [s('M4 20l1-4 11-11 3 3L8 19zM14 7l3 3')],
  'shield.fill': [f('M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z')],
  'shippingbox.fill': [s('M12 2.5l8.5 4.5v10L12 21.5 3.5 17V7zM12 12v9.500M3.500 7L12 11.500 20.500 7')],
  'soccerball': [s('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 5.500V3M12 8.500l3 2.200-1.100 3.500h-3.800L9 10.700zM15 10.700l5-1.700M13.900 14.200l3 4.200M10.100 14.200l-3 4.200M9 10.700L4 9')],
  'sparkles': [f('M10 3l1.6 5.4L17 10l-5.4 1.6L10 17l-1.6-5.4L3 10l5.4-1.6zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z')],
  'sportscourt.fill': [s('M3 5.500h18v13H3zM12 5.500v13M3 9.500h3.500v5H3zM21 9.500h-3.500v5H21z'), c(12, 12, 2.200)],
  'square.and.arrow.down': [s('M12 3v12M7 10l5 5 5-5M5 14v5h14v-5')],
  'square.and.arrow.up': [s('M12 15V3M7 8l5-5 5 5M5 14v5h14v-5')],
  'square.grid.3x3': GRID_OUTLINE,
  'square.grid.3x3.fill': GRID,
  'star.circle.fill': [s('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'), f('M12 6.800l1.600 3.400 3.700.4-2.800 2.500.8 3.600L12 14.800l-3.300 1.900.8-3.600-2.800-2.500 3.700-.4z')],
  'star.fill': [f(STAR)],
  'target': [s('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.500a4.500 4.500 0 1 0 0 9 4.500 4.500 0 0 0 0-9z'), c(12, 12, 1.600)],
  'trash': [s('M4 7h16M9 7V4.500h6V7M6 7l1 13h10l1-13M10 11v6M14 11v6')],
  'trash.fill': [s('M4 7h16M9 7V4.500h6V7M6 7l1 13h10l1-13M10 11v6M14 11v6')],
  'triangle.fill': [f('M12 4l9 16H3z')],
  'trophy.fill': [f('M7 3h10v6a5 5 0 0 1-10 0zM10.500 14.500h3V18h-3zM8 19.500h8V21H8z'), s('M7 5H3.500v2A3.500 3.500 0 0 0 7 10.500M17 5h3.500v2a3.500 3.500 0 0 1-3.500 3.500')],
  'wind': [s('M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7')],
  'xmark': [s('M6 6l12 12M18 6L6 18')],
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: string;
}

export function Icon({ name, size = 22, color }: IconProps): React.JSX.Element {
  const scheme = useColorScheme();
  const ink = (color ?? (scheme === 'dark' ? '#FFFFFF' : '#1C1C1E')) as string;
  const parts = SHAPES[name] ?? [c(12, 12, 6)];
  const stroke = name.startsWith('figure.') ? 2.5 : name === 'checkmark' || name.startsWith('chevron') || name === 'plus' || name === 'xmark' ? 2.6 : 1.9;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {parts.map((p, i) => {
        if (p[0] === 'f') return <Path key={i} d={p[1]} fill={ink} fillRule="evenodd" stroke={ink} strokeWidth={0.6} strokeLinejoin="round" />;
        if (p[0] === 'c') return <Circle key={i} cx={p[1]} cy={p[2]} r={p[3]} fill={ink} />;
        return <Path key={i} d={p[1]} fill="none" stroke={ink} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </Svg>
  );
}
