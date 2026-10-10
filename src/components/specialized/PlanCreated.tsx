import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { weekdayMonday0 } from '../../core/dates';
import { haptics, radii, spacing, useTheme } from '../../theme';
import type { PlannedSession } from '../../types';
import { AppText } from '../common/AppText';
import { GlassSurface } from '../common/GlassSurface';
import { Icon, type IconName } from '../common/Icon';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
const KIND_ICON: Record<PlannedSession['kind'], IconName> = {
  fuerza: 'dumbbell.fill',
  prevencion: 'shield.fill',
  velocidad: 'bolt.fill',
  tecnica: 'soccerball',
  recuperacion: 'leaf.fill',
  descanso: 'moon.fill',
};

export interface PlanCreatedProps {
  week: readonly PlannedSession[];
  /** Pasos que se muestran mientras "se arma" el plan. */
  tasks: readonly string[];
  /** Texto bajo el título cuando el plan está listo (por ejemplo, la explicación de la IA). */
  note?: string;
  onReady?: () => void;
}

const STEP_MS = 650;

/**
 * Pantalla de "plan creado": primero una lista de pasos que se van marcando y después el plan de la semana
 * con una insignia de confirmación. Se usa al terminar el cuestionario y al generar el plan con IA.
 */
export function PlanCreated({ week, tasks, note, onReady }: PlanCreatedProps): React.JSX.Element {
  const { colors } = useTheme();
  const [done, setDone] = useState(0);
  const ready = done >= tasks.length;
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  });

  useEffect(() => {
    if (ready) {
      haptics.success();
      readyRef.current?.();
      return undefined;
    }
    const id = setTimeout(() => {
      haptics.selection();
      setDone((d) => d + 1);
    }, STEP_MS);
    return () => clearTimeout(id);
  }, [done, ready, tasks.length]);

  if (!ready) {
    return (
      <View style={styles.wrap}>
        <Animated.View entering={FadeIn} style={[styles.badge, { backgroundColor: colors.surfaceStrong }]}>
          <Icon name="sparkles" size={34} color={colors.pitch} />
        </Animated.View>
        <AppText variant="title" style={styles.center}>Armando tu plan…</AppText>
        <View style={styles.tasks}>
          {tasks.map((t, i) => (
            <Animated.View key={t} entering={FadeInDown.delay(i * 80).springify().damping(18)} style={[styles.task, i > done && styles.pending]}>
              <Icon name={i < done ? 'checkmark.circle.fill' : 'circle.fill'} size={i < done ? 22 : 10} color={i < done ? colors.pitch : colors.textSecondary} />
              <AppText variant="callout" tone={i < done ? 'primary' : 'secondary'}>{t}</AppText>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  }

  const sessions = week.filter((s) => s.kind !== 'descanso');
  const minutes = sessions.reduce((n, s) => n + s.estimatedMinutes, 0);
  return (
    <View style={styles.wrap}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.badge, { backgroundColor: colors.pitch }]}>
        <Icon name="checkmark" size={38} color="#FFFFFF" />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.head}>
        <AppText variant="title" style={styles.center}>Tu plan está listo</AppText>
        <AppText variant="callout" tone="secondary" style={styles.center}>
          {note || `${sessions.length} sesiones esta semana · unos ${minutes} min en total`}
        </AppText>
      </Animated.View>
      <View style={styles.list}>
        {week.map((s, i) => {
          const rest = s.kind === 'descanso';
          return (
            <Animated.View key={s.date} entering={FadeInDown.delay(300 + i * 70).springify().damping(18)}>
              <GlassSurface radius={radii.card} flat>
                <View style={styles.row}>
                  <View style={[styles.tile, { backgroundColor: rest ? colors.surfaceStrong : colors.pitch }]}>
                    <Icon name={KIND_ICON[s.kind]} size={18} color={rest ? colors.textSecondary : '#FFFFFF'} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="caption" tone="secondary">{i === 0 ? 'Hoy' : DAY_NAMES[weekdayMonday0(s.date)]}</AppText>
                    <AppText variant="headline" tone={rest ? 'secondary' : 'primary'}>{s.title}</AppText>
                  </View>
                  {rest ? null : <AppText variant="caption" tone="secondary">{s.estimatedMinutes} min</AppText>}
                </View>
              </GlassSurface>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.lg },
  badge: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  head: { gap: spacing.xs, alignSelf: 'stretch' },
  center: { textAlign: 'center' },
  tasks: { alignSelf: 'stretch', gap: spacing.md, paddingHorizontal: spacing.lg },
  task: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pending: { opacity: 0.7 },
  list: { alignSelf: 'stretch', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
});
