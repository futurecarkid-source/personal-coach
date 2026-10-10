import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#C2491D', '#E0663A', '#E4E8ED', '#FFFFFF', '#9AA3AE', '#C2491D'];

/** Número pseudoaleatorio estable (para que cada pieza tenga su propia trayectoria sin depender del azar en cada render). */
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function Piece({ index, trigger }: { index: number; trigger: number }): React.JSX.Element {
  const t = useSharedValue(0);
  const reduce = useReducedMotion();
  const spec = useMemo(
    () => ({
      dx: (seeded(index, 1) - 0.5) * 300,
      up: 140 + seeded(index, 2) * 200,
      fall: 260 + seeded(index, 3) * 160,
      spin: (seeded(index, 4) - 0.5) * 900,
      size: 7 + seeded(index, 5) * 7,
      color: COLORS[index % COLORS.length]!,
      delay: seeded(index, 6) * 140,
    }),
    [index],
  );

  useEffect(() => {
    if (reduce) return;
    t.set(0);
    t.set(withDelay(spec.delay, withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) })));
  }, [trigger, reduce, spec.delay, t]);

  const style = useAnimatedStyle(() => {
    const p = t.get();
    return {
      opacity: p === 0 ? 0 : 1 - Math.max(0, (p - 0.7) / 0.3),
      transform: [
        { translateX: spec.dx * p },
        { translateY: -spec.up * p + spec.fall * p * p },
        { rotate: `${spec.spin * p}deg` },
      ],
    };
  });

  return <Animated.View style={[styles.piece, { width: spec.size, height: spec.size * 0.6, backgroundColor: spec.color }, style]} />;
}

/** Ráfaga de confeti para celebrar un logro o una subida de nivel. */
export function Confetti({ trigger, count = 34 }: { trigger: number; count?: number }): React.JSX.Element {
  return (
    <View pointerEvents="none" style={styles.origin}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} index={i} trigger={trigger} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: { position: 'absolute', left: '50%', top: '38%', width: 0, height: 0 },
  piece: { position: 'absolute', borderRadius: 2 },
});
