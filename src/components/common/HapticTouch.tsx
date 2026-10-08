import React, { useCallback } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { pressScale, springs, triggerHaptic, type HapticKind } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface HapticTouchProps extends Omit<PressableProps, 'style'> {
  /** Tipo de háptica al pulsar. `none` la desactiva. */
  haptic?: HapticKind;
  /** Escala mientras se mantiene pulsado. */
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Base de todo lo que se pulsa: escala con muelle al tocar y respuesta háptica al confirmar.
 * La háptica se ignora sola en iPad y cuando está apagada en Ajustes.
 */
export function HapticTouch({
  haptic = 'light',
  pressedScale = pressScale.button,
  style,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  accessibilityRole = 'button',
  accessibilityState,
  children,
  ...rest
}: HapticTouchProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      scale.set(withSpring(pressedScale, springs.snappy));
      onPressIn?.(event);
    },
    [onPressIn, pressedScale, scale],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      scale.set(withSpring(1, springs.bouncy));
      onPressOut?.(event);
    },
    [onPressOut, scale],
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      triggerHaptic(haptic);
      onPress?.(event);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      {...rest}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, disabled: disabled ?? accessibilityState?.disabled ?? false }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle, disabled ? { opacity: 0.45 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
