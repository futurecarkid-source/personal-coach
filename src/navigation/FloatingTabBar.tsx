import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useInsets } from '../theme/useInsets';
import { AppText } from '../components/common/AppText';
import { GlassSurface } from '../components/common/GlassSurface';
import { HapticTouch } from '../components/common/HapticTouch';
import { Icon, type IconName } from '../components/common/Icon';
import { getGlassTier, radii, springs, triggerHaptic, useTheme } from '../theme';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from './constants';

import { TABS } from './tabs';

const BAR_PADDING = 6;

/**
 * Barra de pestañas flotante de vidrio, al estilo de iOS 26. El indicador es una cápsula de vidrio
 * que se desliza con muelle y se estira un poco al cambiar de pestaña.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps): React.JSX.Element {
  const { colors } = useTheme();
  const insets = useInsets();
  const { width: windowWidth } = useWindowDimensions();
  const barWidth = Math.min(windowWidth - 32, 560);
  const count = state.routes.length;
  const itemWidth = (barWidth - BAR_PADDING * 2) / count;

  const x = useSharedValue(state.index * itemWidth);
  const stretch = useSharedValue(1);
  const lastIndex = useRef(state.index);

  useEffect(() => {
    x.set(withSpring(state.index * itemWidth, springs.smooth));
    if (state.index !== lastIndex.current) {
      stretch.set(withSequence(withTiming(1.14, { duration: 90 }), withSpring(1, springs.bouncy)));
      lastIndex.current = state.index;
    }
  }, [itemWidth, state.index, stretch, x]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scaleX: stretch.value }],
  }));

  const bottom = Math.max(insets.bottom, FLOATING_TAB_BAR_MARGIN);
  const liquid = getGlassTier() === 'liquid';

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <GlassSurface radius={radii.pill} variant="regular" style={{ width: barWidth, height: FLOATING_TAB_BAR_HEIGHT }}>
        <View style={[styles.row, { padding: BAR_PADDING }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { width: itemWidth, left: BAR_PADDING, top: BAR_PADDING, bottom: BAR_PADDING },
              indicatorStyle,
            ]}
          >
            <GlassSurface
              radius={radii.pill}
              flat
              variant="clear"
              tint={liquid ? colors.accentSoft : colors.accentSoft}
              interactive
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const def = TABS.find((t) => t.name === route.name);
            const meta = { title: def?.title ?? route.name, icon: (focused ? def?.iconSelected : def?.icon) ?? ('circle.fill' as IconName) };
            const onPress = (): void => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };
            const onLongPress = (): void => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
              triggerHaptic('medium');
            };
            return (
              <HapticTouch
                key={route.key}
                haptic="selection"
                pressedScale={0.92}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={meta.title}
                accessibilityState={{ selected: focused }}
                style={[styles.item, { width: itemWidth }]}
              >
                <Icon name={meta.icon} size={22} color={focused ? colors.pitch : colors.textSecondary} />
                <AppText variant="caption" tone={focused ? 'accent' : 'secondary'} numberOfLines={1}>
                  {meta.title}
                </AppText>
              </HapticTouch>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  indicator: { position: 'absolute' },
  item: { alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%' },
});
