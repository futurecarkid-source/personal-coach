import React from 'react';
import { Rect } from 'react-native-svg';
import type { Heatmap } from '../../core/heatmap';
import { PITCH_L, PITCH_W, PitchSvg } from './PitchSvg';

/** Mapa de calor sobre el campo vectorizado (grilla gruesa; el color y la transparencia suavizan el resultado). */
export function HeatmapPitch({ heatmap, width }: { heatmap: Heatmap; width: number }): React.JSX.Element {
  const cellW = PITCH_L / heatmap.cols;
  const cellH = PITCH_W / heatmap.rows;
  return (
    <PitchSvg width={width}>
      {heatmap.cells.flatMap((row, r) =>
        row.map((value, c) =>
          value > 0.04 ? (
            <Rect
              key={`${r}-${c}`}
              x={c * cellW}
              y={r * cellH}
              width={cellW + 0.05}
              height={cellH + 0.05}
              fill="#FF6A1A"
              opacity={Math.min(0.85, Math.pow(value, 0.8) * 0.85)}
            />
          ) : null,
        ),
      )}
    </PitchSvg>
  );
}
