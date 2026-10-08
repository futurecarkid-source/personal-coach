import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';
import { BODY_ZONE_LABELS } from '../../content/attributeLabels';
import { spacing, useTheme } from '../../theme';
import type { BodyZone, PainSide } from '../../types';
import { AppText } from '../common/AppText';
import { SegmentedControl } from '../common/SegmentedControl';

type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number };

interface Region {
  zone: BodyZone;
  shape: Shape;
  /** Mitad del cuerpo según quien mira la imagen: izquierda, derecha o centro. */
  half: 'izq' | 'der' | 'centro';
}

const both = (zone: BodyZone, left: Shape, right: Shape): Region[] => [
  { zone, shape: left, half: 'izq' },
  { zone, shape: right, half: 'der' },
];

export const FRONT_REGIONS: readonly Region[] = [
  { zone: 'cabeza', shape: { kind: 'circle', cx: 50, cy: 13, r: 11 }, half: 'centro' },
  { zone: 'cuello', shape: { kind: 'rect', x: 44, y: 24, w: 12, h: 9, r: 3 }, half: 'centro' },
  ...both('hombro', { kind: 'circle', cx: 29, cy: 39, r: 8 }, { kind: 'circle', cx: 71, cy: 39, r: 8 }),
  ...both('cadera', { kind: 'rect', x: 30, y: 78, w: 19, h: 15, r: 6 }, { kind: 'rect', x: 51, y: 78, w: 19, h: 15, r: 6 }),
  ...both('ingle', { kind: 'ellipse', cx: 44, cy: 98, rx: 5, ry: 5 }, { kind: 'ellipse', cx: 56, cy: 98, rx: 5, ry: 5 }),
  ...both('cuadriceps', { kind: 'rect', x: 33, y: 104, w: 16, h: 30, r: 7 }, { kind: 'rect', x: 51, y: 104, w: 16, h: 30, r: 7 }),
  ...both('rodilla', { kind: 'ellipse', cx: 41, cy: 142, rx: 8, ry: 7 }, { kind: 'ellipse', cx: 59, cy: 142, rx: 8, ry: 7 }),
  ...both('canilla', { kind: 'rect', x: 34, y: 151, w: 14, h: 28, r: 6 }, { kind: 'rect', x: 52, y: 151, w: 14, h: 28, r: 6 }),
  ...both('tobillo', { kind: 'ellipse', cx: 41, cy: 186, rx: 6, ry: 5 }, { kind: 'ellipse', cx: 59, cy: 186, rx: 6, ry: 5 }),
  ...both('pie', { kind: 'ellipse', cx: 42, cy: 196, rx: 9, ry: 5 }, { kind: 'ellipse', cx: 58, cy: 196, rx: 9, ry: 5 }),
];

export const BACK_REGIONS: readonly Region[] = [
  { zone: 'cabeza', shape: { kind: 'circle', cx: 50, cy: 13, r: 11 }, half: 'centro' },
  { zone: 'cuello', shape: { kind: 'rect', x: 44, y: 24, w: 12, h: 9, r: 3 }, half: 'centro' },
  ...both('hombro', { kind: 'circle', cx: 29, cy: 39, r: 8 }, { kind: 'circle', cx: 71, cy: 39, r: 8 }),
  { zone: 'lumbar', shape: { kind: 'rect', x: 37, y: 58, w: 26, h: 20, r: 7 }, half: 'centro' },
  ...both('cadera', { kind: 'rect', x: 30, y: 80, w: 19, h: 17, r: 6 }, { kind: 'rect', x: 51, y: 80, w: 19, h: 17, r: 6 }),
  ...both('isquiotibiales', { kind: 'rect', x: 33, y: 104, w: 16, h: 30, r: 7 }, { kind: 'rect', x: 51, y: 104, w: 16, h: 30, r: 7 }),
  ...both('rodilla', { kind: 'ellipse', cx: 41, cy: 142, rx: 8, ry: 7 }, { kind: 'ellipse', cx: 59, cy: 142, rx: 8, ry: 7 }),
  ...both('gemelo', { kind: 'rect', x: 34, y: 151, w: 14, h: 22, r: 6 }, { kind: 'rect', x: 52, y: 151, w: 14, h: 22, r: 6 }),
  ...both('aquiles', { kind: 'rect', x: 37, y: 174, w: 8, h: 9, r: 3 }, { kind: 'rect', x: 55, y: 174, w: 8, h: 9, r: 3 }),
  ...both('tobillo', { kind: 'ellipse', cx: 41, cy: 188, rx: 6, ry: 4 }, { kind: 'ellipse', cx: 59, cy: 188, rx: 6, ry: 4 }),
  ...both('pie', { kind: 'ellipse', cx: 42, cy: 197, rx: 9, ry: 4 }, { kind: 'ellipse', cx: 58, cy: 197, rx: 9, ry: 4 }),
];

/** Zonas que solo se pueden tocar en una de las dos vistas. */
export const BACK_ONLY: readonly BodyZone[] = ['lumbar', 'isquiotibiales', 'gemelo', 'aquiles'];

/** Lado del cuerpo: de frente, la izquierda de la imagen es el lado derecho de la persona; de espaldas, al revés. */
export function sideFromHalf(half: Region['half'], view: 'frente' | 'espalda'): PainSide {
  if (half === 'centro') return 'centro';
  const viewerLeft = half === 'izq';
  if (view === 'frente') return viewerLeft ? 'derecho' : 'izquierdo';
  return viewerLeft ? 'izquierdo' : 'derecho';
}

export interface BodyMapProps {
  zone: BodyZone;
  side: PainSide;
  view: 'frente' | 'espalda';
  onViewChange: (view: 'frente' | 'espalda') => void;
  onSelect: (zone: BodyZone, side: PainSide) => void;
  height?: number;
}

const BOX_W = 100;
const BOX_H = 206;

export function BodyMap({ zone, side, view, onViewChange, onSelect, height = 340 }: BodyMapProps): React.JSX.Element {
  const { colors } = useTheme();
  const regions = view === 'frente' ? FRONT_REGIONS : BACK_REGIONS;
  const body = colors.surfaceStrong;
  const selectedFill = colors.accent;

  const isSelected = (r: Region): boolean => r.zone === zone && (r.half === 'centro' || sideFromHalf(r.half, view) === side);

  const props = (r: Region): Record<string, unknown> => ({
    fill: isSelected(r) ? selectedFill : colors.surface,
    fillOpacity: isSelected(r) ? 0.9 : 0.85,
    stroke: isSelected(r) ? colors.accent : colors.separator,
    strokeWidth: 0.8,
    onPress: () => onSelect(r.zone, sideFromHalf(r.half, view)),
  });

  const label = `${BODY_ZONE_LABELS[zone]}${side === 'centro' ? '' : side === 'izquierdo' ? ' izquierda' : ' derecha'}`;

  return (
    <View style={{ alignItems: 'center', gap: spacing.md }}>
      <SegmentedControl
        options={[
          { value: 'frente', label: 'Frente' },
          { value: 'espalda', label: 'Espalda' },
        ]}
        value={view}
        onChange={onViewChange}
      />
      <Svg width={(height * BOX_W) / BOX_H} height={height} viewBox={`0 0 ${BOX_W} ${BOX_H}`} accessibilityLabel="Mapa del cuerpo, toca donde duele">
        {/* Silueta */}
        <Circle cx={50} cy={13} r={10} fill={body} />
        <Rect x={45} y={22} width={10} height={9} rx={3} fill={body} />
        <Rect x={30} y={30} width={40} height={52} rx={12} fill={body} />
        <Rect x={19} y={32} width={10} height={58} rx={5} fill={body} />
        <Rect x={71} y={32} width={10} height={58} rx={5} fill={body} />
        <Rect x={31} y={76} width={38} height={22} rx={9} fill={body} />
        <Rect x={32} y={94} width={17} height={46} rx={8} fill={body} />
        <Rect x={51} y={94} width={17} height={46} rx={8} fill={body} />
        <Rect x={33} y={142} width={15} height={46} rx={7} fill={body} />
        <Rect x={52} y={142} width={15} height={46} rx={7} fill={body} />
        {/* Zonas que se pueden tocar */}
        {regions.map((r, i) => {
          const p = props(r);
          const key = `${r.zone}-${r.half}-${i}`;
          if (r.shape.kind === 'circle') return <Circle key={key} cx={r.shape.cx} cy={r.shape.cy} r={r.shape.r} {...p} />;
          if (r.shape.kind === 'ellipse') return <Ellipse key={key} cx={r.shape.cx} cy={r.shape.cy} rx={r.shape.rx} ry={r.shape.ry} {...p} />;
          return <Rect key={key} x={r.shape.x} y={r.shape.y} width={r.shape.w} height={r.shape.h} rx={r.shape.r ?? 0} {...p} />;
        })}
      </Svg>
      <AppText variant="headline" tone="accent">{label}</AppText>
      <AppText variant="caption" tone="secondary">Toca la zona. Izquierda y derecha son las de tu cuerpo, no las de la pantalla.</AppText>
    </View>
  );
}
