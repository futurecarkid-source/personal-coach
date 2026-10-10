import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptics, springs } from '../../theme';

/** Interruptor con la forma y el muelle del de iOS (para la versión web; en la app nativa se usa el de SwiftUI). */
export function IOSSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }): React.JSX.Element {
  const t = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    t.set(withSpring(value ? 1 : 0, springs.snappy));
  }, [value, t]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(t.get(), [0, 1], ['rgba(120,120,128,0.32)', '#34C759']) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: 20 * t.get() }] }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => {
        haptics.selection();
        onChange(!value);
      }}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 51, height: 31, borderRadius: 16, padding: 2 },
  knob: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
});
