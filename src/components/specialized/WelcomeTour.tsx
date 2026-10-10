import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { spacing, useTheme } from '../../theme';
import { AppText } from '../common/AppText';
import { GlassButton } from '../common/GlassButton';
import { GlassCard } from '../common/GlassCard';
import { Icon, type IconName } from '../common/Icon';

const STEPS: readonly { icon: IconName; title: string; text: string }[] = [
  { icon: 'figure.run', title: 'Entrena cada día', text: 'En Hoy ves tu sesión. Toca Empezar y sigue las fotos de cada ejercicio.' },
  { icon: 'flame.fill', title: 'Cuida tu racha', text: 'Entrenar, hacer el check-in o registrar descanso mantiene tu racha y te da XP.' },
  { icon: 'sportscourt', title: 'Registra tus partidos', text: 'En Partido anotas goles, pases y acciones; tu tarjeta mejora con lo que haces.' },
  { icon: 'sparkles', title: 'Pídele a tu coach', text: 'El botón Coach responde dudas y ajusta tu plan. Con IA es aún mejor.' },
];

/** Guía de cuatro pasos que se muestra una sola vez en la pantalla Hoy. */
export function WelcomeTour({ onDone }: { onDone: () => void }): React.JSX.Element {
  const { colors } = useTheme();
  const [i, setI] = useState(0);
  const step = STEPS[i]!;
  const last = i === STEPS.length - 1;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <GlassCard>
        <View style={styles.row}>
          <View style={[styles.tile, { backgroundColor: colors.pitch }]}>
            <Icon name={step.icon} size={22} color="#FFFFFF" />
          </View>
          <View style={styles.flex}>
            <AppText variant="label" tone="secondary">Guía rápida · {i + 1} de {STEPS.length}</AppText>
            <AppText variant="headline">{step.title}</AppText>
          </View>
        </View>
        <AppText variant="callout" tone="secondary" style={styles.text}>{step.text}</AppText>
        <View style={styles.actions}>
          <GlassButton label="Saltar" size="compact" variant="secondary" haptic="light" onPress={onDone} />
          <GlassButton label={last ? 'Entendido' : 'Siguiente'} size="compact" variant="go" haptic="medium" onPress={() => (last ? onDone() : setI(i + 1))} />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  text: { marginTop: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
});
