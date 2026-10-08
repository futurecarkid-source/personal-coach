import React from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

export const PITCH_L = 105;
export const PITCH_W = 68;

export interface PitchSvgProps {
  width: number;
  /** Contenido dibujado encima, en metros (viewBox 105 × 68). */
  children?: React.ReactNode;
  grass?: string;
  grassAlt?: string;
  lines?: string;
}

/** Campo vectorizado a escala real (105 × 68 m). */
export function PitchSvg({ width, children, grass = '#3F8F5C', grassAlt = '#438F5F', lines = 'rgba(255,255,255,0.9)' }: PitchSvgProps): React.JSX.Element {
  const height = (width * PITCH_W) / PITCH_L;
  const stroke = 0.28;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${PITCH_L} ${PITCH_W}`}>
      <Rect x={0} y={0} width={PITCH_L} height={PITCH_W} fill={grass} />
      {Array.from({ length: 7 }, (_, i) => (
        <Rect key={i} x={(PITCH_L / 7) * i} y={0} width={PITCH_L / 7} height={PITCH_W} fill={i % 2 === 0 ? grass : grassAlt} />
      ))}
      <G stroke={lines} strokeWidth={stroke} fill="none">
        <Rect x={0.5} y={0.5} width={PITCH_L - 1} height={PITCH_W - 1} />
        <Line x1={PITCH_L / 2} y1={0.5} x2={PITCH_L / 2} y2={PITCH_W - 0.5} />
        <Circle cx={PITCH_L / 2} cy={PITCH_W / 2} r={9.15} />
        {/* Áreas grandes y pequeñas */}
        <Rect x={0.5} y={(PITCH_W - 40.32) / 2} width={16} height={40.32} />
        <Rect x={0.5} y={(PITCH_W - 18.32) / 2} width={5} height={18.32} />
        <Rect x={PITCH_L - 16.5} y={(PITCH_W - 40.32) / 2} width={16} height={40.32} />
        <Rect x={PITCH_L - 5.5} y={(PITCH_W - 18.32) / 2} width={5} height={18.32} />
        {/* Medialunas */}
        <Path d={`M 16.5 ${PITCH_W / 2 - 7.31} A 9.15 9.15 0 0 1 16.5 ${PITCH_W / 2 + 7.31}`} />
        <Path d={`M ${PITCH_L - 16.5} ${PITCH_W / 2 - 7.31} A 9.15 9.15 0 0 0 ${PITCH_L - 16.5} ${PITCH_W / 2 + 7.31}`} />
        {/* Esquinas */}
        <Path d="M 0.5 1.5 A 1 1 0 0 0 1.5 0.5" />
        <Path d={`M ${PITCH_L - 1.5} 0.5 A 1 1 0 0 0 ${PITCH_L - 0.5} 1.5`} />
        <Path d={`M 0.5 ${PITCH_W - 1.5} A 1 1 0 0 1 1.5 ${PITCH_W - 0.5}`} />
        <Path d={`M ${PITCH_L - 1.5} ${PITCH_W - 0.5} A 1 1 0 0 1 ${PITCH_L - 0.5} ${PITCH_W - 1.5}`} />
      </G>
      <G fill={lines}>
        <Circle cx={PITCH_L / 2} cy={PITCH_W / 2} r={0.45} />
        <Circle cx={11} cy={PITCH_W / 2} r={0.4} />
        <Circle cx={PITCH_L - 11} cy={PITCH_W / 2} r={0.4} />
      </G>
      {children}
    </Svg>
  );
}
