import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { springs, useTheme } from '../../theme';

export function ProgressBar({ fraction, height = 8 }: { fraction: number; height?: number }): React.JSX.Element {
  const { colors } = useTheme();
  const value = useSharedValue(0);
  useEffect(() => {
    value.set(withSpring(Math.max(0, Math.min(1, fraction)), springs.smooth));
  }, [fraction, value]);
  const fill = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.surfaceStrong }]}>
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: colors.accent }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { overflow: 'hidden', alignSelf: 'stretch' } });
