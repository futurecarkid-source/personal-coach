import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../theme';

/**
 * Pila de navegación nativa de cada pestaña: título grande de iOS que se contrae al desplazar,
 * barra transparente con vidrio (iOS 26) y gesto de volver deslizando.
 */
export function TabStack({ title, screen = 'index' }: { title: string; screen?: string }): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        headerLargeTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name={screen} options={{ title }} />
    </Stack>
  );
}
