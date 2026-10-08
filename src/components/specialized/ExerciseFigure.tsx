import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, interpolate, useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { ANIMATIONS, animationFor } from '../../content/exerciseAnimations';
import { FLOOR, HEAD_R, VIEW_W, buildTracks, type AnimationDef, type PointName, type Tracks } from '../../core/pose';
import { radii, spacing, useTheme } from '../../theme';
import type { Exercise } from '../../types';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Instante que se muestra cuando hay movimiento reducido: la pose del esfuerzo. */
const STATIC_T = 0.7;

interface SegProps {
  t: SharedValue<number>;
  tracks: Tracks;
  from: PointName;
  to: PointName;
  color: string;
  width: number;
  opacity?: number;
}

function Segment({ t, tracks, from, to, color, width, opacity = 1 }: SegProps): React.JSX.Element {
  const inputs = useMemo(() => Array.from({ length: tracks.samples }, (_, i) => i / (tracks.samples - 1)), [tracks.samples]);
  const x1 = tracks.x[from];
  const y1 = tracks.y[from];
  const x2 = tracks.x[to];
  const y2 = tracks.y[to];
  const animatedProps = useAnimatedProps(() => {
    const v = t.get();
    return { x1: interpolate(v, inputs, x1), y1: interpolate(v, inputs, y1), x2: interpolate(v, inputs, x2), y2: interpolate(v, inputs, y2) };
  });
  return <AnimatedLine animatedProps={animatedProps} stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} />;
}

function Dot({ t, xs, ys, r, color, samples }: { t: SharedValue<number>; xs: number[]; ys: number[]; r: number; color: string; samples: number }): React.JSX.Element {
  const inputs = useMemo(() => Array.from({ length: samples }, (_, i) => i / (samples - 1)), [samples]);
  const animatedProps = useAnimatedProps(() => {
    const v = t.get();
    return { cx: interpolate(v, inputs, xs), cy: interpolate(v, inputs, ys) };
  });
  return <AnimatedCircle animatedProps={animatedProps} r={r} fill={color} />;
}

export interface ExerciseFigureProps {
  exercise: Pick<Exercise, 'id' | 'pattern' | 'name'>;
  /** Alto máximo del recuadro; por defecto se adapta al ancho. */
  maxWidth?: number;
}

/**
 * Maniquí animado del ejercicio (figura de palos de perfil). Cada movimiento tiene su animación original,
 * calculada con ángulos (`core/pose`); aquí solo se interpola entre muestras en el hilo de interfaz.
 */
export function ExerciseFigure({ exercise, maxWidth = 320 }: ExerciseFigureProps): React.JSX.Element {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const id = animationFor(exercise);
  const def: AnimationDef = ANIMATIONS[id];
  const tracks = useMemo(() => buildTracks(def), [def]);
  const t = useSharedValue(STATIC_T);

  useEffect(() => {
    if (reduce) {
      cancelAnimation(t);
      t.set(STATIC_T);
      return undefined;
    }
    t.set(0);
    if (def.mode === 'pingpong') t.set(withRepeat(withTiming(1, { duration: def.ms / 2, easing: Easing.linear }), -1, true));
    else t.set(withRepeat(withTiming(1, { duration: def.ms, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(t);
  }, [def, reduce, t]);

  const near = colors.text;
  const far = colors.textSecondary;
  const { minY, height } = tracks.view;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Animación del ejercicio ${exercise.name}`}
      style={[styles.box, { maxWidth, backgroundColor: colors.accentSoft, aspectRatio: VIEW_W / Math.max(78, height * 0.82) }]}
    >
      <Svg width="100%" height="100%" viewBox={`0 ${minY} ${VIEW_W} ${height}`}>
        <Line x1={4} y1={FLOOR + 1.5} x2={VIEW_W - 4} y2={FLOOR + 1.5} stroke={colors.separator} strokeWidth={1} strokeLinecap="round" />
        {tracks.props.map((p) => (
          <Rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={1.5} fill={colors.surfaceStrong} />
        ))}
        <Segment t={t} tracks={tracks} from="neck" to="el2" color={far} width={2.8} opacity={0.75} />
        <Segment t={t} tracks={tracks} from="el2" to="wr2" color={far} width={2.8} opacity={0.75} />
        <Segment t={t} tracks={tracks} from="hip" to="kn2" color={far} width={3.2} opacity={0.75} />
        <Segment t={t} tracks={tracks} from="kn2" to="an2" color={far} width={3.2} opacity={0.75} />
        <Segment t={t} tracks={tracks} from="an2" to="to2" color={far} width={3.2} opacity={0.75} />
        <Segment t={t} tracks={tracks} from="hip" to="neck" color={near} width={3.6} />
        <Segment t={t} tracks={tracks} from="hip" to="kn1" color={near} width={3.6} />
        <Segment t={t} tracks={tracks} from="kn1" to="an1" color={near} width={3.6} />
        <Segment t={t} tracks={tracks} from="an1" to="to1" color={near} width={3.6} />
        <Segment t={t} tracks={tracks} from="neck" to="el1" color={near} width={3} />
        <Segment t={t} tracks={tracks} from="el1" to="wr1" color={near} width={3} />
        {def.band ? <Segment t={t} tracks={tracks} from={def.band.from} to={def.band.to} color={colors.accent} width={0.9} /> : null}
        <Dot t={t} xs={tracks.x.head} ys={tracks.y.head} r={HEAD_R} color={colors.accent} samples={tracks.samples} />
        {tracks.ball ? <Dot t={t} xs={tracks.ball.x} ys={tracks.ball.y} r={tracks.ball.r} color={tracks.ball.kind === 'rodillo' ? colors.textSecondary : colors.accent} samples={tracks.samples} /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: '100%', alignSelf: 'center', borderRadius: radii.card, padding: spacing.sm, overflow: 'hidden' },
});
