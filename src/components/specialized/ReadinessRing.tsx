import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import type { Readiness, ReadinessLevel } from '../../core/readiness';
import { springs, useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';

const SIZE = 132;
const STROKE = 13;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WORD: Record<ReadinessLevel, string> = { listo: 'Listo', moderado: 'Moderado', descansa: 'Descansa' };
const ADVICE: Record<ReadinessLevel, string> = {
  listo: 'Tu cuerpo está para entrenar con normalidad.',
  moderado: 'Entrena, pero escucha a tu cuerpo y no subas la carga.',
  descansa: 'Hoy prioriza recuperación o descanso.',
};
const CONF = { baja: 'confianza baja', media: 'confianza media', alta: 'confianza alta' } as const;

/** Anillo de Preparación (estilo Apple Fitness) con palabra y color suave; los detalles son opcionales. */
export function ReadinessRing({ readiness }: { readiness: Readiness }): React.JSX.Element {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withSpring(readiness.score / 100, springs.smooth));
  }, [readiness.score, progress]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - progress.get()) }));
  const color = readiness.level === 'listo' ? colors.success : readiness.level === 'moderado' ? colors.warning : colors.danger;
  const m = readiness.metrics;

  return (
    <GlassCard>
      <View style={styles.row}>
        <View style={styles.ring} accessible accessibilityLabel={`Preparación ${readiness.score} de 100, ${WORD[readiness.level]}`}>
          <Svg width={SIZE} height={SIZE}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.surfaceStrong} strokeWidth={STROKE} fill="none" />
            <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={color} strokeWidth={STROKE} strokeLinecap="round" fill="none" strokeDasharray={`${C} ${C}`} animatedProps={props} transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`} />
          </Svg>
          <View style={styles.center} pointerEvents="none">
            <AppText variant="digits">{readiness.score}</AppText>
            <AppText variant="caption" tone="secondary">de 100</AppText>
          </View>
        </View>
        <View style={styles.texts}>
          <AppText variant="caption" tone="secondary">PREPARACIÓN</AppText>
          <AppText variant="title">{WORD[readiness.level]}</AppText>
          <AppText variant="callout" tone="secondary">{ADVICE[readiness.level]}</AppText>
          <AppText variant="caption" tone="secondary">{readiness.calibrating ? 'Calibrando · ' : ''}{CONF[readiness.confidence]}</AppText>
        </View>
      </View>
      <View style={styles.more}>
        <GlassButton label={open ? 'Ocultar detalles' : 'Detalles'} size="compact" haptic="light" onPress={() => setOpen((v) => !v)} />
        {open ? (
          <View style={styles.details}>
            {readiness.reasons.map((r) => <AppText key={r} variant="callout">• {r}</AppText>)}
            <AppText variant="callout" tone="secondary">
              Carga aguda {Math.round(m.acute)} · crónica {Math.round(m.chronic)} · ACWR {m.acwr === null ? 'sin datos' : m.acwr.toFixed(2)}
              {m.monotony !== null ? ` · monotonía ${m.monotony.toFixed(1)}` : ''}
            </AppText>
            <AppText variant="caption" tone="secondary">
              El ACWR compara tu carga de los últimos 7 días con la de 28; es un indicador de cambios de carga, no predice lesiones. Los primeros 28 días se está calibrando.
            </AppText>
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ring: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  texts: { flex: 1, gap: 2 },
  more: { marginTop: 12, gap: 8 },
  details: { gap: 6 },
});
