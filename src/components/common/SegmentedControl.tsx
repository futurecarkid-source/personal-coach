import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { radii, springs, triggerHaptic, useTheme } from '../../theme';
import { AppText } from './AppText';
import { GlassSurface } from './GlassSurface';
import { HapticTouch } from './HapticTouch';

const TRACK_PADDING = 3;

export interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Control segmentado con indicador que se desliza con muelle. */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>): React.JSX.Element {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segmentWidth = Math.max(0, width - TRACK_PADDING * 2) / Math.max(1, options.length);
  const x = useSharedValue(0);

  React.useEffect(() => {
    x.set(withSpring(index * segmentWidth, springs.smooth));
  }, [index, segmentWidth, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: segmentWidth }));

  const onLayout = (event: LayoutChangeEvent): void => {
    const next = event.nativeEvent.layout.width;
    if (next !== width) {
      setWidth(next);
      x.set(index * (Math.max(0, next - TRACK_PADDING * 2) / Math.max(1, options.length)));
    }
  };

  return (
    <GlassSurface radius={radii.button} flat variant="regular">
      <View style={styles.track} onLayout={onLayout}>
        {width > 0 ? (
          <Animated.View style={[styles.indicator, { backgroundColor: colors.accentSoft, borderColor: colors.accent }, indicator]} pointerEvents="none" />
        ) : null}
        {options.map((option) => (
          <HapticTouch
            key={option.value}
            haptic="none"
            pressedScale={0.97}
            style={styles.segment}
            accessibilityLabel={option.label}
            accessibilityState={{ selected: option.value === value }}
            onPress={() => {
              if (option.value !== value) {
                triggerHaptic('selection');
                onChange(option.value);
              }
            }}
          >
            <AppText variant="callout" tone={option.value === value ? 'accent' : 'secondary'} style={styles.segmentLabel}>
              {option.label}
            </AppText>
          </HapticTouch>
        ))}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: TRACK_PADDING },
  indicator: { position: 'absolute', top: 3, bottom: 3, left: 3, borderRadius: radii.button - 4, borderWidth: 1 },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontWeight: '600' },
});
