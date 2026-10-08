import React from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { Circle } from 'react-native-svg';
import { triggerHaptic } from '../../theme';
import type { PitchPoint } from '../../types';
import { PITCH_L, PITCH_W, PitchSvg } from './PitchSvg';

export interface MiniPitchProps {
  width: number;
  markers?: readonly PitchPoint[];
  selected: PitchPoint | null;
  onSelect: (point: PitchPoint) => void;
}

/** Campo pequeño tocable: cada toque fija la posición (en metros) del siguiente evento. */
export function MiniPitch({ width, markers = [], selected, onSelect }: MiniPitchProps): React.JSX.Element {
  const height = (width * PITCH_W) / PITCH_L;
  const handle = (event: GestureResponderEvent): void => {
    const { locationX, locationY } = event.nativeEvent;
    const x = Math.max(0, Math.min(PITCH_L, (locationX / width) * PITCH_L));
    const y = Math.max(0, Math.min(PITCH_W, (locationY / height) * PITCH_W));
    triggerHaptic('selection');
    onSelect({ x, y });
  };
  return (
    <Pressable onPress={handle} accessibilityRole="adjustable" accessibilityLabel="Campo: toca para marcar la posición del evento">
      <View pointerEvents="none" style={styles.box}>
        <PitchSvg width={width}>
          {markers.map((m, i) => (
            <Circle key={`${i}-${m.x}-${m.y}`} cx={m.x} cy={m.y} r={1.1} fill="rgba(255,255,255,0.75)" />
          ))}
          {selected ? (
            <>
              <Circle cx={selected.x} cy={selected.y} r={3} fill="rgba(255,106,26,0.35)" />
              <Circle cx={selected.x} cy={selected.y} r={1.4} fill="#FF6A1A" stroke="#FFFFFF" strokeWidth={0.35} />
            </>
          ) : null}
        </PitchSvg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({ box: { borderRadius: 14, overflow: 'hidden' } });
