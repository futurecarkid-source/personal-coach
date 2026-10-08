import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useOnlineGate } from '../../hooks/useOnlineGate';
import { spacing, useTheme } from '../../theme';
import { AppText } from './AppText';
import { GlassButton } from './GlassButton';

/**
 * Regla "primero en línea": pasadas 72 horas sin conexión con el servicio, se pide conectarse.
 * Tus datos siguen guardados en el dispositivo; en una urgencia de salud llama al número de emergencias de tu país.
 */
export function OnlineGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { colors } = useTheme();
  const { result, retry, checking } = useOnlineGate();
  if (result.status !== 'bloqueado') return <>{children}</>;
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <AppText variant="title" style={styles.center}>Conéctate a internet</AppText>
      <AppText variant="body" tone="secondary" style={styles.center}>
        Llevas más de 72 horas sin conexión. Conéctate para sincronizar y seguir usando la app. Tus datos están guardados en este dispositivo y no se pierden.
      </AppText>
      <AppText variant="caption" tone="secondary" style={styles.center}>
        Si tienes una emergencia de salud, no esperes a la app: llama al número de emergencias de tu país.
      </AppText>
      <GlassButton label={checking ? 'Comprobando…' : 'Reintentar'} variant="primary" onPress={retry} disabled={checking} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  center: { textAlign: 'center' },
});
